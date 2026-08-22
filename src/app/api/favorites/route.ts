import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/auth/session";
import {
  getFavoritedByUser,
  toggleFavorite,
} from "@/lib/store/artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

const bodySchema = z.object({
  artifactId: z.string().min(1, "缺少 artifactId"),
});

/**
 * GET：返回当前用户收藏的文物完整列表（用于个人中心「我的收藏」）。
 * 权威来源为 Artifact.favorites 数组（Artifact.find({ favorites: userId })），
 * 与文物详情/卡片上的收藏按钮共用同一份数据，保证一致。
 */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return noStore(NextResponse.json({ error: "请先登录" }, { status: 401 }));
  }
  const artifacts = await getFavoritedByUser(userId);
  const ids = artifacts.map((a) => a.id);
  return noStore(NextResponse.json({ ids, artifacts }));
}

/** POST：收藏一件文物（改写 Artifact.favorites 数组） */
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return noStore(NextResponse.json({ error: "请先登录" }, { status: 401 }));
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return noStore(
      NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 })
    );
  }
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return noStore(
      NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "请求格式不正确" },
        { status: 400 }
      )
    );
  }
  try {
    const result = await toggleFavorite(parsed.data.artifactId, userId);
    return noStore(
      NextResponse.json({
        ok: true,
        favorited: result.favoritedByMe,
        favorites: result.favorites,
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "收藏失败";
    const status = /不存在/i.test(message) ? 404 : 500;
    return noStore(NextResponse.json({ error: message }, { status }));
  }
}

/** DELETE：取消收藏（artifactId 可放 body 或 query） */
export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return noStore(NextResponse.json({ error: "请先登录" }, { status: 401 }));
  }
  const fromQuery = req.nextUrl.searchParams.get("artifactId");
  let artifactId = fromQuery ?? "";
  if (!artifactId) {
    try {
      const body = (await req.json()) as { artifactId?: string };
      artifactId = body.artifactId ?? "";
    } catch {
      /* 无 body 也可 */
    }
  }
  if (!artifactId) {
    return noStore(NextResponse.json({ error: "缺少 artifactId" }, { status: 400 }));
  }
  try {
    const result = await toggleFavorite(artifactId, userId);
    return noStore(
      NextResponse.json({
        ok: true,
        favorited: result.favoritedByMe,
        favorites: result.favorites,
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "取消收藏失败";
    const status = /不存在/i.test(message) ? 404 : 500;
    return noStore(NextResponse.json({ error: message }, { status }));
  }
}
