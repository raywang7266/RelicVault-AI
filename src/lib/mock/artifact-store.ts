import type { Artifact, Dynasty, Material, PreservationStatus } from "@/lib/types/artifact";
import { ARTIFACT_SEED } from "./artifacts";

// 用户提交文物的「内存数据库」（Mock）。
// 挂载到 globalThis，以便在开发模式热更新（HMR）期间状态不丢失。
// 接入真实 Supabase 后，可在此处替换为数据库写入（artifacts 表）。
const globalForStore = globalThis as unknown as {
  __rvUserArtifacts?: Artifact[];
};

const userArtifacts: Artifact[] =
  globalForStore.__rvUserArtifacts ??
  (globalForStore.__rvUserArtifacts = []);

/** 前端提交过来的原始表单数据（字段均为可选，服务端做兜底） */
export interface IncomingArtifact {
  title: string;
  era?: string;
  category?: string;
  preservationStatus?: string;
  tags?: unknown[];
  description?: string;
  imageUrl?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  /** 当前用户标识（接 Supabase 后写入 artifacts.owner_id） */
  ownerId?: string;
}

const DYNASTY_KEYWORDS: { kw: string; value: Dynasty }[] = [
  { kw: "唐", value: "唐" },
  { kw: "宋", value: "宋" },
  { kw: "元", value: "元" },
  { kw: "明", value: "明" },
  { kw: "清", value: "清" },
];

/** 根据年代字符串推导筛选桶（如 “清乾隆” -> “清”） */
export function deriveDynasty(era: string): Dynasty {
  for (const { kw, value } of DYNASTY_KEYWORDS) {
    if (era.includes(kw)) return value;
  }
  return "其他";
}

const VALID_STATUS: PreservationStatus[] = [
  "Intact",
  "Minor Damage",
  "Severe Degradation",
  "Ruin",
];

/** 将一条前端表单数据落库为 Artifact（生成 id 与 createdAt） */
export function addUserArtifact(input: IncomingArtifact): Artifact {
  const preservationStatus = (
    VALID_STATUS.includes(input.preservationStatus as PreservationStatus)
      ? input.preservationStatus
      : "Intact"
  ) as PreservationStatus;

  const tags = Array.isArray(input.tags)
    ? input.tags
        .map((t) => String(t ?? "").trim())
        .filter(Boolean)
    : [];

  const artifact: Artifact = {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    era: input.era?.trim() || "未知",
    dynasty: deriveDynasty(input.era?.trim() || ""),
    category: (input.category?.trim() || "其他") as Material,
    preservationStatus,
    tags,
    description: input.description?.trim() || "",
    imageUrl: input.imageUrl || "",
    images: input.imageUrl ? [input.imageUrl] : [],
    locationName: input.locationName?.trim() || undefined,
    latitude: typeof input.latitude === "number" ? input.latitude : undefined,
    longitude: typeof input.longitude === "number" ? input.longitude : undefined,
    createdAt: new Date().toISOString(),
    likes: 0,
    favorites: 0,
    comments: [],
    likedByMe: false,
    favoritedByMe: false,
    ownerId: input.ownerId?.trim() || undefined,
  };

  userArtifacts.unshift(artifact);
  return artifact;
}

/**
 * 按用户过滤已建档文物。
 *
 * 行为约定：
 * 1. `userId` 缺省：返回「全部用户提交 + 种子」（与 getAllArtifacts 一致）。
 * 2. `userId` 存在且匹配到至少一条提交：仅返回该用户的提交 + 种子。
 * 3. `userId` 存在但**没有任何提交**（典型场景：Mock 模式或匿名用户）：
 *    按需求"未匹配则默认展示所有已建档文物记录"，兜底返回全部用户提交 + 种子。
 *    这样新用户首次进入个人中心不会一片空白，能看到社区他人贡献作为示范。
 * 4. 顺序：用户提交优先（新→旧），其后合并种子数据；按 createdAt 倒序。
 *
 * 集成说明：真实 Supabase 接入后此函数可替换为
 *   `select * from artifacts where owner_id = $1 order by created_at desc`
 * + 一条 `select * from artifacts order by created_at desc` 做兜底。
 */
export function getUserArtifacts(userId?: string, limit = 200): Artifact[] {
  if (!userId) {
    // 未传 owner：完全等价于全量列表
    return getAllArtifacts(limit);
  }

  const matched = userArtifacts.filter((a) => a.ownerId === userId);

  // 兜底：未匹配则展示所有用户已建档记录（保持个人中心不空白）
  const owned = matched.length > 0 ? matched : [...userArtifacts];
  const ownedIds = new Set(owned.map((a) => a.id));
  const seed = ARTIFACT_SEED.filter((a) => !ownedIds.has(a.id));

  return [...owned, ...seed]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, limit);
}

/** 返回「用户提交 + 种子数据」，按最新时间排序（供探索/典藏阁 GET 使用） */
export function getAllArtifacts(limit = 200): Artifact[] {
  return [...userArtifacts, ...ARTIFACT_SEED]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, limit);
}

/**
 * 按 id 在用户提交数组中查找条目；找不到返回 null。
 * 种子 (`ARTIFACT_SEED`) 视为只读，编辑请求需另发专门的「合并种子」流程，
 * 此处不返回种子，避免无意的全局状态污染。
 */
export function findUserArtifact(id: string): Artifact | null {
  return userArtifacts.find((a) => a.id === id) ?? null;
}

/** 更新时白名单——只允许这些字段被外部 patch 覆盖 */
const UPDATABLE_FIELDS: (keyof Artifact)[] = [
  "title",
  "era",
  "dynasty",
  "category",
  "preservationStatus",
  "tags",
  "description",
  "imageUrl",
  "locationName",
  "latitude",
  "longitude",
  "ownerId",
];

/**
 * 按 id 覆盖/合并更新用户提交文物。
 * - 行为类似 PATCH：未在 patch 中给出的字段保留原值。
 * - 若传了 `era` 但未传 `dynasty`，会自动按 `deriveDynasty` 推导填充。
 * - 不变更 `createdAt`，但允许显式覆盖（不在白名单内的字段被忽略）。
 * - 找不到 id 返回 null（不抛错，由路由层返回 404）。
 * - 未传入白名单字段同样不会破坏数据。
 */
export function updateUserArtifact(
  id: string,
  patch: Partial<Artifact>
): Artifact | null {
  const idx = userArtifacts.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  const prev = userArtifacts[idx];

  const next: Artifact = { ...prev };
  for (const key of UPDATABLE_FIELDS) {
    const v = patch[key];
    if (v === undefined) continue;
    // 宽松类型：把 unknown 当任意值；类型由调用方保证
    (next as unknown as Record<string, unknown>)[key] = v as unknown;
  }

  // 联动：若修改了 era 但 patch 没指定 dynasty，重新推导
  if (patch.era !== undefined && patch.dynasty === undefined) {
    next.dynasty = deriveDynasty(next.era);
  }

  // 规范化：保证空字段有兜底显示
  next.title = (next.title ?? "").trim() || prev.title;
  next.era = (next.era ?? "").trim() || "未知";
  next.description = (next.description ?? "").trim();
  next.imageUrl = (next.imageUrl ?? "").trim();

  userArtifacts[idx] = next;
  return next;
}

/**
 * 按 id 删除用户提交的文物（同时从 seed 兜底也匹配时优先删除用户提交）。
 * 找不到则返回 false。
 */
export function removeUserArtifact(id: string): boolean {
  const idx = userArtifacts.findIndex((a) => a.id === id);
  if (idx < 0) return false;
  userArtifacts.splice(idx, 1);
  return true;
}
