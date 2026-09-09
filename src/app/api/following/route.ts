import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSessionUserId } from "@/lib/auth/session";
import { getFollowingIds } from "@/lib/store/social";
import { getUnreadNewArtifactByActor } from "@/lib/store/notifications";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** GET /api/following —— 当前用户关注的人（精简档案，用于探索页头像条） */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ users: [] });
  }
  try {
    const ids = await getFollowingIds(userId);
    if (ids.length === 0) {
      return NextResponse.json({ users: [] });
    }
    const docs = await User.find(
      { _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } },
      { displayName: 1, avatarUrl: 1, username: 1 }
    )
      .lean()
      .exec();
    const users: Array<{
      id: string;
      displayName: string;
      username?: string;
      avatarUrl: string;
      unreadArtifacts: number;
    }> = docs.map((u: any) => ({
      id: String(u._id),
      displayName: u.displayName,
      username: u.username ?? undefined,
      avatarUrl: u.avatarUrl ?? "",
      unreadArtifacts: 0,
    }));
    // 保持关注顺序（getFollowingIds 返回的顺序）
    const order = new Map(ids.map((id, i) => [id, i]));
    users.sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
    );
    // 附带每位关注者的未读「新文物」数（头像右上角红点用）
    let unreadMap = new Map<string, number>();
    try {
      unreadMap = await getUnreadNewArtifactByActor(userId, ids);
    } catch {
      /* 红点统计失败不影响头像条 */
    }
    for (const u of users) {
      u.unreadArtifacts = unreadMap.get(u.id) ?? 0;
    }
    const res = NextResponse.json({ users });
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch {
    return NextResponse.json({ users: [] });
  }
}
