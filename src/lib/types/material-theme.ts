// 门类（材质）主题色：为 6 个固定门类各配一套协调的中国传统色，
// 用于卡片顶部色条、分类角标、eyebrow 着色等「小面积点缀」，
// 让瀑布流在保持羊皮纸 + 古铜主调的前提下获得有逻辑的色彩层次，
// 而非杂乱的高饱和堆砌。所有色均低饱和、偏灰，搭调不刺眼。
//
// 用十六进制色值（而非 Tailwind 类名）存储，组件内以内联 style 取用，
// 这样完全不受 Tailwind 内容扫描 / purge 影响，且按动态 category 取色可靠。

import type { Material } from "./artifact";

export interface MaterialTheme {
  /** 强调文字 / 细线 / 角标文字 */
  accent: string;
  /** 极淡背景（角标、chip 底色） */
  tint: string;
  /** 浅边框 */
  border: string;
  /** 顶部色条实色 */
  bar: string;
  /** 0.12 透明度的强调色，用于极淡光晕 / hover 底色 */
  glow: string;
}

export const MATERIAL_THEME: Record<Material, MaterialTheme> = {
  // 陶瓷器：天青 / 青瓷蓝
  陶瓷器: { accent: "#3E7CA8", tint: "#EAF2F8", border: "#C9DDEF", bar: "#4E8BB5", glow: "rgba(62,124,168,0.12)" },
  // 金属器：古铜 / 赭金
  金属器: { accent: "#8A5E2E", tint: "#F6EDE0", border: "#E4D2B8", bar: "#A87B3F", glow: "rgba(168,123,63,0.12)" },
  // 玉石：碧玉绿
  玉石:   { accent: "#2E7D5B", tint: "#E6F3EE", border: "#C4E0D4", bar: "#3E9A78", glow: "rgba(62,154,120,0.12)" },
  // 书画：朱砂 / 印红
  书画:   { accent: "#9A352C", tint: "#FBEDEB", border: "#EFCFC9", bar: "#A8473B", glow: "rgba(168,71,59,0.12)" },
  // 织物：胭脂 / 品红
  织物:   { accent: "#8E3F6E", tint: "#F6EAF1", border: "#E7CBDC", bar: "#A85C86", glow: "rgba(168,92,134,0.12)" },
  // 其他：黛石 / 墨灰
  其他:   { accent: "#5B6470", tint: "#EEF0F2", border: "#D6DBE0", bar: "#6B7280", glow: "rgba(107,114,128,0.12)" },
};

/** 安全取色：未知 / 缺失门类回落到「其他」的黛灰色，避免取到 undefined 导致样式崩坏 */
export function materialTheme(m: Material | string | undefined): MaterialTheme {
  if (m && (m in MATERIAL_THEME)) return MATERIAL_THEME[m as Material];
  return MATERIAL_THEME["其他"];
}
