/**
 * GitHub OAuth 配置。
 *
 * 通过环境变量配置：
 *   GITHUB_CLIENT_ID        必填，GitHub OAuth App 的 Client ID
 *   GITHUB_CLIENT_SECRET    必填，Client Secret（仅服务端使用）
 *   NEXT_PUBLIC_APP_URL     可选，应用访问根地址（用于拼 callback URL）。
 *                          未配置时按 request.url 推导。
 *
 * 未配置时（Mock 模式）：API 会直接 503「未配置 GitHub 登录」，
 * 避免暴露真实凭据缺口。
 */
export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  scope: string;
}

export function getGitHubConfig(requestUrl?: string): GitHubOAuthConfig | null {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (requestUrl ? new URL(requestUrl).origin : undefined) ||
    "http://localhost:3000";
  const callbackUrl = `${appUrl.replace(/\/$/, "")}/api/auth/github/callback`;

  return {
    clientId,
    clientSecret,
    callbackUrl,
    scope: "read:user user:email",
  };
}

export const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
export const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
export const GITHUB_USER_URL = "https://api.github.com/user";