import "server-only";
import { loginSchema, registerSchema } from "@/schemas/auth";
import {
  createUser,
  findByEmail,
  hashPassword,
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
  if (!u.password) {
    return { ok: false, error: "账号或密码不正确" };
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
