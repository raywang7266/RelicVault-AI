import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { toggleCommentLike } from "@/lib/store/artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

/** POST /api/artifacts/[id]/comments/[commentId]/like —— 评论点赞/取消点赞 */
export async function POST(
  _req: NextRequest,
  ctx: { params: { id: string; commentId: string } }
) {
  const { id, commentId } = ctx.params || {};
  if (!id || !commentId) {
    return noStore(NextResponse.json({ error: "缺少参数" }, { status: 400 }));
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return noStore(NextResponse.json({ error: "请先登录" }, { status: 401 }));
  }
  try {
    const result = await toggleCommentLike(id, commentId, userId);
    return noStore(NextResponse.json(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : "操作失败";
    const status = /不存在/i.test(message) ? 404 : 500;
    return noStore(NextResponse.json({ error: message }, { status }));
  }
}
