/**
 * 智谱 GLM 视觉 provider（OpenAI 兼容接口）。
 *
 * 模型：glm-4v-flash（永久免费、国内直连、无需信用卡，仅限并发不限制 token）。
 * 接口：https://open.bigmodel.cn/api/paas/v4/chat/completions
 * 认证：Authorization: Bearer <ZHIPU_API_KEY>
 * 图片：content 里放 { type:"image_url", image_url:{ url:"data:<mime>;base64,..." } }
 * 结构化：response_format: { type:"json_object" } + system 指令约束字段。
 */

import type { VisionAnalysisResult, VisionProvider } from "./types";

const ZHIPU_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const DEFAULT_MODEL = "glm-4v-flash";

/**
 * 根据界面语言生成 system prompt。
 * - 文本字段（标题/年代/描述/标签）跟随 lang（简体中文/繁體中文/English）；
 * - category（门类/材质）始终要求中文六选一，因其用于前端筛选与存储，不随语言变；
 * - preservationStatus 始终用英文枚举，与存储无关。
 */
function buildSystemPrompt(lang: string): string {
  const eraExample =
    lang === "English" ? "Qing Qianlong / Western Zhou / Han / Unknown" :
    lang === "繁體中文" ? "清乾隆 / 西周早期 / 漢 / 未知" :
    "清乾隆 / 西周早期 / 汉 / Unknown（未知）";
  const tagExample =
    lang === "English" ? "famille-rose, imperial kiln, ritual vessel, auspicious beast" :
    lang === "繁體中文" ? "粉彩、官窯、禮器、瑞獸" :
    "粉彩、官窑、礼器、瑞兽";
  const descLang =
    lang === "English" ? "2-4 sentences in English" :
    lang === "繁體中文" ? "2-4 句繁體中文" :
    "2-4 句简体中文";
  const unknownWord = lang === "English" ? "Unknown" : lang === "繁體中文" ? "未知" : "Unknown（未知）";

  return `你是一位资深的考古学家与数字遗产保护专家。请分析用户上传的文物图片，并结合你掌握的知识对年代、门类与文化属性做出判断。

请严格只输出一个 JSON 对象，不要有任何额外文字、markdown 代码块或解释。JSON 结构如下：
{
  "title": "简短的文物名称/标题（${lang}）",
  "era": "年代/朝代估计（${lang}），如「${eraExample}」",
  "category": "文物门类/材质，从「陶瓷器 / 金属器 / 玉石 / 书画 / 织物 / 其他」中选择最贴切的一个（始终用简体中文）",
  "preservationStatus": "保存状态，严格从「Intact / Minor Damage / Severe Degradation / Ruin」中选一个（始终用英文）",
  "description": "${descLang}，说明文物的风格、文化意义或关键细节",
  "tags": ["3-8个短标签/关键词（${lang}），如「${tagExample}」"]
}
填写要求：
- 所有文本字段（title / era / description / tags）使用 ${lang}；
- era 尽量给出具体朝代或时期，无法确定时填「${unknownWord}」；
- category 必须从给定六个中文选项中选（不翻译）；
- preservationStatus 必须严格是四个英文枚举值之一；
- tags 为 3-8 个精炼关键词，便于检索。`;
}

export class ZhipuVisionProvider implements VisionProvider {
  readonly name = "智谱 GLM";
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || DEFAULT_MODEL;
  }

  async analyzeArtifact(
    dataUrl: string,
    mimeType: string,
    lang = "简体中文"
  ): Promise<VisionAnalysisResult> {
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    const systemPrompt = buildSystemPrompt(lang);

    const body = {
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `请分析这张文物图片，返回符合上述 JSON schema 的结构化结果（文本字段使用 ${lang}）。`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 1024,
    };

    // 注意：Node 22 的 undici 在同时使用 AbortSignal.timeout + 含非 ASCII
    // 字符（如中文）的大 body 时，会对 body 做 ByteString 校验并抛
    // "Cannot convert argument to a ByteString ... > 255"。规避办法：
    // 1) 显式把 body 转成 Buffer（Uint8Array），绕过字符串 body 的该校验；
    // 2) 不用 AbortSignal.timeout，改用手动 setTimeout 控制超时。
    const bodyBytes = Buffer.from(JSON.stringify(body), "utf-8");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);

    let res: Response;
    try {
      res = await fetch(ZHIPU_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
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
    };
    const text = json.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("智谱 GLM 返回内容为空");

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("智谱 GLM 返回的内容不是合法 JSON");
    }

    const a = parsed as Partial<VisionAnalysisResult>;
    if (
      !a.title ||
      !a.era ||
      !a.category ||
      !a.preservationStatus ||
      !Array.isArray(a.tags) ||
      !a.description
    ) {
      throw new Error("智谱 GLM 返回缺少必要字段");
    }

    return {
      title: String(a.title),
      era: String(a.era),
      category: String(a.category),
      preservationStatus: a.preservationStatus as VisionAnalysisResult["preservationStatus"],
      description: String(a.description),
      tags: (a.tags as unknown[]).map((t) => String(t)),
    };
  }
}
