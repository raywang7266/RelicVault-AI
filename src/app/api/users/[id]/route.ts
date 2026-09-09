import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getPublicUser, getFollowInfo } from "@/lib/store/social";
import { countArtifactsByOwner } from "@/lib/store/artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

/** GET /api/users/[id] —— 公开档案 + 当前用户与对方的关注关系 */
export async function GET(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = ctx.params?.id;
  if (!id) {
    return noStore(NextResponse.json({ error: "缺少用户 id" }, { status: 400 }));
  }
  const currentUserId = await getSessionUserId();
  try {
    const artifactsCount = await countArtifactsByOwner(id);
    const pub = await getPublicUser(currentUserId, id, artifactsCount);
    if (!pub) {
      return noStore(NextResponse.json({ error: "用户不存在" }, { status: 404 }));
    }
    const info = await getFollowInfo(currentUserId, id);
    return noStore(NextResponse.json({ user: pub, follow: info }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取用户失败";
    return noStore(NextResponse.json({ error: message }, { status: 500 }));
  }
}
