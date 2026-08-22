import "server-only";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { Artifact, type IArtifact, type PreservationDb } from "@/models/Artifact";
import { User } from "@/models/User";
import { deriveDynasty } from "@/lib/mock/artifact-store";
import type {
  Artifact as ArtifactDTO,
  Material,
  PreservationStatus,
} from "@/lib/types/artifact";

// ---------------------------------------------------------------------------
// 评论作者映射（解决「改名字后历史评论仍显示旧名」问题）
// ---------------------------------------------------------------------------

/** 评论作者在渲染时实时显示用的最小信息（按 userId 查 User 拿最新值） */
export interface CommentAuthorInfo {
  username?: string;
  displayName: string;
}

/** 从一组 Artifact 文档里采集所有出现过的评论作者 userId，去 User 表一次性批量查最新用户名 */
async function loadCommentAuthors(
  docs: Array<IArtifact | Record<string, any>>
): Promise<Map<string, CommentAuthorInfo>> {
  const ids = new Set<string>();
  for (const d of docs) {
    const list = Array.isArray(d.comments) ? d.comments : [];
    for (const c of list) {
      if (c?.userId) ids.add(String(c.userId));
    }
  }
  if (ids.size === 0) return new Map();
  // 仅查询 id、username、displayName 三个轻字段
  const users = await User.find(
    { _id: { $in: Array.from(ids) } },
    { username: 1, displayName: 1 }
  )
    .lean()
    .exec();
  const map = new Map<string, CommentAuthorInfo>();
  for (const u of users) {
    map.set(String(u._id), {
      username: (u.username as string) || undefined,
      displayName: (u.displayName as string) || "",
    });
  }
  return map;
}

// ---------------------------------------------------------------------------
// preservationStatus 双向映射（DB enum <-> 前端展示字符串）
// ---------------------------------------------------------------------------

const DB_TO_FRONT: Record<PreservationDb, PreservationStatus> = {
  excellent: "Intact",
  good: "Minor Damage",
  fair: "Severe Degradation",
  poor: "Ruin",
  critical: "Ruin",
  unknown: "Intact",
};

const FRONT_TO_DB: Record<string, PreservationDb> = {
  Intact: "excellent",
  "Minor Damage": "good",
  "Severe Degradation": "fair",
  Ruin: "poor",
  // 兜底，避免脏数据
  excellent: "excellent",
  good: "good",
  fair: "fair",
  critical: "critical",
  unknown: "unknown",
};

function mapDbStatusToFront(db: string | undefined): PreservationStatus {
  return (DB_TO_FRONT as Record<string, PreservationStatus>)[db ?? "unknown"] ?? "Intact";
}

function mapFrontStatusToDb(front: string | undefined): PreservationDb {
  return (FRONT_TO_DB as Record<string, PreservationDb>)[front ?? ""] ?? "unknown";
}

// ---------------------------------------------------------------------------
// 单条文档 -> 前端 Artifact
// ---------------------------------------------------------------------------

export function docToArtifact(
  doc: IArtifact | Record<string, any>,
  opts: {
    userId?: string | null;
    /** 评论作者最新展示名映射（userId -> displayName/username）。 */
    commentAuthors?: Map<string, CommentAuthorInfo>;
  } = {}
): ArtifactDTO {
  const era = (doc.era as string) || "未知";
  const aiTags: string[] = Array.isArray(doc.aiTags) ? doc.aiTags : [];
  const manualTags: string[] = Array.isArray(doc.manualTags) ? doc.manualTags : [];
  const tags = Array.from(new Set([...aiTags, ...manualTags]));

  const likesRaw = Array.isArray(doc.likes) ? doc.likes : [];
  const favsRaw = Array.isArray(doc.favorites) ? doc.favorites : [];
  const commentsRaw = Array.isArray(doc.comments) ? doc.comments : [];

  const userId = opts.userId ?? null;
  const likedByMe =
    !!userId &&
    likesRaw.some((id: any) => String(id) === userId);
  const favoritedByMe =
    !!userId &&
    favsRaw.some((id: any) => String(id) === userId);

  const commentAuthors = opts.commentAuthors;

  const comments: ArtifactDTO["comments"] = commentsRaw
    .slice()
    .sort(
      (a: any, b: any) =>
        +new Date(a.createdAt) - +new Date(b.createdAt)
    )
    .map((c: any) => {
      // 1) 优先用 userId 查到 User 表的**最新** displayName/username（实时反映改名）
      // 2) 兜底用评论创建时的 username snapshot（避免无法关联 userId 的脏数据空名）
      // 3) 最终兜底「匿名」
      const latest = c.userId
        ? commentAuthors?.get(String(c.userId))
        : undefined;
      const author =
        (latest?.displayName || latest?.username) ||
        c.username ||
        "匿名";
      return {
        id: String(c.id),
        author,
        text: c.text,
        createdAt: c.createdAt
          ? new Date(c.createdAt).toISOString()
          : new Date().toISOString(),
      };
    });

  return {
    id: String(doc._id),
    title: doc.title,
    era,
    dynasty: deriveDynasty(era),
    category: ((doc.category as Material) || "其他") as Material,
    preservationStatus: mapDbStatusToFront(doc.preservationStatus),
    tags,
    description: doc.description ?? "",
    imageUrl: doc.imageUrl ?? "",
    // 对外只暴露脱敏后的 blurred* 坐标
    locationName: doc.locationName || undefined,
    latitude:
      typeof doc.blurredLat === "number" ? doc.blurredLat : undefined,
    longitude:
      typeof doc.blurredLng === "number" ? doc.blurredLng : undefined,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : new Date().toISOString(),
    likes: likesRaw.length,
    favorites: favsRaw.length,
    comments,
    likedByMe,
    favoritedByMe,
    ownerId: String(doc.userId),
  };
}

