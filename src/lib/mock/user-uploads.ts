"use client";

import { useCallback, useEffect, useState } from "react";
import type { Artifact } from "@/lib/types/artifact";

const keyOf = (userId: string) => `rv_uploads_${userId}`;

interface ArtifactsApiResponse {
  artifacts: Artifact[];
  count: number;
}

/**
 * 个人中心「我的贡献」数据源 Hook。
 *
 * 数据通路（与 `/api/artifacts` 保持同一个真相源）：
 * 1) **远端（首选）**：挂载与路由变化时主动 `fetch('/api/artifacts?owner=<userId>')`
 *    （带 `cache: 'no-store'`，避免 Next.js 路由/数据缓存到上次提交的旧数据）。
 * 2) **本地兜底**：保留 localStorage `rv_uploads_<userId>` 中的数据，便于：
 *    - 离线/网络出错时仍能展示；
 *    - 旧用户已有的编辑记录不会丢失。
 * 3) 合并策略：以 `id` 去重，**远端优先**；按 `createdAt` 倒序。
 * 4) 未传 userId 时，hook 把 ownerId 留空，远端会拿到「所有用户提交」，
 *    作为个人中心「未匹配回退展示」。这与需求 #3 一致。
 *
 * 增删改只更新组件本地 state + 回写 localStorage（演示模式无需再 POST 一次）；
 * 真实 Supabase 接入后，这里替换为写入 `artifacts` 行即可。
 */
