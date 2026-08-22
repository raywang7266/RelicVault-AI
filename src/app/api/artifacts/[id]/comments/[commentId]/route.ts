import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { deleteComment } from "@/lib/store/artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

/** DELETE：删除某条评论（仅评论作者或管理员） */
export async function DELETE(
  req: NextRequest,
  ctx: { params: { id: string; commentId: string } }
) {
  const id = ctx.params?.id;
  const commentId = ctx.params?.commentId;
  if (!id || !commentId) {
    return noStore(
      NextResponse.json({ error: "缺少文物 id 或评论 id" }, { status: 400 })
    );
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return noStore(NextResponse.json({ error: "请先登录" }, { status: 401 }));
  }

  try {
    // 是否为管理员：查 User.role
    const { findById } = await import("@/lib/store/users");
    const u = await findById(userId);
    const isAdmin = u?.role === "admin";

    const result = await deleteComment(id, commentId, userId, isAdmin);
    return noStore(
      NextResponse.json({
        ok: true,
        comments: result.comments,
        count: result.count,
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除失败";
    const status = /无权/i.test(message)
      ? 403
      : /不存在/i.test(message)
        ? 404
        : 500;
    return noStore(NextResponse.json({ error: message }, { status }));
  }
}