// ---------------------------------------------------------------------------
// 输入类型
// ---------------------------------------------------------------------------

export interface ArtifactInput {
  title: string;
  era?: string;
  category?: string;
  preservationStatus?: string;
  tags?: string[];
  description?: string;
  imageUrl: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  isProtected?: boolean;
}

export interface ArtifactPatch {
  title?: string;
  era?: string;
  category?: string;
  preservationStatus?: string;
  tags?: string[];
  description?: string;
  imageUrl?: string;
  locationName?: string;
  latitude?: number | null;
  longitude?: number | null;
}

// ---------------------------------------------------------------------------
// 查询
// ---------------------------------------------------------------------------

interface ListOptions {
  /** 仅返回某用户的提交；传 24 位 hex 的 ObjectId 字符串 */
  ownerId?: string;
  /** 文本搜索：匹配标题（不区分大小写）或标签（aiTags/manualTags） */
  q?: string;
  /** 标签搜索（不区分大小写，分别匹配 aiTags 与 manualTags） */
  tag?: string;
  /** 年代筛选桶（唐/宋/元/明/清/其他），基于 era 推导 */
  dynasty?: string;
  /** 门类/材质精确匹配（对应 category 字段） */
  material?: string;
  /** 保存状态中文短标签（完整/微损/残损），映射到 DB enum */
  status?: string;
  limit?: number;
  /** 当前会话用户 id，用于计算 likedByMe / favoritedByMe */
  userId?: string | null;
}

const DYNASTY_KEYWORDS: Record<string, string> = {
  唐: "唐",
  宋: "宋",
  元: "元",
  明: "明",
  清: "清",
};

const STATUS_LABEL_TO_DB: Record<string, string[]> = {
  完整: ["excellent"],
  "微损": ["good"],
  "残损": ["fair", "poor", "critical"],
};

function matchesDynasty(era: string, dynasty: string): boolean {
  if (dynasty === "其他") {
    // 「其他」= 不属于唐/宋/元/明/清 任一
    return !Object.keys(DYNASTY_KEYWORDS).some((kw) => era.includes(kw));
  }
  const kw = DYNASTY_KEYWORDS[dynasty];
  return !!kw && era.includes(kw);
}

export async function listArtifactsPublic(
  options: ListOptions = {}
): Promise<ArtifactDTO[]> {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (options.ownerId) filter.userId = options.ownerId;
  const limit = options.limit ?? 200;

  const docs = await Artifact.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // 一次性把所有出现过的评论作者 userId 查出来，渲染时优先用最新用户名
  const commentAuthors = await loadCommentAuthors(docs as Array<IArtifact>);

  let dtos = docs.map((d) =>
    docToArtifact(d as IArtifact, {
      userId: options.userId,
      commentAuthors,
    })
  );

  // —— 内存二次过滤（数据量 ≤200，安全高效）——
  const q = options.q?.trim().toLowerCase();
  const tag = options.tag?.trim().toLowerCase();
  if (q) {
    dtos = dtos.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (tag) {
    // 标签搜索：同步匹配 aiTags 与 manualTags 两个数组（已在 tags 合并字段中）
    dtos = dtos.filter((a) =>
      a.tags.some((t) => t.toLowerCase().includes(tag))
    );
  }
  if (options.dynasty) {
    dtos = dtos.filter((a) => matchesDynasty(a.era, options.dynasty!));
  }
  if (options.material) {
    dtos = dtos.filter((a) => a.category === options.material);
  }
  if (options.status) {
    const dbSet = STATUS_LABEL_TO_DB[options.status];
    if (dbSet) {
      dtos = dtos.filter((a) =>
        dbSet.includes(mapFrontStatusToDb(a.preservationStatus))
      );
    }
  }

  return dtos.slice(0, limit);
}

export async function getArtifact(
  id: string,
  userId?: string | null
): Promise<ArtifactDTO | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const doc = await Artifact.findById(id).lean();
  if (!doc) return null;
  // 取该文物评论的作者最新用户名映射（解决「改名字后历史评论仍显示旧名」）
  const commentAuthors = await loadCommentAuthors([doc as IArtifact]);
  return docToArtifact(doc as IArtifact, { userId, commentAuthors });
}

