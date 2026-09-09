import "server-only";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import {
  User,
  type IUser,
  type PrivacySettings,
  DEFAULT_PRIVACY,
} from "@/models/User";
import { Notification } from "@/models/Notification";

const CURATOR_EMAIL = "curator@relicvault.app";

export interface FollowInfo {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

/** 公共用户档案（脱敏，不暴露 email/password 等） */
export interface PublicUser {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl: string;
  bio: string;
  isCurator: boolean;
  followersCount: number;
  followingCount: number;
  artifactsCount: number;
}

/** 当前用户是否关注了 target；以及双方的粉丝/关注计数 */
export async function getFollowInfo(
  currentUserId: string | null,
  targetUserId: string
): Promise<FollowInfo> {
  await connectDB();
  const target = await User.findById(targetUserId).lean<IUser>().exec();
  if (!target) {
    return { isFollowing: false, followersCount: 0, followingCount: 0 };
  }
  // 「我是否关注 TA」应查当前用户的 following 列表，而非 TA 的 following 列表
  let isFollowing = false;
  if (currentUserId) {
    const me = await User.findById(currentUserId).lean<IUser>().exec();
    if (me && Array.isArray(me.following)) {
      isFollowing = me.following.some((id: any) => String(id) === targetUserId);
    }
  }
  return {
    isFollowing,
    followersCount: await countFollowers(targetUserId),
    followingCount: Array.isArray(target.following) ? target.following.length : 0,
  };
}

/** 统计某用户的粉丝数（把该用户放入自己 following 列表的人） */
export async function countFollowers(userId: string): Promise<number> {
  await connectDB();
  return User.countDocuments({
    following: new mongoose.Types.ObjectId(userId),
  });
}

/** 切换关注状态（幂等）。返回最新状态与双方计数。不能关注自己。 */
export async function toggleFollow(
  currentUserId: string,
  targetUserId: string
): Promise<{ following: boolean; followersCount: number; followingCount: number }> {
  if (currentUserId === targetUserId) {
    throw new Error("不能关注自己");
  }
  await connectDB();
  const me = await User.findById(currentUserId);
  const target = await User.findById(targetUserId);
  if (!me || !target) throw new Error("用户不存在");

  const already = me.following.some((id: any) => String(id) === targetUserId);
  if (already) {
    me.following = me.following.filter(
      (id: any) => String(id) !== targetUserId
    ) as any;
  } else {
    me.following = [
      ...me.following,
      new mongoose.Types.ObjectId(targetUserId),
    ] as any;
  }
  await me.save();

  if (!already) {
    // 关注成功 → 给被关注者发一条「关注了你」通知
    try {
      await Notification.create({
        recipient: target._id,
        actor: me._id,
        type: "new_follow",
        read: false,
        createdAt: new Date(),
      });
    } catch {
      /* 通知失败不应阻断关注动作 */
    }
  }

  return {
    following: !already,
    followersCount: await countFollowers(targetUserId),
    // 注意：这里的 followingCount 指「目标用户自己关注了多少人」，
    // 不是当前用户的关注数（否则在 TA 主页上会看到自己的数字）。
    followingCount: Array.isArray(target.following) ? target.following.length : 0,
  };
}

/** 当前用户关注的所有用户 id（用于「关注流」过滤） */
export async function getFollowingIds(userId: string): Promise<string[]> {
  await connectDB();
  const me = await User.findById(userId).lean<IUser>().exec();
  if (!me || !Array.isArray(me.following)) return [];
  return me.following.map((id: any) => String(id));
}

/** 取某用户的公共档案（含粉丝/关注/文物计数） */
export async function getPublicUser(
  currentUserId: string | null,
  targetUserId: string,
  artifactsCount = 0
): Promise<PublicUser | null> {
  await connectDB();
  const target = await User.findById(targetUserId).lean<IUser>().exec();
  if (!target) return null;
  const info = await getFollowInfo(currentUserId, targetUserId);
  return {
    id: String(target._id),
    displayName: target.displayName,
    username: target.username ?? undefined,
    avatarUrl: target.avatarUrl ?? "",
    bio: target.bio ?? "",
    isCurator: (target.email || "").toLowerCase() === CURATOR_EMAIL,
    followersCount: info.followersCount,
    followingCount: info.followingCount,
    artifactsCount,
  };
}

/**
 * 新注册用户自动关注官方策展人（curator@relicvault.app），
 * 让「关注」流在首登即有内容、红点提示可立即演示。
 * 策展人不存在时静默跳过（演示数据会在首次读取时播种）。
 */
export async function autoFollowCurator(userId: string): Promise<void> {
  await connectDB();
  try {
    const curator = await User.findOne({ email: CURATOR_EMAIL })
      .lean<IUser>()
      .exec();
    if (!curator) return;
    const me = await User.findById(userId);
    if (!me) return;
    const curatorId = String(curator._id);
    if (me.following.some((id: any) => String(id) === curatorId)) return;
    me.following = [...me.following, curator._id] as any;
    await me.save();
  } catch {
    /* 自动关注失败不影响注册 */
  }
}

// ---------------------------------------------------------------------------
// 关注 / 粉丝列表 + 社交隐私设置
// ---------------------------------------------------------------------------

/** 读取隐私设置。老文档没有 privacy 字段时回落到默认「全部公开」。 */
export function privacyOf(
  u: { privacy?: Partial<PrivacySettings> } | null | undefined
): PrivacySettings {
  return {
    showFollowing:
      u?.privacy?.showFollowing ?? DEFAULT_PRIVACY.showFollowing,
    showFollowers:
      u?.privacy?.showFollowers ?? DEFAULT_PRIVACY.showFollowers,
  };
}

/** 列表中的一条用户记录（已带好与访问者的关系状态） */
export interface ConnectionUser {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl: string;
  bio: string;
  isCurator: boolean;
  /** 我（访问者）是否关注了 TA */
  isFollowing: boolean;
  /** TA 是否关注了我（与 isFollowing 同真 = 互相关注） */
  followsMe: boolean;
  isSelf: boolean;
  /** TA 的粉丝数（一次聚合算出，避免 N 次查询） */
  followersCount: number;
}

export interface ConnectionsResult {
  /** 是否有权查看该列表（本人永远可看自己的） */
  canView: boolean;
  /** 不可见原因：private=对方设为私密；notfound=用户不存在 */
  reason?: "private" | "notfound";
  users: ConnectionUser[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const CONNECTION_PROJECTION = {
  displayName: 1,
  username: 1,
  avatarUrl: 1,
  bio: 1,
  email: 1,
} as const;

/** 转义用户输入，避免正则注入 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchQ(
  d: { displayName?: string; username?: string },
  re: RegExp
): boolean {
  return re.test(d.displayName ?? "") || re.test(d.username ?? "");
}

/**
 * 取某用户的「关注」或「粉丝」列表。
 *
 * 隐私规则：本人查看自己的列表永远允许；他人查看需对方对应开关为 true。
 * 支持昵称/用户名搜索与分页。
 */
export async function listConnections(params: {
  targetUserId: string;
  viewerId: string | null;
  type: "following" | "followers";
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<ConnectionsResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20));
  const skip = (page - 1) * pageSize;
  const q = (params.q ?? "").trim();
  const re = q ? new RegExp(escapeRegex(q), "i") : null;

  await connectDB();
  const target = await User.findById(params.targetUserId).lean<IUser>().exec();
  if (!target) {
    return {
      canView: false,
      reason: "notfound",
      users: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
    };
  }

  const isSelf = !!params.viewerId && String(params.viewerId) === String(target._id);
  const privacy = privacyOf(target);
  const allowed =
    isSelf ||
    (params.type === "following" ? privacy.showFollowing : privacy.showFollowers);
  if (!allowed) {
    return {
      canView: false,
      reason: "private",
      users: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
    };
  }

  let total = 0;
  let slice: any[] = [];

  if (params.type === "following") {
    // 关注列表来自数组字段：最近关注的排前面
    const ids = (target.following ?? []).map((x: any) => String(x)).reverse();
    let docs: any[] = [];
    if (ids.length > 0) {
      docs = await User.find(
        { _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } },
        CONNECTION_PROJECTION
      )
        .lean()
        .exec();
    }
    const byId = new Map(docs.map((d) => [String(d._id), d]));
    let list = ids.map((id) => byId.get(id)).filter(Boolean) as any[];
    if (re) list = list.filter((d) => matchQ(d, re));
    total = list.length;
    slice = list.slice(skip, skip + pageSize);
  } else {
    const cond: Record<string, unknown> = {
      following: new mongoose.Types.ObjectId(params.targetUserId),
    };
    if (re) {
      cond.$or = [{ displayName: re }, { username: re }];
    }
    total = await User.countDocuments(cond);
    slice = await User.find(cond, CONNECTION_PROJECTION)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();
  }

