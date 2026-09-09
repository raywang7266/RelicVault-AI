import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { listConnections } from "@/lib/store/social";
import { findById } from "@/lib/store/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

/**
 * GET /api/users/[id]/connections?type=following|followers&page=1&pageSize=20&q=
 *
 * 取某用户的关注 / 粉丝列表。
 * - 本人查看自己的列表：始终允许；
 * - 他人查看：受对方隐私设置约束（showFollowing / showFollowers）。
 *   无权限时返回 200 + `canView: false, reason: "private"`（前端给友好提示，
 *   不用 403，避免控制台一片红）。
 */
export async function GET(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = ctx.params?.id;
  if (!id) {
    return noStore(NextResponse.json({ error: "缺少用户 id" }, { status: 400 }));
  }

  const viewerId = await getSessionUserId();
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") === "followers" ? "followers" : "following";
  const page = Number(sp.get("page") ?? 1) || 1;
  const pageSize = Number(sp.get("pageSize") ?? 20) || 20;
  const q = (sp.get("q") ?? "").slice(0, 50);

  try {
    const [result, target] = await Promise.all([
      listConnections({
        targetUserId: id,
        viewerId,
        type: type as "following" | "followers",
        page,
        pageSize,
        q,
      }),
      findById(id),
    ]);
    return noStore(
      NextResponse.json({
        ...result,
        target: target
          ? { id: String(target._id), displayName: target.displayName }
          : null,
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取列表失败";
    return noStore(NextResponse.json({ error: message }, { status: 500 }));
  }
}
