import { NextRequest, NextResponse } from "next/server";
import { getGitHubConfig, GITHUB_AUTHORIZE_URL } from "@/lib/auth/github";

/**
 * GET /api/auth/github
 * 把浏览器重定向到 GitHub 授权页。
 * - 若环境变量 GITHUB_CLIENT_ID/SECRET 未配置：返回 503，引导用户使用账号密码登录。
 * - 生成 CSRF state 并写入 httpOnly cookie（`rv_oauth_state`），回调时校验。
 */
export async function GET(req: NextRequest) {
  const cfg = getGitHubConfig(req.url);
  if (!cfg) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "GitHub 登录未配置：请在 .env.local 中提供 GITHUB_CLIENT_ID 与 GITHUB_CLIENT_SECRET",
      },
      { status: 503 }
    );
  }

  // 简单的 CSRF 防护：用加密随机串
  const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.callbackUrl,
    scope: cfg.scope,
    state,
    allow_signup: "true",
  });

  const url = `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;

  const next = req.nextUrl.searchParams.get("next") || "/explore";

  const res = NextResponse.redirect(url);
  res.cookies.set("rv_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10, // 10 分钟内必须完成回调
  });
  res.cookies.set("rv_oauth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}