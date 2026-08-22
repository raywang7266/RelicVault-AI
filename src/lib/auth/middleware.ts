import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth/jwt";

/**
 * 本地会话中间件（替代原 Supabase 版本）。
 *
 * 需求：打开界面先要求登录，未登录时不加载任何业务页面
 *（首页上传、探索、个人中心、上传新文物）。
 *
 * - 受保护路由（需登录）：/（首页上传）、/explore、/artifacts/new、/profile
 *   → 未携带有效会话 cookie 则跳 /login（带 redirectTo）。
 * - 认证页：/login、/register
 *   → 已登录则直接跳 /explore（主浏览页）。
 *
 * 仅用 jose 校验 JWT 签名，不查库，保证 edge 运行时可用。
 */

const PROTECTED_PREFIXES = ["/", "/explore", "/artifacts/new", "/profile"];
const AUTH_PATHS = ["/login", "/register"];

function redirectToLogin(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("redirectTo", pathname);
  return NextResponse.redirect(url);
}

function redirectToExplore(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/explore";
  url.search = "";
  return NextResponse.redirect(url);
}

function isProtectedPath(pathname: string): boolean {
  // 排除认证页与回调等系统路由，避免把 /login 自身也拦掉
  if (AUTH_PATHS.includes(pathname)) return false;
  if (pathname.startsWith("/api")) return false;
  if (pathname.startsWith("/callback")) return false;
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute = AUTH_PATHS.includes(pathname);

  const userId = await verifyToken(
    request.cookies.get(SESSION_COOKIE)?.value
  );
  const authed = userId !== null;

  if (isProtectedPath(pathname) && !authed)
    return redirectToLogin(request, pathname);
  if (isAuthRoute && authed) return redirectToExplore(request);

  return NextResponse.next();
}
