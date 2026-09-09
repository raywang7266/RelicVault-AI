import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth/core";
import { registerSchema } from "@/schemas/auth";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export async function POST(req: NextRequest) {
  // 防爆破：注册接口 1 分钟内同一 IP 最多 5 次（与登录共享桶以简化）
  const limit = checkRateLimit(req, { limit: 5, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: `请求过于频繁，请 ${limit.retryAfter} 秒后再试` },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfter),
        },
      }
    );
  }

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

  const parsed = registerSchema.safeParse(payload ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, error: first?.message ?? "请完整填写注册信息" },
      { status: 400 }
    );
  }

  const result = await registerUser(
    parsed.data.email,
    parsed.data.password,
    {
      username: parsed.data.username,
      displayName: parsed.data.displayName,
    }
  );
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 401 }
    );
  }

  // 新用户默认关注官方策展人，让「关注」流首登即有内容（失败不影响注册）
  try {
    const { autoFollowCurator } = await import("@/lib/store/social");
    if (result.user?.id) await autoFollowCurator(result.user.id);
  } catch {
    /* ignore */
  }

  return NextResponse.json({
    ok: true,
    user: result.user,
    redirectTo: result.redirectTo,
  });
}
