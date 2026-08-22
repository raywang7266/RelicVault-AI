// 文物档案的展示/检索数据模型与筛选维度定义。
// 该类型既用于探索页的本地 Mock 数据，也兼容后续由 Supabase `artifacts` 表映射而来。

import type { CommentItem } from "./interactions";

export type PreservationStatus =
  | "Intact"
  | "Minor Damage"
  | "Severe Degradation"
  | "Ruin";

/** 年代筛选桶（用于多维筛选器） */
export const DYNASTY_OPTIONS = ["唐", "宋", "元", "明", "清", "其他"] as const;
export type Dynasty = (typeof DYNASTY_OPTIONS)[number];

/** 门类/材质筛选桶 */
export const MATERIAL_OPTIONS = [
  "陶瓷器",
  "金属器",
  "玉石",
  "书画",
  "织物",
  "其他",
] as const;
export type Material = (typeof MATERIAL_OPTIONS)[number];

/** 保存状态筛选桶（展示用短标签） */
export const STATUS_OPTIONS = ["完整", "微损", "残损"] as const;
export type StatusLabel = (typeof STATUS_OPTIONS)[number];

export interface Artifact {
  id: string;
  title: string;
  /** 展示用纪年，如 “明永乐” */
  era: string;
  /** 年代筛选桶 */
  dynasty: Dynasty;
  /** 门类/材质（展示 + 筛选共用） */
  category: Material;
  preservationStatus: PreservationStatus;
  tags: string[];
  description: string;
  imageUrl: string;
  /** 出土地 / 发现位置 */
  locationName?: string;
  latitude?: number;
  longitude?: number;
  /** ISO 时间，用于"最新"排序 */
  createdAt: string;
  /** 点赞总数（数据库真实落库，已含当前用户的点赞） */
  likes: number;
  /** 收藏总数（数据库真实落库，已含当前用户的收藏） */
  favorites: number;
  /** 评论列表（数据库真实落库） */
  comments: CommentItem[];
  /** 当前用户是否已点赞该文物 */
  likedByMe: boolean;
  /** 当前用户是否已收藏该文物 */
  favoritedByMe: boolean;
  /**
   * 当前文物的归属用户（提交者）标识。
   * 用于个人中心"我的贡献"过滤与统计。
   */
  ownerId?: string;
}

/** 将 PreservationStatus 映射为筛选/展示用的中文短标签 */
export function statusLabel(status: PreservationStatus): StatusLabel {
  switch (status) {
    case "Intact":
      return "完整";
    case "Minor Damage":
      return "微损";
    case "Severe Degradation":
    case "Ruin":
      return "残损";
  }
}

/** 保存状态对应的徽章配色（背景 / 文字） */
export function statusBadgeClasses(status: PreservationStatus): string {
  switch (status) {
    case "Intact":
      return "bg-[#F1F6EC] text-[#3B5B28] border-[#D0E2C3]";
    case "Minor Damage":
      return "bg-[#FBF3E2] text-[#8A6217] border-[#EAD9B0]";
    case "Severe Degradation":
    case "Ruin":
      return "bg-[#FBEAEA] text-[#9B2C2C] border-[#EFC9C9]";
  }
}
