import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

import { chatWithZhipu } from "@/lib/ai/zhipu-chat";
import {
  fallbackSuggestions,
  getPageType,
  pageContextInfo,
} from "@/lib/ai/page-context";
import {
  isLocale,
  localeToZhipuLanguage,
  type Locale,
} from "@/lib/i18n/locales";

export const runtime = "nodejs";
export const maxDuration = 30;

const requestSchema = z.object({
  path: z.string().optional(),
  pageType: z.string().optional(),
  locale: z.string().optional(),
  pageText: z.string().max(12000).optional(),
});

function ok(suggestions: string[]) {
  return NextResponse.json({ suggestions }, { status: 200 });
}

function buildSystemPrompt(
  locale: Locale,
  pageType: string,
  pageText: string
): string {
  const lang = localeToZhipuLanguage(locale);
  const pageDesc = pageContextInfo(pageType, locale);
  // 当客户端抓到了真实页面文本时，要求 AI 基于「具体展示的内容」出题
  const pageSection = pageText
    ? `\n\n当前页面真实可见的文本内容如下（可能包含文物标题、年代、材质、列表项等）：\n"""\n${pageText}\n"""\n请务必围绕上面这段具体内容出题——例如页面里出现的某件文物、某个名字、某条数据，让用户能就「正在看的东西」提问。`
    : "";

  if (locale === "en") {
    return `You are the suggestion engine for RelicVault AI, a crowdsourced digital heritage museum. The visitor is currently on: ${pageDesc}.${pageSection} Generate 4 to 6 short, colloquial question suggestions a visitor might want to ask (each 2-10 words, in ${lang}). They should relate to the current page or heritage knowledge. Output ONLY a JSON object: {"suggestions":["...","...",...]}. No markdown, no extra text.`;
  }
  const zh =
    locale === "zh-TW"
      ? `你是 RelicVault AI 的聯想詞生成器。當前頁面：${pageDesc}。${pageSection}請生成 4-6 個簡短的提問建議（每個 2-10 字，使用${lang}），措辭像使用者會問的口語化短語，幫助使用者了解當前頁面或文物知識。只輸出一個 JSON 物件：{"suggestions":["...","...",...]}。不要 markdown，不要多餘文字。`
      : `你是 RelicVault AI 的联想词生成器。当前页面：${pageDesc}。${pageSection}请生成 4-6 个简短的提问建议（每个 2-10 字，使用${lang}），措辞像用户会问的口语化短语，帮助用户了解当前页面或文物知识。只输出一个 JSON 物件：{"suggestions":["...","...",...]}。不要 markdown，不要多余文字。`;
  return zh;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      /* 允许空 body，用 path 兜底 */
    }

    const parsed = requestSchema.safeParse(body);
    const rawLocale = parsed.success ? parsed.data.locale : undefined;
    const locale: Locale = isLocale(rawLocale)
      ? rawLocale
      : isLocale(cookies().get("rv_locale")?.value)
        ? (cookies().get("rv_locale")!.value as Locale)
        : "zh-CN";

    const pageType =
      (parsed.success && (parsed.data.pageType || getPageType(parsed.data.path || ""))) ||
      getPageType(request.nextUrl.pathname);

    const pageText = parsed.success ? (parsed.data.pageText ?? "") : "";
    // 页面文本较长时让模型多给点预算，避免截断建议
    const maxTokens = pageText ? 320 : 256;

    try {
      const raw = await chatWithZhipu({
        messages: [
          { role: "user", content: buildSystemPrompt(locale, pageType, pageText) },
        ],
        temperature: 0.8,
        maxTokens,
      });

      // 模型可能包裹在 ```json 代码块里，先剥离
      const cleaned = raw
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/i, "")
        .trim();
      const parsedJson = JSON.parse(cleaned) as { suggestions?: unknown };
      const list = Array.isArray(parsedJson.suggestions)
        ? (parsedJson.suggestions as unknown[])
            .map((s) => String(s).trim())
            .filter((s) => s.length > 0)
            .slice(0, 6)
        : [];
      if (list.length > 0) return ok(list);
    } catch {
      /* 落到兜底 */
    }

    return ok(fallbackSuggestions(pageType, locale));
  } catch (unexpected) {
    const message =
      unexpected instanceof Error ? unexpected.message : "未知服务端错误";
    return NextResponse.json(
      { error: "服务端异常", details: message },
      { status: 500 }
    );
  }
}
