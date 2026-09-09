import "server-only";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { Artifact, type IArtifact, type PreservationDb } from "@/models/Artifact";
import { User } from "@/models/User";
import { deriveDynasty } from "@/lib/mock/artifact-store";
import { ensureDemoData } from "@/lib/store/ensure-demo-data";
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
  avatarUrl?: string;
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
  // 仅查询 id、username、displayName、avatarUrl 四个轻字段
  const users = await User.find(
    { _id: { $in: Array.from(ids) } },
    { username: 1, displayName: 1, avatarUrl: 1 }
  )
    .lean()
    .exec();
  const map = new Map<string, CommentAuthorInfo>();
  for (const u of users) {
    map.set(String(u._id), {
      username: (u.username as string) || undefined,
      displayName: (u.displayName as string) || "",
      avatarUrl: (u.avatarUrl as string) || undefined,
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
    /** 贡献者展示名（来自 User 表）。 */
    ownerName?: string;
    /** 贡献者头像 URL（来自 User 表）。 */
    ownerAvatar?: string;
    /**
     * 列表模式：把封面图从「内联 base64」换成轻量 URL
     * `/api/artifacts/<id>/image`，避免列表 JSON 体积膨胀到十兆级
     * （43 件文物 ≈ 12MB）。详情页不开启，仍返回 base64 供灯箱/缩放使用。
     */
    listMode?: boolean;
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
      const likesRaw = Array.isArray(c.likes) ? c.likes : [];
      // 列表模式下不内联 base64 头像（避免 JSON 体积膨胀），缺头像时前端回退首字。
      const authorAvatarRaw = latest?.avatarUrl || undefined;
      const authorAvatar =
        opts.listMode && typeof authorAvatarRaw === "string" &&
        authorAvatarRaw.startsWith("data:")
          ? undefined
          : authorAvatarRaw;
      return {
        id: String(c.id),
        author,
        authorId: c.userId ? String(c.userId) : undefined,
        authorAvatar,
        text: c.text,
        createdAt: c.createdAt
          ? new Date(c.createdAt).toISOString()
          : new Date().toISOString(),
        parentId:
          typeof c.parentId === "string" && c.parentId ? c.parentId : undefined,
        likes: likesRaw.length,
        likedByMe:
          !!userId && likesRaw.some((id: any) => String(id) === userId),
      };
    });

  const rawImage = (doc.imageUrl as string) || "";
  const idStr = doc._id ? String(doc._id) : "";
  // 列表模式：仅把「内联 base64」封面换成轻量 URL，避免 JSON 体积膨胀；
  // 若本身已是 http(s) 外链（如老数据的 picsum），保持原 URL，不做无谓中转。
  const useImageRoute = opts.listMode && !!idStr && rawImage.startsWith("data:");
  const imageUrl = useImageRoute ? `/api/artifacts/${idStr}/image` : rawImage;
  const images = opts.listMode && idStr
    ? [imageUrl]
    : Array.isArray(doc.images) && doc.images.length > 0
      ? doc.images
      : rawImage
        ? [rawImage]
        : [];

  return {
    id: String(doc._id),
    title: doc.title,
    era,
    dynasty: deriveDynasty(era),
    category: ((doc.category as Material) || "其他") as Material,
    preservationStatus: mapDbStatusToFront(doc.preservationStatus),
    tags,
    description: doc.description ?? "",
    imageUrl,
    // 多图：老数据没有 images 字段（或为空）→ 归一化回退为 [imageUrl]，
    // 保证前端永远能拿到一个非空数组，不必各处再做兜底判断。
    images,
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
    ownerName: opts.ownerName || undefined,
    // 列表模式下不内联 base64 头像（避免 JSON 体积膨胀），缺头像时前端回退首字。
    ownerAvatar:
      opts.listMode &&
      typeof opts.ownerAvatar === "string" &&
      opts.ownerAvatar.startsWith("data:")
        ? undefined
        : opts.ownerAvatar || undefined,
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
  /** 全部图片（第一张为封面）。不传时默认 [imageUrl] */
  images?: string[];
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
  /** 全部图片（第一张为封面） */
  images?: string[];
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
  /** 关注流：仅返回 followingIds 中用户提交的文物（探索页「关注」tab） */
  followingIds?: string[];
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
  // 全新空库时自动灌入演示数据（幂等；curator 已存在则直接跳过）。
  // 放在主读路径上：explore / gallery / 个人中心兜底首次访问即触发。
  await ensureDemoData();
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (options.ownerId) filter.userId = options.ownerId;
  if (options.followingIds && options.followingIds.length > 0) {
    filter.userId = {
      $in: options.followingIds.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }
  const limit = options.limit ?? 200;

  const docs = await Artifact.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // 一次性把所有出现过的评论作者 userId 查出来，渲染时优先用最新用户名
  const commentAuthors = await loadCommentAuthors(docs as Array<IArtifact>);

  // 贡献者展示名 + 头像（ownerId -> {name, avatar}），用于卡片 / 详情页头像
  const ownerIds = Array.from(
    new Set(docs.map((d: any) => String(d.userId)).filter(Boolean))
  );
  const ownerInfos = new Map<string, { name: string; avatar: string }>();
  if (ownerIds.length > 0) {
    const owners = await User.find(
      { _id: { $in: ownerIds.map((id) => new mongoose.Types.ObjectId(id)) } },
      { displayName: 1, avatarUrl: 1 }
    )
      .lean()
      .exec();
    for (const o of owners) {
      ownerInfos.set(String((o as any)._id), {
        name: (o as any).displayName || "",
        avatar: (o as any).avatarUrl || "",
      });
    }
  }

  let dtos = docs.map((d) =>
    docToArtifact(d as IArtifact, {
      userId: options.userId,
      commentAuthors,
      ownerName: ownerInfos.get(String((d as any).userId))?.name || undefined,
      ownerAvatar: ownerInfos.get(String((d as any).userId))?.avatar || undefined,
      listMode: true,
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

/** 某用户名下的文物总数（用于公开主页的 artifactsCount） */
export async function countArtifactsByOwner(ownerId: string): Promise<number> {
  if (!mongoose.isValidObjectId(ownerId)) return 0;
  await connectDB();
  return Artifact.countDocuments({
    userId: new mongoose.Types.ObjectId(ownerId),
  });
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
  // 贡献者展示名 + 头像（用于详情页贡献者行头像）
  let ownerName: string | undefined;
  let ownerAvatar: string | undefined;
  if (doc.userId) {
    const owner = await User.findById(doc.userId).lean().exec();
    if (owner) {
      ownerName = (owner as any).displayName || undefined;
      ownerAvatar = (owner as any).avatarUrl || undefined;
    }
  }
  return docToArtifact(doc as IArtifact, {
    userId,
    commentAuthors,
    ownerName,
    ownerAvatar,
  });
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

/** 添加评论（支持回复）。返回最新评论列表、长度、父评论作者 id（用于回复通知） */
export async function addComment(
  id: string,
  userId: string,
  username: string,
  text: string,
  parentId?: string | null
): Promise<{
  comments: ArtifactDTO["comments"];
  count: number;
  parentCommentAuthorId?: string | null;
}> {
  if (!mongoose.isValidObjectId(id)) throw new Error("无效的文物 id");
  const clean = (text ?? "").trim();
  if (!clean) throw new Error("评论内容不能为空");
  if (clean.length > 500) throw new Error("评论过长（≤500 字）");
  await connectDB();
  const doc = await Artifact.findById(id);
  if (!doc) throw new Error("文物不存在");

  // 校验父评论存在（回复场景）
  let parentCommentAuthorId: string | null = null;
  if (parentId) {
    const parent = doc.comments.find((c: any) => String(c.id) === parentId);
    if (!parent) throw new Error("父评论不存在");
    parentCommentAuthorId = parent.userId ? String(parent.userId) : null;
  }

  const comment = {
    id: `c_${new mongoose.Types.ObjectId().toHexString()}`,
    userId: new mongoose.Types.ObjectId(userId),
    username: username || "匿名",
    text: clean,
    likes: [] as any[],
    parentId: parentId || null,
    createdAt: new Date(),
  };
  doc.comments = [...doc.comments, comment as any];
  await doc.save();
  const dto = docToArtifact(doc as IArtifact, {
    commentAuthors: await loadCommentAuthors([doc as IArtifact]),
  });
  return {
    comments: dto.comments,
    count: dto.comments.length,
    parentCommentAuthorId,
  };
}

/** 评论点赞 / 取消点赞（嵌入子文档，用 arrayFilters 精准定位）。返回最新点赞数与状态 */
export async function toggleCommentLike(
  id: string,
  commentId: string,
  userId: string
): Promise<{ likedByMe: boolean; likes: number }> {
  if (!mongoose.isValidObjectId(id)) throw new Error("无效的文物 id");
  await connectDB();
  const doc = await Artifact.findById(id);
  if (!doc) throw new Error("文物不存在");
  const target = doc.comments.find((c: any) => String(c.id) === commentId);
  if (!target) throw new Error("评论不存在");
  const uid = new mongoose.Types.ObjectId(userId);
  const already = (target.likes || []).some((x: any) => String(x) === userId);
  if (already) {
    target.likes = (target.likes || []).filter(
      (x: any) => String(x) !== userId
    ) as any;
  } else {
    target.likes = [...(target.likes || []), uid] as any;
  }
  await doc.save();
  const dto = docToArtifact(doc as IArtifact, {
    commentAuthors: await loadCommentAuthors([doc as IArtifact]),
  });
  const updated = dto.comments.find((c) => c.id === commentId);
  return {
    likedByMe: !already,
    likes: updated?.likes ?? target.likes.length,
  };
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
    // 多图：未显式传 images 时退化为单图（[imageUrl]），保证老调用方无感
    images:
      Array.isArray(input.images) && input.images.length > 0
        ? input.images
        : [input.imageUrl],
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
  const created = docToArtifact(doc.toObject() as IArtifact);
  // 触发粉丝通知（关注我的人会在「关注」流看到红点），失败不影响建档
  try {
    const { notifyFollowersOfNewArtifact } = await import(
      "@/lib/store/notifications"
    );
    await notifyFollowersOfNewArtifact(userId, created.id, created.title);
  } catch {
    /* 通知失败不阻断主流程 */
  }
  return created;
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
  // 多图整体替换；同时把封面同步为第一张，保持 imageUrl === images[0]
  if (Array.isArray(patch.images) && patch.images.length > 0) {
    doc.images = patch.images;
    doc.imageUrl = patch.images[0];
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
