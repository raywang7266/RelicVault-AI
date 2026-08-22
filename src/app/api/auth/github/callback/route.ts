import { NextRequest, NextResponse } from "next/server";
import {
  GITHUB_TOKEN_URL,
  GITHUB_USER_URL,
  getGitHubConfig,
} from "@/lib/auth/github";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
} from "@/lib/auth/jwt";
import { upsertGithubUser } from "@/lib/store/users";

interface GitHubTokenResponse {
  access_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUser {
  id: number | string;
  login: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

/**
 * GET /api/auth/github/callback?code=...&state=...
 *
 * 本地化后的流程（Supabase 已到期，不再依赖其 Auth）：
 *   1. 校验 state cookie（CSRF）
 *   2. 用 code 换 access_token
 *   3. 拉 GitHub user（邮箱缺失时再拉 /user/emails 取主邮箱）
 *   4. upsert 本地 User（按 githubId 或 email 合并，password 留 null）
 *   5. 签发本地会话 JWT，写入 httpOnly cookie
 *   6. 重定向到登录前想去的页面（rv_oauth_next，默认 /explore）
 */
export async function GET(req: NextRequest) {
  const limit = checkRateLimit(req, {
    key: "github-callback",
    limit: 10,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    const url = new URL("/login", req.url);
    url.searchParams.set("oauthError", "请求过于频繁，请稍后再试");
    return NextResponse.redirect(url);
  }

  const cfg = getGitHubConfig(req.url);
  if (!cfg) {
    const url = new URL("/login", req.url);
    url.searchParams.set("oauthError", "GitHub 登录未配置");
    return NextResponse.redirect(url);
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const stateCookie = req.cookies.get("rv_oauth_state")?.value;

  if (!code || !state || !stateCookie || state !== stateCookie) {
    const url = new URL("/login", req.url);
    url.searchParams.set(
      "oauthError",
      "GitHub 回调校验失败（state 不匹配或缺失）"
    );
    return NextResponse.redirect(url);
  }

  const next = req.cookies.get("rv_oauth_next")?.value || "/explore";

  // 1) 用 code 换 token
  let tokenRes: Response;
  try {
    tokenRes = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code,
        redirect_uri: cfg.callbackUrl,
        state,
      }).toString(),
    });
  } catch (err) {
    console.error("[oauth/github] 换取 access_token 网络异常：", err);
    const url = new URL("/login", req.url);
    url.searchParams.set("oauthError", "连接 GitHub 失败，请重试");
    return NextResponse.redirect(url);
  }

  if (!tokenRes.ok) {
    const url = new URL("/login", req.url);
    url.searchParams.set(
      "oauthError",
      `GitHub 授权失败（HTTP ${tokenRes.status}）`
    );
    return NextResponse.redirect(url);
  }

  const tokenData = (await tokenRes.json()) as GitHubTokenResponse;
  if (!tokenData.access_token) {
    const url = new URL("/login", req.url);
    url.searchParams.set(
      "oauthError",
      tokenData.error_description || tokenData.error || "未拿到 GitHub access_token"
    );
    return NextResponse.redirect(url);
  }

  // 2) 拉 user 信息
  let userRes: Response;
  try {
    userRes = await fetch(GITHUB_USER_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "relicvault-ai",
      },
    });
  } catch (err) {
    console.error("[oauth/github] 拉取用户信息网络异常：", err);
    const url = new URL("/login", req.url);
    url.searchParams.set("oauthError", "读取 GitHub 用户信息失败");
    return NextResponse.redirect(url);
  }

  if (!userRes.ok) {
    const url = new URL("/login", req.url);
    url.searchParams.set(
      "oauthError",
      `读取 GitHub 用户信息失败（HTTP ${userRes.status}）`
    );
    return NextResponse.redirect(url);
  }

  const ghUser = (await userRes.json()) as GitHubUser;

  // 3) 取邮箱：公开邮箱优先；否则拉 /user/emails 取主验证邮箱
  let email = (ghUser.email ?? "").trim();
  if (!email) {
    try {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "relicvault-ai",
        },
      });
      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as GitHubEmail[];
        const primary =
          emails.find((e) => e.primary && e.verified) ??
          emails.find((e) => e.verified) ??
          emails[0];
        email = primary?.email?.trim() ?? "";
      }
    } catch {
      /* 忽略，下面统一报错 */
    }
  }
  if (!email) {
    email = `${ghUser.login}@users.noreply.github.com`;
  }

  const displayName = ghUser.name || ghUser.login;
  const avatarUrl = ghUser.avatar_url ?? undefined;

  // 4) upsert 本地账号
  let userId: string;
  try {
    const u = await upsertGithubUser({
      githubId: String(ghUser.id),
      email,
      displayName,
      avatarUrl,
    });
    userId = String(u._id);
  } catch (err) {
    console.error("[oauth/github] 创建/同步账号失败：", err);
    const url = new URL("/login", req.url);
    url.searchParams.set("oauthError", "账号同步失败，请稍后重试");
    return NextResponse.redirect(url);
  }

  // 5) 签发本地会话，写入 httpOnly cookie，重定向
  const token = await signSession(userId);
  const res = NextResponse.redirect(new URL(next, req.url).toString());
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  // 清理一次性 cookie
  res.cookies.set("rv_oauth_state", "", { path: "/", maxAge: 0 });
  res.cookies.set("rv_oauth_next", "", { path: "/", maxAge: 0 });
  return res;
}
