import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** GET /api/me —— 返回当前登录用户（无则返回 null）。供客户端刷新会话状态。 */
export async function GET() {
  const user = await getSessionUser();
  const res = NextResponse.json({ user });
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
