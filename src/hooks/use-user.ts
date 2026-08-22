"use client";

import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth/types";

/**
 * 订阅当前用户状态（客户端）。
 * 初始值由服务端传入（initialUser），并额外请求 /api/me 做一次权威刷新，
 * 以保证登录/注册/退出后的状态与服务端会话一致。
 */
export function useUser(initialUser?: SessionUser | null) {
  const [user, setUser] = useState<SessionUser | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user: SessionUser | null } | null) => {
        if (active) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (active) setUser(initialUser ?? null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { user, isLoading };
}