export function useUserUploads(userId?: string) {
  const [uploads, setUploads] = useState<Artifact[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  /** 最近一次拉取/写入失败的错误信息（null 表示无错） */
  const [error, setError] = useState<string | null>(null);

  // —— 1. 拉取远端「我的贡献」 ——
  // 返回 { list, ok }：ok 表示 fetch 是否成功（HTTP 200）。
  // ok=false 时（网络/HTTP 失败）调用方应回退到 localStorage 兜底。
  const fetchRemote = useCallback(async (): Promise<{
    list: Artifact[];
    ok: boolean;
  }> => {
    if (typeof window === "undefined") return { list: [], ok: false };
    try {
      const url = userId
        ? `/api/artifacts?owner=${encodeURIComponent(userId)}`
        : "/api/artifacts";
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "Cache-Control": "no-store" },
      });
      if (!res.ok) return { list: [], ok: false };
      const data = (await res.json()) as ArtifactsApiResponse;
      // 仅保留拥有者匹配或本用户提交（ownerId 兜底"我的全部"）
      const list = (data.artifacts ?? []).filter((a) => {
        if (!userId) return true; // 兜底：未传 userId 时展示所有用户提交
        if (a.ownerId && a.ownerId === userId) return true;
        // 兼容：远端历史数据无 ownerId 也允许显示——保证回退展示
        if (!a.ownerId) return true;
        return false;
      });
      return { list, ok: true };
    } catch {
      return { list: [], ok: false };
    }
  }, [userId]);

  // —— 2. 从 localStorage 读取本地数据（失败/无数据时回退空，由远端填充） ——
  const loadLocal = useCallback((): Artifact[] => {
    const key = userId ? keyOf(userId) : null;
    if (typeof window === "undefined" || !key) return [];
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as Artifact[];
      }
      return [];
    } catch {
      return [];
    }
  }, [userId]);

  /**
   * 合并策略。
   *
   * **远端是唯一真相源**：只要远端成功返回了数组（哪怕为空），就以远端为准，
   * 不再把 localStorage 里残留的、远端已删除的文物「复活」进来。
   *
   * 只有当远端彻底拉取失败（返回空数组且非「用户真没有数据」时）才回退到
   * localStorage 兜底——这里用一个 `remoteOk` 标志区分：
   * - remoteOk=true（fetch 正常返回，无论长度）→ 只用远端；
   * - remoteOk=false（网络/HTTP 失败）→ 用本地兜底，避免离线时个人中心空白。
   *
   * 这样彻底修复「删除了的档案，硬刷新 / 重新登录后仍显示」的问题：
   * 删除后远端已无该 id，本地即便残留也会在远端成功时丢弃。
   */
  const merge = useCallback(
    (
      remote: Artifact[],
      local: Artifact[],
      remoteOk: boolean
    ): Artifact[] => {
      const source = remoteOk ? remote : local;
      return [...source].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
      );
    },
    []
  );

  // —— 主装载：先远端再合并本地，刷新时再拉一次 ——
  useEffect(() => {
    let active = true;
    (async () => {
      setLoaded(false);
      setError(null);
      const local = loadLocal();
      const { list: remote, ok } = await fetchRemote();
      if (!active) return;
      // 远端成功时以远端为准；失败时回退本地兜底（避免离线空白）
      setUploads(merge(remote, local, ok));
      // 仅在「远端失败 且 本地也空」时才报错提示
      if (!ok && local.length === 0) {
        setError("未能从服务端加载到任何文物");
      }
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [fetchRemote, loadLocal, merge]);

  // —— 路由聚焦/可见时主动 refetch（提交后 router.refresh() 后页面挂载） ——
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const doRefetch = async () => {
      setRefreshing(true);
      const local = readLocalNoSeed(userId);
      const { list: remote, ok } = await fetchRemote();
      if (cancelled) return;
      setUploads(merge(remote, local, ok));
      setRefreshing(false);
    };
    const onFocus = () => doRefetch();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchRemote, merge, userId]);

  // —— 任何本地变更后回写 localStorage ——
  useEffect(() => {
    if (!loaded || !userId) return;
    try {
      window.localStorage.setItem(keyOf(userId), JSON.stringify(uploads));
    } catch {
      /* 隐私模式等写入失败时静默忽略 */
    }
  }, [uploads, loaded, userId]);

  // —— 手动重新拉取（提交/删除后调用） ——
  const refetch = useCallback(async () => {
    setRefreshing(true);
    const local = readLocalNoSeed(userId);
    const { list: remote, ok } = await fetchRemote();
    setUploads(merge(remote, local, ok));
    setRefreshing(false);
  }, [fetchRemote, merge, userId]);

  const addUpload = useCallback((a: Artifact) => {
    setUploads((prev) => [a, ...prev]);
  }, []);

  const updateUpload = useCallback((id: string, patch: Partial<Artifact>) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
    );
  }, []);

  const deleteUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  /**
   * 远程更新用户提交文物。
   * 1) PATCH `/api/artifacts/<id>`（带 cache:no-store）→ 后端覆盖写到内存库。
   * 2) 用服务端返回的完整 artifact（含服务端兜底字段）覆盖本地 state。
   * 3) 若请求失败，**回退到本地 updateUpload**——保证即使服务器不可用，
   *    用户编辑操作仍能即时反映到 UI 上，避免数据丢失。
   * 4) 期间把 id 写入 `savingIds`，让上层按钮显示「保存中...」禁用态。
   */
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const updateUploadRemote = useCallback(
    async (id: string, patch: Partial<Artifact>): Promise<Artifact | null> => {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      try {
        const res = await fetch(
          `/api/artifacts/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
            cache: "no-store",
            body: JSON.stringify(patch),
          }
        );
        if (!res.ok) {
          let msg = `保存失败（${res.status}）`;
          try {
            const err = (await res.json()) as { error?: string };
            if (err?.error) msg = err.error;
          } catch {
            /* 忽略解析失败 */
          }
          throw new Error(msg);
        }
        const data = (await res.json()) as { artifact: Artifact };
        // 用服务端权威记录覆盖本地
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? data.artifact : u))
        );
        return data.artifact;
      } catch (err) {
        // 回退到本地——保留乐观更新语义，避免 UI 卡死
        updateUpload(id, patch);
        if (typeof window !== "undefined") {
          // eslint-disable-next-line no-console
          console.warn(
            "[user-uploads] 远端更新失败，已回退到本地修改：",
            err instanceof Error ? err.message : err
          );
        }
        return null;
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [updateUpload]
  );

  /**
   * 远程删除——DELETE `/api/artifacts/<id>`。
   * 成功后从本地 state 移除；失败也回退（因为 local 是已删的，不会脏）。
   */
  const deleteUploadRemote = useCallback(async (id: string) => {
    setSavingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    try {
      const res = await fetch(
        `/api/artifacts/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: { "Cache-Control": "no-store" },
          cache: "no-store",
        }
      );
      if (!res.ok) {
        let msg = `删除失败（${res.status}）`;
        try {
          const err = (await res.json()) as { error?: string };
          if (err?.error) msg = err.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      deleteUpload(id);
      // 双保险：同步从 localStorage 兜底数据中移除该 id，
      // 避免个人中心重新挂载时 merge(远端, 本地) 把已删文物从本地复活。
      if (typeof window !== "undefined" && userId) {
        try {
          const raw = window.localStorage.getItem(keyOf(userId));
          if (raw) {
            const list = JSON.parse(raw) as Artifact[];
            const next = list.filter((u) => u.id !== id);
            window.localStorage.setItem(
              keyOf(userId),
              JSON.stringify(next)
            );
          }
        } catch {
          /* 忽略解析/写入失败 */
        }
      }
      return true;
    } catch (err) {
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.warn(
          "[user-uploads] 远端删除失败：",
          err instanceof Error ? err.message : err
        );
      }
      return false;
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [deleteUpload]);

  return {
    uploads,
    loaded,
    refreshing,
    savingIds,
    error,
    refetch,
    addUpload,
    updateUpload,
    updateUploadRemote,
    deleteUpload,
    deleteUploadRemote,
  };
}

/** 读 localStorage；若该用户尚未写入则返回空（避免伪造示例数据） */
function readLocalNoSeed(userId?: string): Artifact[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = window.localStorage.getItem(keyOf(userId));
    if (!raw) return [];
    return JSON.parse(raw) as Artifact[];
  } catch {
    return [];
  }
}

