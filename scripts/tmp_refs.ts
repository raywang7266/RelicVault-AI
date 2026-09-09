type Locale = string;
type WebSearchResult = { title?: string; link?: string; media?: string; content?: string; icon?: string; refer?: string; publish_date?: string };
/**
 * 浮窗小助手 —— 参考资料（前后端共用类型与纯函数）。
 *
 * 设计要点：
 * - 「网络来源」直接用智谱联网搜索（web_search）返回的真实结果，
 *   而不是让模型凭空编链接 —— 模型生成的 URL 有幻觉风险，检索结果是可信的。
 * - 「站内来源」按当前页面类型给出相关站内页面，保证不联网时也有可读的延伸阅读。
 * - 若模型在正文里用了 [1] [2] 之类的编号，优先只展示被真正引用到的那几条。
 */


export interface ChatReference {
  /** 稳定 key（前端做列表 key 用） */
  id: string;
  /** 展示标题 */
  title: string;
  /** 点击跳转地址：外链为 http(s)，站内为 `/xxx` */
  url: string;
  /** 来源名：媒体名 / 域名 / RelicVault */
  source: string;
  /** 摘要（可选，仅网络来源有） */
  snippet?: string;
  /** 发布日期（可选） */
  date?: string;
  /** 站内 / 网络 */
  kind: "site" | "web";
  /** 正文引用编号（[1] [2] …），无编号时递增 */
  index?: number;
}

const MAX_TITLE = 90;
const MAX_SNIPPET = 150;

function clip(text: string | undefined, max: number): string {
  if (!text) return "";
  const s = text.replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** 站内页面（按页面类型挑选延伸阅读） */
const SITE_PAGES: Record<
  string,
  { path: string; title: Record<Locale, string> }
> = {
  home: {
    path: "/",
    title: { "zh-CN": "首页", "zh-TW": "首頁", en: "Home" },
  },
  explore: {
    path: "/explore",
    title: { "zh-CN": "探索页", "zh-TW": "探索頁", en: "Explore" },
  },
  upload: {
    path: "/artifacts/new",
    title: { "zh-CN": "上传文物", "zh-TW": "上傳文物", en: "Upload artifact" },
  },
  profile: {
    path: "/profile",
    title: { "zh-CN": "我的主页", "zh-TW": "我的主頁", en: "My profile" },
  },
};

/** 当前页面自身的条目（详情页等：直接把本页列为参考） */
const CURRENT_PAGE_TITLE: Record<Locale, string> = {
  "zh-CN": "当前页面",
  "zh-TW": "目前頁面",
  en: "Current page",
};

const SITE_SOURCE = "RelicVault";

/** 按页面类型给出站内相关资料（当前页 + 1 个延伸页） */
export function siteReferences(
  pageType: string,
  pathname: string,
  locale: Locale
): ChatReference[] {
  const out: ChatReference[] = [];
  const push = (path: string, title: string) => {
    if (out.some((r) => r.url === path)) return;
    out.push({
      id: `site:${path}`,
      title,
      url: path,
      source: SITE_SOURCE,
      kind: "site",
    });
  };

  if (pageType === "artifact-detail" && pathname.startsWith("/artifact/")) {
    push(pathname, CURRENT_PAGE_TITLE[locale]);
  }

  const related: string[] =
    pageType === "home"
      ? ["explore", "upload"]
      : pageType === "explore"
        ? ["upload", "profile"]
        : pageType === "upload"
          ? ["explore"]
          : pageType === "profile"
            ? ["explore", "upload"]
            : pageType === "connections"
              ? ["explore"]
              : ["home", "explore"];

  for (const key of related) {
    const page = SITE_PAGES[key];
    if (page) push(page.path, page.title[locale]);
  }
  return out.slice(0, 2);
}

/** 把智谱联网搜索结果转成参考资料（校验 / 去重 / 截断） */
export function webReferences(
  results: WebSearchResult[],
  max: number
): ChatReference[] {
  const seen = new Set<string>();
  const out: ChatReference[] = [];
  for (const item of results) {
    const url = typeof item.link === "string" ? item.link.trim() : "";
    if (!/^https?:\/\//i.test(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    const host = hostnameOf(url);
    out.push({
      id: `web:${url}`,
      title: clip(item.title, MAX_TITLE) || host || url,
      url,
      source: clip(item.media, 40) || host || "",
      snippet: clip(item.content, MAX_SNIPPET) || undefined,
      date: typeof item.publish_date === "string" ? item.publish_date : undefined,
      kind: "web",
    });
    if (out.length >= max) break;
  }
  return out;
}

/**
 * 解析正文中出现的引用编号 [1] [2] …
 * 用于「只展示真正被引用到的来源」；模型没标编号时返回空集。
 */
export function citedIndexes(reply: string): number[] {
  const found = new Set<number>();
  const re = /\[(\d{1,2})\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(reply))) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 20) found.add(n);
  }
  return Array.from(found).sort((a, b) => a - b);
}

