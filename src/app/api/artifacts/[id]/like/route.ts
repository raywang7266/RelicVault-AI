import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { toggleLike } from "@/lib/store/artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

/** POST：点赞；DELETE：取消点赞（Toggle 逻辑，真实落库） */
async function handle(
  req: NextRequest,
  ctx: { params: { id: string } },
  method: "POST" | "DELETE"
) {
  const id = ctx.params?.id;
  if (!id) {
    return noStore(NextResponse.json({ error: "缺少文物 id" }, { status: 400 }));
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return noStore(NextResponse.json({ error: "请先登录" }, { status: 401 }));
  }
  try {
    const result = await toggleLike(id, userId);
    return noStore(NextResponse.json({ ok: true, ...result }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "操作失败";
    const status = /不存在/i.test(message) ? 404 : 500;
    return noStore(NextResponse.json({ error: message }, { status }));
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  return handle(req, ctx, "POST");
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  return handle(req, ctx, "DELETE");
}
