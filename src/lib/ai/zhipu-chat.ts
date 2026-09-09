/**
 * 智谱 GLM 文本对话 client（OpenAI 兼容接口）。
 *
 * 模型：glm-4-flash（永久免费、国内直连、无需信用卡）。
 * 接口：https://open.bigmodel.cn/api/paas/v4/chat/completions
 * 认证：Authorization: Bearer <ZHIPU_API_KEY>
 *
 * 与视觉 provider 相同的注意事项：Node 22 的 undici 在同时使用
 * AbortSignal.timeout + 含非 ASCII 字符的大 body 时会抛
 * "Cannot convert argument to a ByteString ... > 255"。规避办法：
 * 1) 显式把 body 转成 Buffer，绕过字符串 body 的该校验；
 * 2) 不用 AbortSignal.timeout，改用手动 setTimeout 控制超时。
 */

const ZHIPU_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** 智谱「联网搜索」返回的单条结果（顶层 web_search 数组元素） */
export interface WebSearchResult {
  title?: string;
  link?: string;
  media?: string;
  content?: string;
  icon?: string;
  refer?: string;
  publish_date?: string;
}

/** 对话返回值：正文 + （开启联网搜索时的）真实检索来源 */
export interface ChatResult {
  text: string;
  webSearch: WebSearchResult[];
}

export interface ChatOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** 启用智谱「联网搜索」：复用同一 ZHIPU_API_KEY，平台服务端自动检索并把答案写入 content。 */
  webSearch?: boolean;
}

/** 智谱联网搜索工具定义（enable=true 时由平台自动判断是否检索） */
const WEB_SEARCH_TOOL = {
  type: "web_search",
  web_search: { enable: true, search_result: true },
} as const;

/**
 * 调用智谱 GLM 文本对话，返回助手消息文本与联网搜索来源。
 * 若未配置 ZHIPU_API_KEY 或调用失败，抛出带可读信息的错误。
 */
export async function chatWithZhipuFull(
  opts: ChatOptions
): Promise<ChatResult> {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    throw new Error(
      "未配置 ZHIPU_API_KEY。请在 .env.local 设置后重启服务（智谱开放平台 open.bigmodel.cn 免费获取）。"
    );
  }

  const model = opts.model || process.env.ZHIPU_CHAT_MODEL || "glm-4-flash";
  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1024,
  };
  if (opts.webSearch) {
    body.tools = [WEB_SEARCH_TOOL];
  }

  // 关键：转 Buffer 绕过中文 body 的 ByteString 校验
  const bodyBytes = Buffer.from(JSON.stringify(body), "utf-8");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25_000);

  let res: Response;
  try {
    res = await fetch(ZHIPU_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: bodyBytes,
      signal: controller.signal,
    });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") {
      throw new Error("智谱 GLM 请求超时（25s）");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const errJson = (await res.json()) as {
        error?: { message?: string };
      };
      if (errJson?.error?.message) detail = errJson.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(`智谱 GLM 调用失败（${detail}）`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    web_search?: WebSearchResult[];
  };
  const text = json.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("智谱 GLM 返回内容为空");
  return {
    text,
    webSearch: Array.isArray(json.web_search) ? json.web_search : [],
  };
}

/** 只要文本的便捷封装（联想词等场景仍返回字符串，保持向后兼容） */
export async function chatWithZhipu(opts: ChatOptions): Promise<string> {
  return (await chatWithZhipuFull(opts)).text;
}
