import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import {
  listNotifications,
  getUnreadCount,
  markRead,
} from "@/lib/store/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

/** GET /api/notifications —— 通知列表 + 未读总数 */
export async function GET(_req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return noStore(NextResponse.json({ error: "请先登录" }, { status: 401 }));
  }
  try {
    const [notifications, unreadCount] = await Promise.all([
      listNotifications(userId),
      getUnreadCount(userId),
    ]);
    return noStore(NextResponse.json({ notifications, unreadCount }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取通知失败";
    return noStore(NextResponse.json({ error: message }, { status: 500 }));
  }
}

/** POST /api/notifications —— 标记已读（scope: all | following；following 可带 actorId 只清某人） */
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return noStore(NextResponse.json({ error: "请先登录" }, { status: 401 }));
  }
  let scope: "all" | "following" = "all";
  let actorId: string | undefined;
  try {
    const body = (await req.json()) as { scope?: string; actorId?: string };
    if (body?.scope === "following") scope = "following";
    if (typeof body?.actorId === "string" && body.actorId) {
      actorId = body.actorId;
    }
  } catch {
    /* 缺省 all */
  }
  try {
    const modified = await markRead(userId, scope, actorId);
    return noStore(NextResponse.json({ ok: true, modified }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "操作失败";
    return noStore(NextResponse.json({ error: message }, { status: 500 }));
  }
}
