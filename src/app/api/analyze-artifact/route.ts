import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { openai } from "@/lib/openai/client";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE_MB,
} from "@/lib/constants";
import type {
  AnalyzeArtifactError,
  AnalyzeArtifactResponse,
  ArtifactVisionAnalysis,
} from "@/types/ai-analysis";

export const runtime = "nodejs";

const MAX_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const FORM_FIELD = "image";

const SYSTEM_PROMPT = `You are an expert archaeologist and digital heritage conservator. Analyze the uploaded image and output a JSON object with:
{
  "suggested_title": "Short descriptive title",
  "era_estimation": "e.g., Tang Dynasty / 19th Century / Unknown",
  "category": "e.g., Stone Carving, Ceramic, Architecture, Bronzeware",
  "ai_tags": ["tag1", "tag2", "tag3"],
  "preservation_status": "Intact / Minor Damage / Severe Degradation / Ruin",
  "short_description": "2-3 sentences explaining the artifact's style, cultural significance, or key details."
}`;

const artifactAnalysisSchema = z.object({
  suggested_title: z.string().min(1),
  era_estimation: z.string().min(1),
  category: z.string().min(1),
  ai_tags: z.array(z.string()).min(1),
  preservation_status: z.string().min(1),
  short_description: z.string().min(1),
});

function errorResponse(
  error: string,
  status: number,
  details?: string,
): NextResponse<AnalyzeArtifactError> {
  return NextResponse.json(
    details ? { error, details } : { error },
    { status },
  );
}

function isFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

async function fileToDataUrl(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  return `data:${file.type};base64,${base64}`;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<AnalyzeArtifactResponse | AnalyzeArtifactError>> {
  if (!process.env.OPENAI_API_KEY) {
    return errorResponse(
      "OpenAI API key is not configured",
      503,
      "Set OPENAI_API_KEY in your environment.",
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse(
      "Invalid request body",
      400,
      "Expected multipart/form-data with an image file.",
    );
  }

  const entry = formData.get(FORM_FIELD);

  if (!isFile(entry)) {
    return errorResponse(
      "Missing image file",
      400,
      `Include a non-empty file in the "${FORM_FIELD}" form field.`,
    );
  }

  if (
    !ACCEPTED_IMAGE_TYPES.includes(
      entry.type as (typeof ACCEPTED_IMAGE_TYPES)[number],
    )
  ) {
    return errorResponse(
      "Unsupported image type",
      400,
      `Accepted types: ${ACCEPTED_IMAGE_TYPES.join(", ")}.`,
    );
  }

  if (entry.size > MAX_BYTES) {
    return errorResponse(
      "File too large",
      413,
      `Maximum upload size is ${MAX_UPLOAD_SIZE_MB} MB.`,
    );
  }

  let dataUrl: string;

  try {
    dataUrl = await fileToDataUrl(entry);
  } catch {
    return errorResponse(
      "Failed to read uploaded file",
      400,
      "The image could not be buffered for analysis.",
    );
  }

  let rawContent: string | null | undefined;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this artifact image and return the JSON object described in your instructions.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ],
        },
      ],
    });

    rawContent = completion.choices[0]?.message?.content;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown OpenAI API error";

    return errorResponse(
      "Vision analysis failed",
      502,
      message,
    );
  }

  if (!rawContent) {
    return errorResponse(
      "Empty response from vision model",
      502,
      "GPT-4o returned no content.",
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawContent);
  } catch {
    return errorResponse(
      "Invalid JSON from vision model",
      422,
      "The model response could not be parsed as JSON.",
    );
  }

  const validated = artifactAnalysisSchema.safeParse(parsed);

  if (!validated.success) {
    return errorResponse(
      "Analysis schema validation failed",
      422,
      validated.error.flatten().formErrors.join("; ") ||
        "Response missing required fields.",
    );
  }

  const analysis: ArtifactVisionAnalysis = validated.data;

  return NextResponse.json({ analysis }, { status: 200 });
}