// ---------------------------------------------------------------------------
// 点赞 / 收藏（Toggle 逻辑，真实落库）
// ---------------------------------------------------------------------------

/** 点赞 / 取消点赞。返回最新 { likedByMe, likes } */
export async function toggleLike(
  id: string,
  userId: string
): Promise<{ likedByMe: boolean; likes: number }> {
  if (!mongoose.isValidObjectId(id)) throw new Error("无效的文物 id");
  await connectDB();
  const doc = await Artifact.findById(id);
  if (!doc) throw new Error("文物不存在");
  const uid = new mongoose.Types.ObjectId(userId);
  const already = doc.likes.some((x: any) => String(x) === userId);
  if (already) {
    doc.likes = doc.likes.filter((x: any) => String(x) !== userId) as any;
  } else {
    doc.likes = [...doc.likes, uid] as any;
  }
  await doc.save();
  return { likedByMe: !already, likes: doc.likes.length };
}

/** 收藏 / 取消收藏。返回最新 { favoritedByMe, favorites } */
export async function toggleFavorite(
  id: string,
  userId: string
): Promise<{ favoritedByMe: boolean; favorites: number }> {
  if (!mongoose.isValidObjectId(id)) throw new Error("无效的文物 id");
  await connectDB();
  const doc = await Artifact.findById(id);
  if (!doc) throw new Error("文物不存在");
  const uid = new mongoose.Types.ObjectId(userId);
  const already = doc.favorites.some((x: any) => String(x) === userId);
  if (already) {
    doc.favorites = doc.favorites.filter((x: any) => String(x) !== userId) as any;
  } else {
    doc.favorites = [...doc.favorites, uid] as any;
  }
  await doc.save();
  return { favoritedByMe: !already, favorites: doc.favorites.length };
}

// ---------------------------------------------------------------------------
// 评论（创建 / 删除，真实落库）
// ---------------------------------------------------------------------------

/** 添加评论。返回最新评论列表长度与新增评论 */
export async function addComment(
  id: string,
  userId: string,
  username: string,
  text: string
): Promise<{ comments: ArtifactDTO["comments"]; count: number }> {
  if (!mongoose.isValidObjectId(id)) throw new Error("无效的文物 id");
  const clean = (text ?? "").trim();
  if (!clean) throw new Error("评论内容不能为空");
  if (clean.length > 500) throw new Error("评论过长（≤500 字）");
  await connectDB();
  const doc = await Artifact.findById(id);
  if (!doc) throw new Error("文物不存在");
  const comment = {
    id: `c_${new mongoose.Types.ObjectId().toHexString()}`,
    userId: new mongoose.Types.ObjectId(userId),
    username: username || "匿名",
    text: clean,
    createdAt: new Date(),
  };
  doc.comments = [...doc.comments, comment as any];
  await doc.save();
  const dto = docToArtifact(doc as IArtifact, {
    commentAuthors: await loadCommentAuthors([doc as IArtifact]),
  });
  return { comments: dto.comments, count: dto.comments.length };
}

/** 删除评论（仅评论作者或管理员）。返回最新评论列表长度 */
export async function deleteComment(
  id: string,
  commentId: string,
  userId: string,
  isAdmin: boolean
): Promise<{ comments: ArtifactDTO["comments"]; count: number }> {
  if (!mongoose.isValidObjectId(id)) throw new Error("无效的文物 id");
  await connectDB();
  const doc = await Artifact.findById(id);
  if (!doc) throw new Error("文物不存在");
  const target = doc.comments.find((c: any) => String(c.id) === commentId);
  if (!target) throw new Error("评论不存在");
  if (!isAdmin && String(target.userId) !== userId) {
    throw new Error("无权删除他人评论");
  }
  doc.comments = doc.comments.filter(
    (c: any) => String(c.id) !== commentId
  ) as any;
  await doc.save();
  const dto = docToArtifact(doc as IArtifact, {
    commentAuthors: await loadCommentAuthors([doc as IArtifact]),
  });
  return { comments: dto.comments, count: dto.comments.length };
}

