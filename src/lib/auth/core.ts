import "server-only";
import { loginSchema, registerSchema } from "@/schemas/auth";
import {
  createUser,
  findByEmail,
  hashPassword,
  upsertGithubUser,
  verifyPassword,
} from "@/lib/store/users";
import { createSession, destroySession } from "./session";

export type AuthResult =
  | { ok: true; user: { id: string; email: string }; redirectTo: string }
  | { ok: false; error: string };

const REDIRECT_AFTER_AUTH = "/explore";

/** 账号密码登录 */
export async function authenticate(
  email: string,
  password: string
): Promise<AuthResult> {
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { ok: false, error: "请输入有效邮箱与至少 6 位密码" };
  }

  const u = await findByEmail(parsed.data.email);
  if (!u) return { ok: false, error: "账号或密码不正确" };
  // OAuth 用户没有密码，禁止走密码登录
  if (!u.password) {
    return { ok: false, error: "该账号仅支持通过 GitHub 登录" };
  }
  const ok = await verifyPassword(parsed.data.password, u.password);
  if (!ok) return { ok: false, error: "账号或密码不正确" };

  await createSession(String(u._id));
  return {
    ok: true,
    user: { id: String(u._id), email: u.email },
    redirectTo: REDIRECT_AFTER_AUTH,
  };
}

/** 账号密码注册 */
export async function registerUser(
  email: string,
  password: string,
  options?: { username?: string; displayName?: string }
): Promise<AuthResult> {
  const parsed = registerSchema.safeParse({
    email,
    password,
    confirmPassword: password,
    username: options?.username,
    displayName: options?.displayName,
  });
  if (!parsed.success) {
    return { ok: false, error: "请输入有效邮箱与至少 6 位密码" };
  }

  const existing = await findByEmail(parsed.data.email);
  if (existing) {
    return { ok: false, error: "该邮箱已注册，请直接登录" };
  }

  const hash = await hashPassword(parsed.data.password);
  const u = await createUser({
    email: parsed.data.email,
    password: hash,
    displayName: parsed.data.displayName,
    username: parsed.data.username,
  });

  await createSession(String(u._id));
  return {
    ok: true,
    user: { id: String(u._id), email: u.email },
    redirectTo: REDIRECT_AFTER_AUTH,
  };
}

/** 退出登录：清除会话 cookie */
export async function signOutUser(): Promise<void> {
  await destroySession();
}

/**
 * GitHub OAuth 用户登录：upsert 本地账号（按 githubId 或 email 合并），
 * 再签发本地会话。供 GitHub 回调路由使用。
 */
export async function signInOAuthUser(input: {
  providerUserId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}): Promise<{ user: { id: string; email: string } }> {
  const u = await upsertGithubUser({
    githubId: String(input.providerUserId),
    email: input.email,
    displayName: input.name,
    avatarUrl: input.avatarUrl,
  });
  await createSession(String(u._id));
  return { user: { id: String(u._id), email: u.email } };
}
