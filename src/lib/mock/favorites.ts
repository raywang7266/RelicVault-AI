"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * 收藏（参考小红书「收藏」）客户端状态管理。
 *
 * - 加载：GET /api/favorites → 返回当前用户收藏的文物 id 列表。
 * - 收藏/取消：POST /api/favorites（{artifactId}）与
 *   DELETE /api/favorites?artifactId=...，成功后用服务端返回的权威 id 列表覆盖本地。
 */
export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoaded(false);
    try {
      const res = await fetch("/api/favorites", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { ids: string[] };
        setIds(Array.isArray(data.ids) ? data.ids : []);
      }
    } catch {
      /* 忽略：保持原状态 */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (artifactId: string) => {
      const isFav = ids.includes(artifactId);
      // 乐观更新
      setIds((prev) =>
        isFav ? prev.filter((x) => x !== artifactId) : [...prev, artifactId]
      );
      setBusy(true);
      try {
        const res = isFav
          ? await fetch(
              `/api/favorites?artifactId=${encodeURIComponent(artifactId)}`,
              { method: "DELETE" }
            )
          : await fetch("/api/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ artifactId }),
            });
        if (res.ok) {
          const data = (await res.json()) as { ids: string[] };
          if (Array.isArray(data.ids)) setIds(data.ids);
        } else {
          // 失败回滚
          setIds((prev) =>
            isFav ? [...prev, artifactId] : prev.filter((x) => x !== artifactId)
          );
        }
      } catch {
        setIds((prev) =>
          isFav ? [...prev, artifactId] : prev.filter((x) => x !== artifactId)
        );
      } finally {
        setBusy(false);
      }
    },
    [ids]
  );

  return {
    favoriteIds: ids,
    isFavorite: (artifactId: string) => ids.includes(artifactId),
    loaded,
    busy,
    toggle,
    refresh,
  };
}
