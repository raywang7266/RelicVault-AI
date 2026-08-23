import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser, getSessionUserId } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/me —— 返回当前登录用户（无则返回 null）。供客户端刷新会话状态。
 *
 * 附带陈旧会话自愈：若 JWT 签名有效但用户已不存在于数据库
 * （典型场景：带着旧会话 cookie 切换到全新的 MongoDB 实例），
 * 则在 Route Handler 中清除该 cookie（Server Component 无权改 cookie，
 * 此处可以），让客户端立即回到干净的未登录态，避免
 * 「中间件认为已登录、页面查库认为未登录」的不一致状态。
 */
export async function GET() {
  const userId = await getSessionUserId();
  const user = userId ? await getSessionUser() : null;

  if (userId && !user) {
    // 陈旧会话：清掉指向已不存在用户的 cookie
    cookies().delete(SESSION_COOKIE);
  }

  const res = NextResponse.json({ user });
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
