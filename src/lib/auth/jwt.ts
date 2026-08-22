import { SignJWT, jwtVerify } from "jose";

/**
 * 本地会话的 JWT 工具（edge 安全：仅依赖 jose，不引入 mongoose / next/headers）。
 *
 * 会话不存储任何敏感信息，JWT payload 仅含 `sub = userId`，
 * 由服务端用 SESSION_SECRET（HMAC-SHA256）签名，防篡改。
 * 浏览器端只持有 httpOnly cookie，无法被 JS 读取（防 XSS 盗取）。
 */

export const SESSION_COOKIE = "rv_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 天（秒）

const ALG = "HS256";

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("请在 .env.local 配置 SESSION_SECRET（会话签名密钥）");
  }
  return new TextEncoder().encode(secret);
}

/** 签发会话 token（payload.sub = userId） */
export async function signSession(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALG })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

/** 校验 token，返回 userId；无效/过期/缺失返回 null */
export async function verifyToken(
  token: string | undefined | null
): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
