import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { getSessionUserId } from "@/lib/auth/session";
import {
  createArtifact,
  listArtifactsPublic,
} from "@/lib/store/artifacts";
import { getFollowingIds } from "@/lib/store/social";
import type { PreservationStatus } from "@/lib/types/artifact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRESERVATION_VALUES: PreservationStatus[] = [
  "Intact",
  "Minor Damage",
  "Severe Degradation",
  "Ruin",
];

const submitSchema = z.object({
  title: z.string().min(1, "文物名称（title）为必填项"),
  era: z.string().optional(),
  category: z.string().optional(),
  preservationStatus: z.string().optional(),
  tags: z.array(z.union([z.string(), z.number()])).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  /** 多图（第一张为封面）。最多 6 张，由前端压缩后传入 */
  images: z.array(z.string().min(1)).max(6, "最多上传 6 张图片").optional(),
  locationName: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isProtected: z.boolean().optional(),
  ownerId: z.string().optional(), // 兼容字段（实际由服务端 session 决定）
});

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

const OBJECTID_RE = /^[0-9a-fA-F]{24}$/;

export async function GET(req: NextRequest) {
  const ownerParam = req.nextUrl.searchParams.get("owner")?.trim() || undefined;
  const limitRaw = req.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? Math.min(500, Math.max(1, Number(limitRaw) || 200)) : 200;

  const q = req.nextUrl.searchParams.get("q")?.trim() || undefined;
  const tag = req.nextUrl.searchParams.get("tag")?.trim() || undefined;
  const dynasty = req.nextUrl.searchParams.get("dynasty")?.trim() || undefined;
  const material = req.nextUrl.searchParams.get("material")?.trim() || undefined;
  const status = req.nextUrl.searchParams.get("status")?.trim() || undefined;
  const feed = req.nextUrl.searchParams.get("feed")?.trim() || undefined;

  // owner 必须是合法 ObjectId（24 位 hex）；非法值直接返回空列表（无匹配用户）。
  if (ownerParam && !OBJECTID_RE.test(ownerParam)) {
    const res = NextResponse.json({ artifacts: [], count: 0 });
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  }

  const userId = await getSessionUserId();

  // 关注流：仅返回「我关注的人」提交的文物
  let followingIds: string[] | undefined;
  if (feed === "following" && userId) {
    followingIds = await getFollowingIds(userId);
  }

  try {
    const artifacts = await listArtifactsPublic({
      ownerId: ownerParam,
      followingIds,
      limit,
      q,
      tag,
      dynasty,
      material,
      status,
      userId,
    });
    const res = NextResponse.json({ artifacts, count: artifacts.length });
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    console.error("[api/artifacts][GET] 失败：", message);
    return jsonError(message, 500);
  }
}

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(req, {
    key: "submit-artifact",
    limit: 5,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return jsonError(`请求过于频繁，请 ${limit.retryAfter} 秒后再试`, 429);
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return jsonError("请先登录后再建档", 401);
  }

  let raw: unknown;
  try {
    const text = await req.text();
    raw = text ? JSON.parse(text) : {};
  } catch {
    return jsonError("请求体不是合法 JSON");
  }

  const parsed = submitSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return jsonError(first?.message ?? "提交数据格式不正确");
  }

  const data = parsed.data;
  const preservationStatus = (
    PRESERVATION_VALUES.includes(data.preservationStatus as PreservationStatus)
      ? data.preservationStatus
      : "Intact"
  ) as PreservationStatus;

  // 封面回退：优先用显式 imageUrl，否则取 images[0]；都没有则留空（前端必传其一）
  const coverImage = data.imageUrl?.trim() || data.images?.[0] || "";

  try {
    const artifact = await createArtifact(
      {
        title: data.title.trim(),
        era: data.era?.trim() ?? "",
        category: data.category,
        preservationStatus,
        tags: (data.tags ?? []).map((t) => String(t ?? "").trim()).filter(Boolean),
        description: data.description ?? "",
        imageUrl: coverImage,
        images: data.images,
        locationName: data.locationName,
        latitude: data.latitude,
        longitude: data.longitude,
        isProtected: data.isProtected,
      },
      userId
    );

    const res = NextResponse.json({ ok: true, artifact }, { status: 201 });
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "建档失败";
    console.error("[api/artifacts][POST] 失败：", message);
    return jsonError(message, 500);
  }
}