/** 无实质语义的疑问词（不参与相关性打分） */
const STOP_TOKENS = new Set([
  "怎么", "怎样", "什么", "如何", "哪些", "哪个", "是否", "可以", "能否",
  "请问", "这个", "那个", "以及", "还有", "一下", "给我", "我想", "帮我",
  "一下", "关于", "有没", "没有", "thanks", "please", "what", "how",
  "the", "and", "for", "with", "that", "this", "from",
]);

/** 把文本切成用于相关性比较的 token：拉丁词 + 中文 2-gram */
function tokenize(text: string): Set<string> {
  const s = (text || "").toLowerCase();
  const out = new Set<string>();
  const latin = s.match(/[a-z0-9]{3,}/g);
  if (latin) for (const w of latin) if (!STOP_TOKENS.has(w)) out.add(w);
  const han = s.replace(/[^\u4e00-\u9fff]+/g, " ").trim();
  for (const seg of han.split(/\s+/)) {
    for (let i = 0; i + 2 <= seg.length; i++) {
      const g = seg.slice(i, i + 2);
      if (!STOP_TOKENS.has(g)) out.add(g);
    }
  }
  return out;
}

/**
 * 按与用户问题的相关度挑选网络来源：
 * 智谱每次调用都会返回一批检索结果，其中常混有与问题无关的内容，
 * 直接全量展示会让「参考资料」变得莫名其妙，因此做一次轻量打分过滤。
 */
function rankByRelevance(
  refs: ChatReference[],
  query: string,
  max: number
): ChatReference[] {
  const q = tokenize(query);
  if (q.size === 0) return refs.slice(0, max);
  const scored = refs.map((r) => {
    const titleScore = overlap(q, tokenize(r.title));
    const bodyScore = overlap(q, tokenize(`${r.snippet ?? ""} ${r.source}`));
    return { ref: r, score: titleScore * 2 + bodyScore };
  });
  const hits = scored.filter((s) => s.score > 0);
  // 全都无关时退回原顺序，保证「参考资料」不至于消失
  if (hits.length === 0) return refs.slice(0, max);
  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => s.ref);
}

function overlap(a: Set<string>, b: Set<string>): number {
  let hit = 0;
  for (const t of Array.from(a)) if (b.has(t)) hit++;
  return a.size ? hit / a.size : 0;
}

export interface BuildReferencesArgs {
  /** 智谱联网搜索原始结果（按平台返回顺序，对应 [1] [2] …） */
  webResults: WebSearchResult[];
  /** 模型正文（用于提取引用编号） */
  reply: string;
  /** 用户问题（用于来源相关性排序） */
  query: string;
  pageType: string;
  pathname: string;
  locale: Locale;
  /** 网络来源最多几条（默认 4） */
  maxWeb?: number;
}

/**
 * 组装一次回答的参考资料：站内 1-2 条 + 网络来源最多 maxWeb 条。
 * 正文带 [n] 编号时只取被引用的那几条，避免堆一堆没用上的链接。
 */
export function buildReferences({
  webResults,
  reply,
  query,
  pageType,
  pathname,
  locale,
  maxWeb = 4,
}: BuildReferencesArgs): ChatReference[] {
  const site = siteReferences(pageType, pathname, locale);

  const cited = citedIndexes(reply);
  const pool = webReferences(webResults, 10);
  let web: ChatReference[];
  if (cited.length > 0) {
    // 编号是 1-based，对应 pool 下标
    web = cited
      .map((n) => pool[n - 1])
      .filter((r): r is ChatReference => Boolean(r))
      .slice(0, Math.max(maxWeb, cited.length));
  } else {
    web = rankByRelevance(pool, query, maxWeb);
  }

  const hasCite = cited.length > 0;
  return [
    ...site,
    ...web.map((r, i) => (hasCite ? { ...r, index: i + 1 } : r)),
  ];
}
