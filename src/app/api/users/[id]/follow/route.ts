import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { toggleFollow, getFollowInfo } from "@/lib/store/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

/** POST /api/users/[id]/follow —— 切换关注/取关（幂等） */
export async function POST(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const targetId = ctx.params?.id;
  if (!targetId) {
    return noStore(NextResponse.json({ error: "缺少用户 id" }, { status: 400 }));
  }
  const currentUserId = await getSessionUserId();
  if (!currentUserId) {
    return noStore(NextResponse.json({ error: "请先登录" }, { status: 401 }));
  }

  try {
    const result = await toggleFollow(currentUserId, targetId);
    return noStore(NextResponse.json(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : "操作失败";
    const status = /关注自己/.test(message) ? 400 : 500;
    return noStore(NextResponse.json({ error: message }, { status }));
  }
}
