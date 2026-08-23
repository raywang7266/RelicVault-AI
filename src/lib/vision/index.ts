/**
 * 视觉 provider 工厂。
 *
 * 通过环境变量 AI_PROVIDER 选择后端：
 *   - zhipu（默认）   → 智谱 GLM glm-4v-flash（国内直连、永久免费）
 *   - siliconflow     → 硅基流动（待接入，预留）
 *   - gemini          → Google Gemini（香港不可用，保留兼容）
 *
 * 未设置或未知值时回退到 zhipu。
 */

import type { VisionProvider } from "./types";
import { ZhipuVisionProvider } from "./zhipu";

export type VisionProviderKind = "zhipu" | "siliconflow" | "gemini";

function resolveKind(): VisionProviderKind {
  const raw = (process.env.AI_PROVIDER || "zhipu").toLowerCase().trim();
  if (raw === "siliconflow" || raw === "gemini") return raw;
  return "zhipu";
}

/**
 * 创建当前配置对应的视觉 provider 实例。
 * 若所需 key 未配置，抛出带可读提示的错误。
 */
export function createVisionProvider(): VisionProvider {
  const kind = resolveKind();

  if (kind === "zhipu") {
    const key = process.env.ZHIPU_API_KEY;
    if (!key) {
      throw new Error(
        "未配置 ZHIPU_API_KEY。请在 .env.local 设置后重启服务（智谱开放平台 open.bigmodel.cn 免费获取）。"
      );
    }
    return new ZhipuVisionProvider(key, process.env.ZHIPU_MODEL);
  }

  if (kind === "siliconflow") {
    const key = process.env.SILICONFLOW_API_KEY;
    if (!key) {
      throw new Error(
        "未配置 SILICONFLOW_API_KEY。请在 .env.local 设置后重启服务。"
      );
    }
    // 预留：SiliconFlow 同为 OpenAI 兼容，后续实现复用 ZhipuVisionProvider 思路即可。
    throw new Error("SiliconFlow provider 尚未实现，请暂用 AI_PROVIDER=zhipu。");
  }

  // gemini（保留兼容，但香港不可用）
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "未配置 GEMINI_API_KEY。注意：Google 服务在香港不可用，建议使用 AI_PROVIDER=zhipu。"
    );
  }
  throw new Error(
    "Gemini provider 已停用（Google 服务在香港不可用）。请设置 AI_PROVIDER=zhipu 并使用 ZHIPU_API_KEY。"
  );
}

export function currentProviderKind(): VisionProviderKind {
  return resolveKind();
}
