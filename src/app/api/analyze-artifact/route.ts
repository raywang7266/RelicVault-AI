import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

import { createVisionProvider, currentProviderKind } from "@/lib/vision";
import type { VisionImage } from "@/lib/vision/types";
import { isLocale, localeToZhipuLanguage } from "@/lib/i18n/locales";
import type {
  AnalyzeArtifactError,
  AnalyzeArtifactResponse,
} from "@/types/ai-analysis";

export const runtime = "nodejs";
export const maxDuration = 30;

/** 前端 ArtifactUploadForm.handleAIAnalyze 发送的是 JSON：{ image: dataURL, locale? } */
/** 最多同时识图的张数（前端上限一致） */
const MAX_IMAGES = 6;
/** 智谱对单次请求图片总体积的上限（base64 后约 10MB） */
const MAX_TOTAL_BASE64 = 10 * 1024 * 1024;

const requestSchema = z.object({
  /** 单图（旧字段，保留兼容） */
  image: z.string().min(1).startsWith("data:").optional(),
  /** 多图（首选；第一张为封面/主图） */
  images: z
    .array(z.string().min(1).startsWith("data:"))
    .max(MAX_IMAGES, `最多同时识别 ${MAX_IMAGES} 张图片`)
    .optional(),
  locale: z.string().optional(),
});

function errorResponse(
  error: string,
  status: number,
  details?: string
): NextResponse<AnalyzeArtifactError> {
  return NextResponse.json(
    details ? { error, details } : { error },
    { status }
  );
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<AnalyzeArtifactResponse | AnalyzeArtifactError>> {
  try {
    // 1) 解析前端 JSON 请求体
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(
        "请求体格式错误",
        400,
        "期望 JSON：{ \"image\": \"data:<mime>;base64,...\" }"
      );
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "缺少图片数据",
        400,
        "请求需包含非空的 image（base64 data URL）。"
      );
    }

    // 统一收敛为图片数组：优先用 images，回退到旧的 image 单图字段
    const imageList =
      parsed.data.images && parsed.data.images.length > 0
        ? parsed.data.images
        : parsed.data.image
          ? [parsed.data.image]
          : [];

    if (imageList.length === 0) {
      return errorResponse(
        "缺少图片数据",
        400,
        "请求需包含非空的 image 或 images（base64 data URL）。"
      );
    }

    // 智谱对单次请求的图片**总体积**有上限（base64 约 10MB），超限只会返回
    // 含糊的「API 调用参数有误」。前端发送前已逐张压缩；这里是兜底：给出可
    // 操作的提示（而不是笼统的 502），便于定位与提示用户。
    const totalBase64 = imageList.reduce((sum, u) => sum + u.length, 0);
    if (totalBase64 > MAX_TOTAL_BASE64) {
      return errorResponse(
        "图片过大",
        413,
        `图片总体积超出 AI 识图上限（base64 后约 10MB，当前约 ${(totalBase64 / 1024 / 1024).toFixed(1)}MB），请减少张数或压缩后重试。`
      );
    }

    const visionImages: VisionImage[] = imageList.map((dataUrl) => {
      const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
      return {
        dataUrl,
        mimeType: mimeMatch ? mimeMatch[1] : "image/jpeg",
      };
    });

    // 读取界面语言（cookie rv_locale 为权威来源），让 AI 输出跟随语言
    const cookieLocale = cookies().get("rv_locale")?.value;
    const locale = isLocale(cookieLocale) ? cookieLocale : "zh-CN";
    const outputLang = localeToZhipuLanguage(locale);

    // 2) 调用视觉 provider 识图打标（默认智谱 GLM，国内直连）
    let analysis;
    try {
      const provider = createVisionProvider();
      analysis = await provider.analyzeArtifact(visionImages, outputLang);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "AI 识图失败（未知错误）";
      const providerName = currentProviderKind();
      // 把典型错误映射成可读状态码，避免笼统的 502
      const status = /429|quota|RESOURCE_EXHAUSTED|rate/i.test(message)
        ? 429
        : /404|no longer available|NOT_FOUND/i.test(message)
          ? 404
          : /400|INVALID_ARGUMENT|key/i.test(message)
            ? 400
            : 502;
      return errorResponse(
        `AI 识图失败（${providerName}）`,
        status,
        message
      );
    }

    // 3) 返回前端期望的扁平字段（与 handleAIAnalyze 的 result.xxx 对齐）
    const response: AnalyzeArtifactResponse = { analysis };
    return NextResponse.json(response, { status: 200 });
  } catch (unexpected) {
    // 任何未预期的崩溃都返回明确的 500 + 信息，而不是裸 502
    const message =
      unexpected instanceof Error ? unexpected.message : "未知服务端错误";
    return errorResponse("服务端异常", 500, message);
  }
}
