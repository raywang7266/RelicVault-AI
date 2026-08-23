/**
 * Gemini（Google AI Studio）文物识图打标签客户端。
 *
 * 调用 Google Generative Language API（REST，无需额外 SDK 依赖）：
 *   POST https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent
 * 认证：请求头 `x-goog-api-key: <GEMINI_API_KEY>`。
 *
 * 能力：
 * - 多模态图片理解（inline_data 传 base64 图片）；
 * - 联网搜索 grounding（`tools:[{ googleSearch:{} }]`），让模型在识别文物时
 *   可借助 Google 搜索交叉验证年代 / 门类 / 文化属性，提高准确性；
 * - 结构化 JSON 输出（`generationConfig.responseJsonSchema`），保证字段稳定。
 *
 * Key 来源：https://aistudio.google.com/apikey （免费-tier 即可，Gemini 2.0 Flash）。
 */

const GEMINI_ENDPOINT_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

/** 默认模型：gemini-3.6-flash（2026 起 gemini-2.0-flash 已下线，自动升级到新模型） */
const DEFAULT_MODEL = "gemini-3.6-flash";

/** 识图打标的结构化输出 schema（与前端 ArtifactUploadForm 字段对齐） */
const ARTIFACT_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "简短的文物名称/标题，如「清·粉彩百花葫芦瓶」",
    },
    era: {
      type: "string",
      description:
        "年代/朝代估计，如「清乾隆」「西周早期」「汉」「Unknown（未知）」",
    },
    category: {
      type: "string",
      description:
        "文物门类/材质，如「陶瓷器」「金属器」「玉石」「书画」「织物」「其他」",
    },
    preservationStatus: {
      type: "string",
      enum: ["Intact", "Minor Damage", "Severe Degradation", "Ruin"],
      description: "保存状态：Intact 完整 / Minor Damage 微损 / Severe Degradation 残损 / Ruin 残毁",
    },
    description: {
      type: "string",
      description: "2-4 句中文描述，说明文物的风格、文化意义或关键细节",
    },
    tags: {
      type: "array",
      items: { type: "string" },
      description: "3-8 个短标签/关键词，如「粉彩」「官窑」「礼器」「瑞兽」",
    },
  },
  required: [
    "title",
    "era",
    "category",
    "preservationStatus",
    "description",
    "tags",
  ],
} as const;

const SYSTEM_PROMPT = `你是一位资深的考古学家与数字遗产保护专家。请分析用户上传的文物图片，并结合联网搜索（Google Search grounding）对所识别的年代、门类与文化属性进行交叉验证，以提高准确性。

输出要求：
- 用中文填写 title / era / category / description / tags；
- era 尽量给出具体朝代或时期（如「唐」「北宋」「清乾隆」「新石器」），无法确定时填「Unknown（未知）」；
- category 从「陶瓷器 / 金属器 / 玉石 / 书画 / 织物 / 其他」中选择最贴切的一个；
- preservationStatus 严格从给定枚举中选一个；
- tags 为 3-8 个精炼关键词，便于检索；
- description 用 2-4 句中文说明其风格、工艺、文化意义或关键细节。
只输出符合给定 JSON schema 的结构化结果。`;

export interface GeminiArtifactAnalysis {
  title: string;
  era: string;
  category: string;
  preservationStatus: "Intact" | "Minor Damage" | "Severe Degradation" | "Ruin" | string;
  description: string;
  tags: string[];
}

interface GenerateContentResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  error?: { code?: number; message?: string; status?: string };
}

/**
 * 调用 Gemini 对单张文物图片做识图打标。
 *
 * @param dataUrl 形如 `data:<mime>;base64,<data>` 的图片 data URL
 * @param mimeType 图片 MIME（image/jpeg|png|webp），用于 inline_data
 * @returns 结构化分析结果；失败抛错（上层 route 负责转 HTTP 错误）
 */
export async function analyzeArtifactWithGemini(
  dataUrl: string,
  mimeType: string
): Promise<GeminiArtifactAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY 未配置。请在 .env.local 中设置后重启服务。"
    );
  }

  const base64 =
    dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;

  const url = `${GEMINI_ENDPOINT_BASE}/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              "请分析这张文物图片，并结合联网搜索交叉验证，返回结构化 JSON。",
          },
          {
            inline_data: { mime_type: mimeType, data: base64 },
          },
        ],
      },
    ],
    tools: [{ googleSearch: {} }],
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: ARTIFACT_SCHEMA,
      maxOutputTokens: 1024,
      temperature: 0.4,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // 图片分析偶发较慢，给足超时（Next.js 路由默认约 10s，这里显式 25s）
    signal: AbortSignal.timeout(25_000),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const errJson = (await res.json()) as GenerateContentResponse;
      if (errJson?.error?.message) detail = errJson.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(`Gemini 调用失败（${detail}）`);
  }

  const json = (await res.json()) as GenerateContentResponse;

  const text = json.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("");

  if (!text) {
    throw new Error("Gemini 返回内容为空");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini 返回的内容不是合法 JSON");
  }

  const a = parsed as Partial<GeminiArtifactAnalysis>;
  if (
    !a.title ||
    !a.era ||
    !a.category ||
    !a.preservationStatus ||
    !Array.isArray(a.tags) ||
    !a.description
  ) {
    throw new Error("Gemini 返回缺少必要字段");
  }

  return {
    title: String(a.title),
    era: String(a.era),
    category: String(a.category),
    preservationStatus: a.preservationStatus as GeminiArtifactAnalysis["preservationStatus"],
    description: String(a.description),
    tags: (a.tags as unknown[]).map((t) => String(t)),
  };
}
