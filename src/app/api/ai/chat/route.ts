import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

import {
  chatWithZhipuFull,
  type ChatMessage,
  type WebSearchResult,
} from "@/lib/ai/zhipu-chat";
import {
  getPageType,
  pageContextInfo,
} from "@/lib/ai/page-context";
import { buildReferences } from "@/lib/ai/references";
import {
  isLocale,
  localeToZhipuLanguage,
  type Locale,
} from "@/lib/i18n/locales";

export const runtime = "nodejs";
export const maxDuration = 45;

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(20),
  context: z
    .object({
      path: z.string().optional(),
      pageType: z.string().optional(),
      pageText: z.string().max(12000).optional(),
    })
    .optional(),
  locale: z.string().optional(),
});

function errorResponse(error: string, status: number, details?: string) {
  return NextResponse.json(
    details ? { error, details } : { error },
    { status }
  );
}

/** 根据语言构建系统提示词（描述 RelicVault + 当前页面上下文 + 真实页面文本 + 联网搜索） */
function buildSystemPrompt(
  locale: Locale,
  pageType: string,
  pageText: string,
  webSearch: boolean
): string {
  const lang = localeToZhipuLanguage(locale);
  const pageDesc = pageContextInfo(pageType, locale);
  // 客户端抓到的真实页面文本：让助手能引用页面里具体出现的内容
  const pageSection = pageText
    ? `\n\n当前用户正在浏览的页面真实可见文本如下：\n"""\n${pageText}\n"""\n如果用户的问题涉及「这个页面 / 这件文物 / 这里显示的内容」，请优先依据上面这段文本作答，并可直接引用其中的名称、年代、材质、数字等具体信息。`
    : "";

  // 联网搜索提示：仅在服务端确实开启了 web_search 工具时才告知模型，避免「说了却搜不了」
  const webNote = webSearch
    ? locale === "en"
      ? " You have web search enabled: for the latest or time-sensitive information (recent exhibitions, news, prices, new research), you may reference web results and cite the source."
      : locale === "zh-TW"
        ? " 你已開啟聯網搜尋：遇到最新或時效性資訊（近期展覽、新聞、價格、最新研究），可引用網路資料並標註來源。"
        : " 你已开启联网搜索：遇到最新或时效性信息（近期展览、新闻、价格、最新研究），可引用网络资料并标注来源。"
    : "";

  // 平台用法类问题：直接依据上面的介绍回答，别去联网找（网上没有这个站点，容易答偏）
  const platformNote =
    locale === "en"
      ? " Questions about how RelicVault itself works must be answered from the description above — never from web results (this site is not on the public web)."
      : locale === "zh-TW"
        ? " 關於 RelicVault 平台自身功能與用法的問題，請直接依據上面的介紹回答，不要參考聯網結果（網路上沒有這個站點）。"
        : " 关于 RelicVault 平台自身功能与用法的问题，请直接依据上面的介绍回答，不要参考联网结果（网上没有这个站点）。";

  // 引用角标提示：让模型在正文里标 [1][2]，服务端据此筛出真正被用到的来源
  const citeNote = webSearch
    ? locale === "en"
      ? " When you use the retrieved web results, mark the relevant sentences with numeric citation markers like [1] or [2], matching the order of the retrieved results. Never invent links."
      : locale === "zh-TW"
        ? " 若引用了聯網檢索結果，請在相關句子末尾用 [1]、[2] 這類數字角標標註來源序號（序號對應檢索結果順序）。切勿編造連結。"
        : " 若引用了联网检索结果，请在相关句子末尾用 [1]、[2] 这类数字角标标注来源序号（序号对应检索结果顺序）。切勿编造链接。"
    : "";

  if (locale === "en") {
    return `You are "Heritage Assistant" (文遗小助手), a friendly helper for RelicVault AI — a crowdsourced digital heritage and folk-artifact museum. On this platform, users upload artifact photos, use AI to auto-tag them (era, category, material, preservation status), write archives, follow curators, and discover artifacts in the Explore feed. The user is currently on: ${pageDesc}.${pageSection}${webNote}${citeNote}${platformNote} Answer in ${lang}, keeping it concise (within 3 short paragraphs) and warm. Help with questions about artifacts, history, cultural heritage, and how to use the site. If a question is unrelated to heritage, politely steer the conversation back to artifacts and heritage. Do not invent specific historical facts you are unsure about; say so if uncertain.`;
  }
  const zh =
    locale === "zh-TW"
      ? `你是「文遺小助手」，RelicVault AI 的貼心助手。RelicVault 是一個眾包數位遺產與民間文物博物館平台：用戶可以上傳文物照片、用 AI 自動識圖打標（年代 / 門類 / 材質 / 保存狀態）、撰寫檔案、關注策展人，並在探索頁發現文物。當前用戶正在瀏覽：${pageDesc}。${pageSection}${webNote}${citeNote}${platformNote}請用${lang}簡潔（3 段以內）、親切地回答關於文物、歷史、文化遺產與平台用法的问题；若用戶問與文物無關的內容，禮貌地引導回文物主題。不確定的史實請誠實說明，不要杜撰。`
      : `你是「文遗小助手」，RelicVault AI 的贴心助手。RelicVault 是一个众包数字遗产与民间文物博物馆平台：用户可以上传文物照片、用 AI 自动识图打标（年代 / 门类 / 材质 / 保存状态）、撰写档案、关注策展人，并在探索页发现文物。当前用户正在浏览：${pageDesc}。${pageSection}${webNote}${citeNote}${platformNote}请用${lang}简洁（3 段以内）、亲切地回答关于文物、历史、文化遗产与平台用法的问题；若用户问与文物无关的内容，礼貌地引导回文物主题。不确定的史实请诚实说明，不要杜撰。`;
  return zh;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("请求体格式错误", 400, "期望 JSON：{ messages, context?, locale? }");
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("参数校验失败", 400, parsed.error.message);
    }

    const locale: Locale = isLocale(parsed.data.locale)
      ? parsed.data.locale
      : isLocale(cookies().get("rv_locale")?.value)
        ? (cookies().get("rv_locale")!.value as Locale)
        : "zh-CN";

    const pageType =
      parsed.data.context?.pageType ||
      getPageType(parsed.data.context?.path || request.nextUrl.pathname);

    const pageText = parsed.data.context?.pageText ?? "";

    // 联网搜索开关：默认开启；在 .env.local 设 ZHIPU_WEB_SEARCH=false 可关闭
    const webSearch = process.env.ZHIPU_WEB_SEARCH !== "false";

    const systemPrompt = buildSystemPrompt(locale, pageType, pageText, webSearch);

    // 仅保留 user / assistant 历史（system 由服务端统一注入），并裁剪长度
    const history: ChatMessage[] = parsed.data.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    let result: { text: string; webSearch: WebSearchResult[] };
    try {
      result = await chatWithZhipuFull({
        messages: [{ role: "system", content: systemPrompt }, ...history],
        temperature: 0.7,
        maxTokens: 1024,
        webSearch,
        timeoutMs: webSearch ? 40_000 : 25_000,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "AI 对话失败（未知错误）";
      const status = /429|quota|RESOURCE_EXHAUSTED|rate/i.test(message)
        ? 429
        : /404|no longer available|NOT_FOUND/i.test(message)
          ? 404
          : /400|INVALID_ARGUMENT|key/i.test(message)
            ? 400
            : 502;
      return errorResponse("AI 对话失败", status, message);
    }

    const reply = result.text;
    // 参考资料：站内相关页 + 智谱联网检索到的真实来源（正文带 [n] 时只留被引用的）
    const references = buildReferences({
      webResults: result.webSearch,
      reply,
      query: [...history].reverse().find((m) => m.role === "user")?.content ?? "",
      pageType,
      pathname: parsed.data.context?.path || "",
      locale,
      maxWeb: 4,
    });

    return NextResponse.json({ reply, references }, { status: 200 });
  } catch (unexpected) {
    const message =
      unexpected instanceof Error ? unexpected.message : "未知服务端错误";
    return errorResponse("服务端异常", 500, message);
  }
}
