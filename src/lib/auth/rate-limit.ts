import type { NextRequest } from "next/server";

/**
 * 简单的内存滑动窗口限流器（生产环境可换 Redis，例如 Upstash）。
 *
 * 用法：
 *   const limit = checkRateLimit(req, { key: "login", limit: 5, windowMs: 60_000 });
 *   if (!limit.ok) {
 *     return NextResponse.json(
 *       { error: "请求过于频繁，请稍后再试" },
 *       { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
 *     );
 *   }
 *
 * 设计要点：
 * - key 由 (path, clientIp) 组合生成，避免不同路由互相影响；
 *   也可由调用方传入自定义 key（如 "user:<id>:action"）。
 * - 内存表挂在 globalThis 上，HMR 期间状态不丢；重启 dev / 生产进程清零。
 * - 每条记录只保留「最近一次窗口」的命中时间戳，超过窗口上限即放行；
 *   真实生产可换 Redis Lua 脚本实现严格 sliding window。
 */

interface Bucket {
  /** 窗口起始时间（ms） */
  start: number;
  /** 当前窗口内累计命中 */
  count: number;
}

interface RateLimitOptions {
  /** 自定义限流 key（如 "login"）。默认按 (path, ip) */
  key?: string;
  /** 同一窗口内允许的最大命中数 */
  limit?: number;
  /** 窗口长度（毫秒） */
  windowMs?: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** 剩余可用次数 */
  remaining: number;
  /** 当 ok=false 时给出 Retry-After 秒数 */
  retryAfter: number;
  /** 当前窗口内已累计次数 */
  count: number;
  /** 触发的配置上限 */
  limit: number;
}

const globalForLimit = globalThis as unknown as {
  __rvRateLimit?: Map<string, Bucket>;
};

const buckets: Map<string, Bucket> =
  globalForLimit.__rvRateLimit ??
  (globalForLimit.__rvRateLimit = new Map());

/**
 * 提取客户端 IP。Next.js 在 App Router 下从 `x-forwarded-for` / `x-real-ip` / 远程地址
 * 三处依次回退；生产部署在 Vercel 等反向代理后建议配置 `trustHost`。
 */
export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  // Next.js 的 `request.ip` 在 Edge 运行时才有；Node 运行时可能为 undefined。
  const ip = (req as unknown as { ip?: string }).ip;
  return typeof ip === "string" ? ip : "anonymous";
}

export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): RateLimitResult {
  const limit = options.limit ?? 5;
  const windowMs = options.windowMs ?? 60_000;
  const ip = getClientIp(req);
  const path = req.nextUrl?.pathname ?? req.url;
  const key =
    options.key ??
    `path:${path}|ip:${ip}`;

  const now = Date.now();
  const cur = buckets.get(key);

  if (!cur || now - cur.start >= windowMs) {
    // 新窗口
    buckets.set(key, { start: now, count: 1 });
    return {
      ok: true,
      remaining: limit - 1,
      retryAfter: 0,
      count: 1,
      limit,
    };
  }

  cur.count += 1;
  buckets.set(key, cur);

  if (cur.count > limit) {
    const retryAfter = Math.max(
      1,
      Math.ceil((cur.start + windowMs - now) / 1000)
    );
    return { ok: false, remaining: 0, retryAfter, count: cur.count, limit };
  }

  return {
    ok: true,
    remaining: limit - cur.count,
    retryAfter: 0,
    count: cur.count,
    limit,
  };
}

/** 测试用：清空内存计数（不要在生产代码中调用） */
export function __resetRateLimit(): void {
  buckets.clear();
}