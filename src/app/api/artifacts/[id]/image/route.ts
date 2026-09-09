import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Artifact } from "@/models/Artifact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/artifacts/[id]/image
 * 把存在 MongoDB 里的 base64 封面图以二进制流返回，并带上长期缓存头。
 *
 * 目的：列表 / 个人中心等「只读列表」场景不再把整张 base64 图内联进
 * JSON（43 件文物 ≈ 12MB），而是只返回 tiny 的 `/api/artifacts/<id>/image`
 * URL，由浏览器按需、并发、带缓存地加载。这样「拉取文物库」的接口体积从
 * 十兆级降到几十 KB，避免慢网络 / 数据变多时 fetch 超时或报错。
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = ctx.params?.id;
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return new NextResponse("invalid id", { status: 400 });
  }
  try {
    await connectDB();
    const doc = (await Artifact.findById(id).select("imageUrl").lean()) as
      | { imageUrl?: string }
      | null;
    const url = doc?.imageUrl || "";
    // 老数据的封面是 http(s) 外链（如 picsum）而非 base64：直接 302 跳过去，
    // 保证 /image 对两种存储形态都能用，不会出现 404 死图。
    if (/^https?:\/\//i.test(url)) {
      return NextResponse.redirect(url, 302);
    }
    if (!url.startsWith("data:")) {
      return new NextResponse("no image", { status: 404 });
    }
    const m = url.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return new NextResponse("bad image", { status: 400 });
    const buf = Buffer.from(m[2], "base64");
    const res = new NextResponse(buf, {
      status: 200,
      headers: { "Content-Type": m[1] || "image/jpeg" },
    });
    res.headers.set("Cache-Control", "public, max-age=86400, immutable");
    return res;
  } catch {
    return new NextResponse("error", { status: 500 });
  }
}
