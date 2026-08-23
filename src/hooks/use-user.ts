"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth/types";

/**
 * 订阅当前用户状态（客户端）。
 *
 * 初始值由服务端传入（initialUser），并请求 /api/me 做权威刷新。
 *
 * 两个关键刷新时机（缺一不可）：
 * 1. **挂载时 + 每次路由切换后**：登录/注册成功后走的是客户端软导航
 *    （router.push），而 Navbar 位于 root layout、跨路由不会重新挂载，
 *    所以必须监听 pathname 变化重新拉取 /api/me——否则登录后导航栏
 *    会一直停留在「未登录」快照，直到手动硬刷新。
 * 2. **initialUser prop 变化时**：router.refresh() 会让 root layout
 *    服务端重渲染并传入最新用户，但 useState 初始值不会随之更新，
 *    需要显式同步。
 */
export function useUser(initialUser?: SessionUser | null) {
  const [user, setUser] = useState<SessionUser | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  // 服务端传入的用户更新时同步本地状态（覆盖 useState 不跟随 prop 的问题）
  useEffect(() => {
    if (initialUser !== undefined) setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user: SessionUser | null } | null) => {
        if (active) setUser(data?.user ?? null);
      })
      .catch(() => {
        // 网络异常时保留当前状态（不回退到可能过期的 initialUser）
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  return { user, isLoading };
}
