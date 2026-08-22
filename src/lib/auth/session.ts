import "server-only";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifyToken,
} from "./jwt";
import type { SessionUser } from "./types";

/**
 * 服务端会话：基于 httpOnly cookie + 本地 JWT（jose）。
 *
 * - 写 cookie 仅发生在 Route Handler（登录/注册/GitHub 回调），Server Component 只读。
 * - 校验不查库（jwtVerify 已完成签名校验），中间件也可安全调用 verifyToken。
 * - 需要用户资料时（布局/页面/导航栏）才按 sub 查一次 User。
 */

export async function createSession(userId: string): Promise<void> {
  const token = await signSession(userId);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifyToken(token);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  await connectDB();
  const u = await User.findById(id).lean();
  if (!u) return null;
  return {
    id: String(u._id),
    email: u.email,
    name: u.displayName ?? null,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
    mock: false,
  };
}
