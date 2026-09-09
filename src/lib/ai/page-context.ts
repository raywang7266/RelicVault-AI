/**
 * 浮窗小助手 —— 页面上下文工具（纯函数，前后端共用）。
 *
 * 把当前路由映射成稳定的 pageType，并给出本地化的页面描述，
 * 供「联想词」与「对话」接口构建 system prompt。同时提供离线兜底建议词。
 */

import type { Locale } from "@/lib/i18n/locales";

export type AssistantLocale = Locale;

/** 把路径映射为稳定的页面类型标识（不随语言变化） */
export function getPageType(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/explore")) return "explore";
  if (pathname.startsWith("/artifacts/new")) return "upload";
  if (pathname.startsWith("/artifact/")) return "artifact-detail";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/followers") || pathname.startsWith("/following"))
    return "connections";
  return "generic";
}

/** 各页面类型在本地的展示描述（中文 / 繁體中文 / English） */
const PAGE_INFO: Record<
  string,
  { "zh-CN": string; "zh-TW": string; en: string }
> = {
  home: {
    "zh-CN": "首页（平台概览、精选文物、快速开始）",
    "zh-TW": "首頁（平台概覽、精選文物、快速開始）",
    en: "Home (overview, featured artifacts, quick start)",
  },
  explore: {
    "zh-CN": "探索页（推荐流与关注流、发现文物）",
    "zh-TW": "探索頁（推薦流與關注流、發現文物）",
    en: "Explore (recommended & following feeds, discover artifacts)",
  },
  upload: {
    "zh-CN": "上传文物页（拍照、填写档案、AI 识图打标）",
    "zh-TW": "上傳文物頁（拍照、填寫檔案、AI 識圖打標）",
    en: "Upload artifact (photo, fill profile, AI tagging)",
  },
  "artifact-detail": {
    "zh-CN": "文物详情页（年代、材质、文化意义、评论）",
    "zh-TW": "文物詳情頁（年代、材質、文化意義、評論）",
    en: "Artifact detail (era, material, cultural meaning, comments)",
  },
  profile: {
    "zh-CN": "个人主页（我的收藏、关注、发布）",
    "zh-TW": "個人主頁（我的收藏、關注、發布）",
    en: "Profile (my favorites, follows, posts)",
  },
  connections: {
    "zh-CN": "关注 / 粉丝关系页",
    "zh-TW": "關注 / 粉絲關係頁",
    en: "Followers / following page",
  },
  generic: {
    "zh-CN": "通用页面",
    "zh-TW": "通用頁面",
    en: "General page",
  },
};

/** 取当前页面的本地化描述（用于注入 AI 的上下文） */
export function pageContextInfo(
  pageType: string,
  locale: AssistantLocale
): string {
  const info = PAGE_INFO[pageType] ?? PAGE_INFO.generic;
  return info[locale];
}

/** 离线兜底联想词（AI 不可用时使用），按页面 + 语言给出 */
export function fallbackSuggestions(
  pageType: string,
  locale: AssistantLocale
): string[] {
  const map: Record<string, Record<AssistantLocale, string[]>> = {
    home: {
      "zh-CN": ["平台怎么用", "什么是文物数字化", "如何上传文物", "AI 能做什么"],
      "zh-TW": ["平台怎麼用", "什麼是文物數位化", "如何上傳文物", "AI 能做什麼"],
      en: ["How to use", "What is digital heritage", "How to upload", "What can AI do"],
    },
    explore: {
      "zh-CN": ["推荐流和关注流区别", "如何发现感兴趣文物", "关注策展人有什么用", "怎么筛选门类"],
      "zh-TW": ["推薦流和關注流區別", "如何發現感興趣文物", "關注策展人有什麼用", "怎麼篩選門類"],
      en: ["Recommended vs following", "Discover artifacts", "Follow curators", "Filter by category"],
    },
    upload: {
      "zh-CN": ["照片怎么拍更清晰", "AI 识图准吗", "门类怎么选", "保存状态填什么"],
      "zh-TW": ["照片怎麼拍更清晰", "AI 識圖準嗎", "門類怎麼選", "保存狀態填什麼"],
      en: ["How to photograph", "Is AI tagging accurate", "Pick a category", "Preservation status"],
    },
    "artifact-detail": {
      "zh-CN": ["这件文物什么年代", "材质是什么", "文化意义是什么", "如何收藏或评论"],
      "zh-TW": ["這件文物什麼年代", "材質是什麼", "文化意義是什麼", "如何收藏或評論"],
      en: ["What era is this", "What material", "Cultural meaning", "Save or comment"],
    },
    profile: {
      "zh-CN": ["我的收藏在哪", "怎么看关注列表", "我发布了哪些文物", "怎么改资料"],
      "zh-TW": ["我的收藏在哪", "怎麼看關注列表", "我發布了哪些文物", "怎麼改資料"],
      en: ["My favorites", "Following list", "My artifacts", "Edit profile"],
    },
    connections: {
      "zh-CN": ["关注和粉丝区别", "怎么互相关注", "取消关注会怎样"],
      "zh-TW": ["關注和粉絲區別", "怎麼互相關注", "取消關注會怎樣"],
      en: ["Followers vs following", "Mutual follow", "Unfollow effect"],
    },
    generic: {
      "zh-CN": ["这是什么网站", "如何开始", "联系我们", "常见问题"],
      "zh-TW": ["這是什麼網站", "如何開始", "聯絡我們", "常見問題"],
      en: ["What is this site", "How to start", "Contact us", "FAQ"],
    },
  };
  return (map[pageType] ?? map.generic)[locale];
}