/** 按 id 列表批量取文物（用于「我的收藏」），无效 id 自动跳过 */
export async function getArtifactsByIds(
  ids: string[],
  userId?: string | null
): Promise<ArtifactDTO[]> {
  const valid = (ids || []).filter((id) => mongoose.isValidObjectId(id));
  if (valid.length === 0) return [];
  await connectDB();
  const docs = await Artifact.find({ _id: { $in: valid } })
    .sort({ createdAt: -1 })
    .lean();
  const commentAuthors = await loadCommentAuthors(docs as Array<IArtifact>);
  return docs.map((d) =>
    docToArtifact(d as IArtifact, { userId, commentAuthors })
  );
}

/** 按「被某用户收藏」查询文物（用于「我的收藏」列表，权威来源为 Artifact.favorites 数组） */
export async function getFavoritedByUser(
  userId: string,
  limit = 200
): Promise<ArtifactDTO[]> {
  if (!mongoose.isValidObjectId(userId)) return [];
  await connectDB();
  const docs = await Artifact.find({ favorites: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  const commentAuthors = await loadCommentAuthors(docs as Array<IArtifact>);
  return docs.map((d) =>
    docToArtifact(d as IArtifact, { userId, commentAuthors })
  );
}

// ---------------------------------------------------------------------------
// 写入 / 更新 / 删除
// ---------------------------------------------------------------------------

export async function createArtifact(
  input: ArtifactInput,
  userId: string
): Promise<ArtifactDTO> {
  await connectDB();
  const doc = await Artifact.create({
    title: input.title.trim(),
    description: input.description ?? "",
    imageUrl: input.imageUrl,
    aiTags: [],
    manualTags: (input.tags ?? []).map(String),
    era: input.era?.trim() || "",
    category: input.category?.trim() || "",
    locationName: input.locationName?.trim() || "",
    preservationStatus: mapFrontStatusToDb(input.preservationStatus),
    exactLat: typeof input.latitude === "number" ? input.latitude : null,
    exactLng: typeof input.longitude === "number" ? input.longitude : null,
    isProtected: input.isProtected ?? false,
    userId,
  });
  // pre('save') 已自动计算 blurred*；这里再读一次确保返回脱敏坐标一致
  return docToArtifact(doc.toObject() as IArtifact);
}

export async function updateArtifact(
  id: string,
  userId: string,
  patch: ArtifactPatch
): Promise<ArtifactDTO> {
  if (!mongoose.isValidObjectId(id)) throw new Error("无效的文物 id");
  await connectDB();
  const doc = await Artifact.findById(id);
  if (!doc) throw new Error("文物不存在");
  if (String(doc.userId) !== userId) {
    throw new Error("无权编辑他人提交的文物");
  }

  if (typeof patch.title === "string" && patch.title.trim()) {
    doc.title = patch.title.trim();
  }
  if (typeof patch.era === "string") doc.era = patch.era.trim() || "";
  if (typeof patch.description === "string") doc.description = patch.description;
  if (typeof patch.imageUrl === "string" && patch.imageUrl.trim()) {
    doc.imageUrl = patch.imageUrl.trim();
  }
  if (typeof patch.preservationStatus === "string") {
    doc.preservationStatus = mapFrontStatusToDb(patch.preservationStatus);
  }
  if (typeof patch.category === "string") {
    doc.category = patch.category.trim() || "";
  }
  if (typeof patch.locationName === "string") {
    doc.locationName = patch.locationName.trim() || "";
  }
  if (Array.isArray(patch.tags)) {
    doc.manualTags = patch.tags.map(String);
  }
  if (typeof patch.latitude === "number") {
    doc.exactLat = patch.latitude;
  } else if (patch.latitude === null) {
    doc.exactLat = null;
  }
  if (typeof patch.longitude === "number") {
    doc.exactLng = patch.longitude;
  } else if (patch.longitude === null) {
    doc.exactLng = null;
  }

  // 通过 save() 触发 pre('save') 钩子重新计算脱敏坐标
  await doc.save();
  return docToArtifact(doc.toObject() as IArtifact);
}

export async function deleteArtifact(
  id: string,
  userId: string
): Promise<boolean> {
  if (!mongoose.isValidObjectId(id)) return false;
  await connectDB();
  const doc = await Artifact.findById(id);
  if (!doc) return false;
  if (String(doc.userId) !== userId) {
    throw new Error("无权删除他人提交的文物");
  }
  await doc.deleteOne();
  return true;
}