  const pageIds = slice.map((d) => new mongoose.Types.ObjectId(String(d._id)));

  // 关系标记：我关注了谁 / 谁关注了我（各一次查询）
  const viewer = params.viewerId
    ? await User.findById(params.viewerId).lean<IUser>().exec()
    : null;
  const myFollowing = new Set((viewer?.following ?? []).map((x: any) => String(x)));
  const followsMeSet = new Set<string>();
  if (params.viewerId && pageIds.length > 0) {
    const rows = await User.find(
      {
        _id: { $in: pageIds },
        following: new mongoose.Types.ObjectId(params.viewerId),
      },
      { _id: 1 }
    )
      .lean()
      .exec();
    for (const r of rows) followsMeSet.add(String(r._id));
  }

  // 一次聚合算出本页每个人的粉丝数
  const fanMap = new Map<string, number>();
  if (pageIds.length > 0) {
    const rows = (await User.aggregate([
      { $match: { following: { $in: pageIds } } },
      { $group: { _id: "$following", count: { $sum: 1 } } },
    ])) as Array<{ _id: mongoose.Types.ObjectId; count: number }>;
    for (const r of rows) fanMap.set(String(r._id), r.count);
  }

  const users: ConnectionUser[] = slice.map((d) => {
    const id = String(d._id);
    return {
      id,
      displayName: d.displayName,
      username: d.username ?? undefined,
      avatarUrl: d.avatarUrl ?? "",
      bio: d.bio ?? "",
      isCurator: (d.email || "").toLowerCase() === CURATOR_EMAIL,
      isFollowing: myFollowing.has(id),
      followsMe: followsMeSet.has(id),
      isSelf: !!params.viewerId && id === String(params.viewerId),
      followersCount: fanMap.get(id) ?? 0,
    };
  });

  return {
    canView: true,
    users,
    total,
    page,
    pageSize,
    hasMore: skip + slice.length < total,
  };
}
