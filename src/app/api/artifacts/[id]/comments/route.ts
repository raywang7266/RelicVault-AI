import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/auth/session";
import { findById } from "@/lib/store/users";
import { addComment } from "@/lib/store/artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

const bodySchema = z.object({
  text: z.string().min(1, "评论内容不能为空").max(500, "评论过长（≤500 字）"),
});

/** POST：为某文物添加一条评论（真实落库） */
export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = ctx.params?.id;
  if (!id) {
    return noStore(NextResponse.json({ error: "缺少文物 id" }, { status: 400 }));
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return noStore(NextResponse.json({ error: "请先登录" }, { status: 401 }));
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return noStore(
      NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 })
    );
  }
  const parsed = bodySchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return noStore(
      NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "请求格式不正确" },
        { status: 400 }
      )
    );
  }

  try {
    const u = await findById(userId);
    const username = u?.displayName || u?.username || "匿名";
    const result = await addComment(id, userId, username, parsed.data.text);
    return noStore(
      NextResponse.json(
        { ok: true, comments: result.comments, count: result.count },
        { status: 201 }
      )
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "评论失败";
    const status = /不存在/i.test(message) ? 404 : 500;
    return noStore(NextResponse.json({ error: message }, { status }));
  }
}
