import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/auth/session";
import {
  deleteArtifact,
  getArtifact,
  updateArtifact,
} from "@/lib/store/artifacts";
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

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  era: z.string().optional(),
  category: z.string().optional(),
  preservationStatus: z.string().optional(),
  tags: z.array(z.union([z.string(), z.number()])).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  /** 多图（第一张为封面）；整体替换 */
  images: z.array(z.string().min(1)).max(6, "最多上传 6 张图片").optional(),
  locationName: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
})
  // 拒绝内部 API 相对路径：列表接口在 listMode 下会把 base64 重写为
  // /api/artifacts/<id>/image 用于瘦身 JSON；若编辑表单把这种路径原样回写，
  // 会覆盖真实图片形成自指死链（image 接口再 404）。只允许 http(s) 外链与 data: URI。
  .superRefine((data, ctx) => {
    const check = (val: string | undefined, code: string) => {
      if (val == null) return;
      if (val.startsWith("/")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [code],
          message: "imageUrl 必须是 http(s) 外链或 base64 data URI，不能使用相对路径",
        });
      }
    };
    check(data.imageUrl, "imageUrl");
    if (Array.isArray(data.images)) {
      data.images.forEach((u, i) => check(u, `images.${i}`));
    }
  });

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = ctx.params?.id;
  if (!id) return jsonError("缺少文物 id", 400);

  try {
    const userId = await getSessionUserId();
    const artifact = await getArtifact(id, userId);
    if (!artifact) return jsonError(`未找到 id=${id} 的文物`, 404);
    const res = NextResponse.json({ artifact });
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "读取失败";
    console.error("[api/artifacts/[id]][GET] 失败：", message);
    return jsonError(message, 500);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = ctx.params?.id;
  if (!id) return jsonError("缺少文物 id", 400);

  const userId = await getSessionUserId();
  if (!userId) return jsonError("请先登录后再编辑", 401);

  let raw: unknown;
  try {
    const text = await req.text();
    raw = text ? JSON.parse(text) : {};
  } catch {
    return jsonError("请求体不是合法 JSON");
  }

  const parsed = patchSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return jsonError(first?.message ?? "请求体格式不正确");
  }

  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    return jsonError("请求体中没有任何可更新字段");
  }

  const patch: Parameters<typeof updateArtifact>[2] = {};
  if (typeof data.title === "string") patch.title = data.title;
  if (typeof data.era === "string") patch.era = data.era;
  if (typeof data.category === "string") patch.category = data.category;
  if (typeof data.preservationStatus === "string") {
    patch.preservationStatus = (
      PRESERVATION_VALUES.includes(
        data.preservationStatus as PreservationStatus
      )
        ? data.preservationStatus
        : "Intact"
    ) as PreservationStatus;
  }
  if (Array.isArray(data.tags))
    patch.tags = data.tags.map((t) => String(t ?? "").trim()).filter(Boolean);
  if (typeof data.description === "string") patch.description = data.description;
  if (typeof data.imageUrl === "string") patch.imageUrl = data.imageUrl;
  // 多图整体替换（store 层会同步把封面设为 images[0]）
  if (Array.isArray(data.images)) patch.images = data.images;
  if (typeof data.locationName === "string") patch.locationName = data.locationName;
  if (data.latitude !== undefined) patch.latitude = data.latitude ?? undefined;
  if (data.longitude !== undefined) patch.longitude = data.longitude ?? undefined;

  try {
    const artifact = await updateArtifact(id, userId, patch);
    const res = NextResponse.json({ ok: true, artifact });
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新失败";
    const status = /无权/i.test(message)
      ? 403
      : /不存在/i.test(message)
        ? 404
        : 500;
    return jsonError(message, status);
  }
}

export const PUT = PATCH;

export async function DELETE(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = ctx.params?.id;
  if (!id) return jsonError("缺少文物 id", 400);

  const userId = await getSessionUserId();
  if (!userId) return jsonError("请先登录后再删除", 401);

  try {
    const ok = await deleteArtifact(id, userId);
    if (!ok) return jsonError(`未找到 id=${id} 的文物`, 404);
    const res = NextResponse.json({ ok: true });
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除失败";
    const status = /无权/i.test(message) ? 403 : 500;
    return jsonError(message, status);
  }
}
