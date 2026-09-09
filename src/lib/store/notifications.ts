import "server-only";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { Notification, type INotification, type NotificationType } from "@/models/Notification";
import { User } from "@/models/User";

function newId(id: string) {
  return new mongoose.Types.ObjectId(id);
}

/** 给某用户的所有粉丝发「新文物」通知（关注你的人看到红点）。幂等去重。 */
export async function notifyFollowersOfNewArtifact(
  authorId: string,
  artifactId: string,
  artifactTitle: string
): Promise<void> {
  await connectDB();
  // 找出把 author 放进自己 following 列表的粉丝
  const followers = await User.find(
    { following: newId(authorId) },
    { _id: 1 }
  )
    .lean()
    .exec();
  if (followers.length === 0) return;
  const docs = followers.map((f: any) => ({
    recipient: f._id,
    actor: newId(authorId),
    type: "new_artifact" as NotificationType,
    artifactId: newId(artifactId),
    artifactTitle,
    read: false,
    createdAt: new Date(),
  }));
  try {
    await Notification.insertMany(docs);
  } catch {
    /* 通知写入失败不应影响主流程 */
  }
}

/**
 * 评论通知：
 * - 有人评论了你的文物（且不是你自己）→ type=new_comment，通知 owner
 * - 有人在评论下回复你（且不是你自己）→ type=comment_reply，通知父评论作者
 */
export async function notifyCommentInteraction(params: {
  ownerId: string;
  actorId: string;
  artifactId: string;
  artifactTitle: string;
  parentCommentAuthorId?: string | null;
}): Promise<void> {
  await connectDB();
  const docs: any[] = [];
  // 评论别人的文物 → 通知文物主
  if (params.ownerId && params.ownerId !== params.actorId) {
    docs.push({
      recipient: newId(params.ownerId),
      actor: newId(params.actorId),
      type: "new_comment" as NotificationType,
      artifactId: newId(params.artifactId),
      artifactTitle: params.artifactTitle,
      read: false,
      createdAt: new Date(),
    });
  }
  // 回复别人的评论 → 通知父评论作者
  if (
    params.parentCommentAuthorId &&
    params.parentCommentAuthorId !== params.actorId
  ) {
    docs.push({
      recipient: newId(params.parentCommentAuthorId),
      actor: newId(params.actorId),
      type: "comment_reply" as NotificationType,
      artifactId: newId(params.artifactId),
      artifactTitle: params.artifactTitle,
      read: false,
      createdAt: new Date(),
    });
  }
  if (docs.length === 0) return;
  try {
    await Notification.insertMany(docs);
  } catch {
    /* 通知写入失败不应影响主流程 */
  }
}

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  actor: { id: string; displayName: string; avatarUrl: string };
  artifactId?: string;
  artifactTitle?: string;
  read: boolean;
  createdAt: string;
}

/** 列表：批量把 actor 的展示名/头像补齐，避免 N 次查询 */
export async function listNotifications(
  recipientId: string,
  limit = 30
): Promise<NotificationDTO[]> {
  await connectDB();
  const docs = await Notification.find({ recipient: newId(recipientId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<INotification[]>()
    .exec();
  if (docs.length === 0) return [];
  const actorIds = Array.from(
    new Set(docs.map((d) => String(d.actor)))
  );
  const users = await User.find(
    { _id: { $in: actorIds } },
    { displayName: 1, avatarUrl: 1 }
  )
    .lean()
    .exec();
  const userMap = new Map<string, any>();
  for (const u of users) {
    userMap.set(String(u._id), u);
  }
  return docs.map((d) => {
    const u = userMap.get(String(d.actor));
    return {
      id: String(d._id),
      type: d.type,
      actor: {
        id: String(d.actor),
        displayName: u?.displayName || "某用户",
        avatarUrl: u?.avatarUrl || "",
      },
      artifactId: d.artifactId ? String(d.artifactId) : undefined,
      artifactTitle: d.artifactTitle || undefined,
      read: d.read,
      createdAt: new Date(d.createdAt).toISOString(),
    };
  });
}

/** 未读总数 */
export async function getUnreadCount(recipientId: string): Promise<number> {
  await connectDB();
  return Notification.countDocuments({
    recipient: newId(recipientId),
    read: false,
  });
}

/**
 * 标记已读。
 * - scope 缺省 / "all"：全部已读
 * - scope "following"：仅「新文物」类已读（探索页「关注」tab 红点用）
 *   - 传入 actorId 时：只标记该关注者的新文物（头像红点「点击查看后消失」用）
 */
export async function markRead(
  recipientId: string,
  scope: "all" | "following" = "all",
  actorId?: string
): Promise<number> {
  await connectDB();
  const filter: Record<string, unknown> = {
    recipient: newId(recipientId),
    read: false,
  };
  if (scope === "following") {
    filter.type = "new_artifact";
    if (actorId && /^[0-9a-fA-F]{24}$/.test(actorId)) {
      filter.actor = newId(actorId);
    }
  }
  const res = await Notification.updateMany(filter, { $set: { read: true } });
  return res.modifiedCount;
}

/**
 * 按 actor 统计「我」未读的新文物通知数量（探索页关注者头像红点用）。
 * 返回 Map<actorId, 未读数>，无未读的 actor 不在 Map 中。
 */
export async function getUnreadNewArtifactByActor(
  recipientId: string,
  actorIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (actorIds.length === 0) return map;
  await connectDB();
  const rows = (await Notification.aggregate([
    {
      $match: {
        recipient: new mongoose.Types.ObjectId(recipientId),
        read: false,
        type: "new_artifact",
        actor: {
          $in: actorIds
            .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
            .map((id) => new mongoose.Types.ObjectId(id)),
        },
      },
    },
    { $group: { _id: "$actor", count: { $sum: 1 } } },
  ])) as Array<{ _id: mongoose.Types.ObjectId; count: number }>;
  for (const r of rows) map.set(String(r._id), r.count);
  return map;
}
