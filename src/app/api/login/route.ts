import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/core";
import { loginSchema } from "@/schemas/auth";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export async function POST(req: NextRequest) {
  // 安全解析 JSON：任何解析失败都返回 400，而不是让异常冒泡成 fetch failed
  let payload: unknown;
  try {
    const text = await req.text();
    payload = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json(
      { ok: false, error: "请求体不是合法 JSON" },
      { status: 400 }
    );
  }

  // 防暴力破解：同 IP 在 1 分钟内最多 5 次尝试；超限返回 429。
  const limit = checkRateLimit(req, { limit: 5, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: `请求过于频繁，请 ${limit.retryAfter} 秒后再试` },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfter),
          "X-RateLimit-Limit": String(limit.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const parsed = loginSchema.safeParse(payload ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "邮箱或密码格式不正确" },
      { status: 400 }
    );
  }

  const result = await authenticate(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: result.user,
    redirectTo: result.redirectTo,
  });
}
