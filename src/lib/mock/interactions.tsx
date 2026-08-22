"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Artifact } from "@/lib/types/artifact";
import type { CommentItem } from "@/lib/types/interactions";

/**
 * 文物互动（点赞 / 收藏 / 评论）客户端状态管理。
 *
 * 重要：所有互动都**真实发送 API 请求并持久化到 MongoDB**，不存在任何
 * 纯前端 useState 临时点赞/评论逻辑。localStorage 仅作为乐观更新失败的
 * 兜底回滚参考，不再作为主存储。
 *
 * - 点赞 / 取消：POST / DELETE `/api/artifacts/[id]/like`（Toggle）
 * - 收藏 / 取消：POST / DELETE `/api/artifacts/[id]/favorite`（Toggle）
 * - 评论：POST `/api/artifacts/[id]/comments`，删除 DELETE `.../comments/[commentId]`
 *
 * 状态以 id 为键维护覆盖层（overlay）：likedByMe / favoritedByMe / likes /
 * favorites / comments，初始化自服务端返回的权威值（`likedByMe` 等）。
 */
export interface InteractionState {
  likedByMe: boolean;
  favoritedByMe: boolean;
  likes: number;
  favorites: number;
  comments: CommentItem[];
}

const initial = (a: Artifact): InteractionState => ({
  likedByMe: a.likedByMe,
  favoritedByMe: a.favoritedByMe,
  likes: a.likes,
  favorites: a.favorites,
  comments: a.comments ?? [],
});

const InteractionsContext = createContext<InteractionsContextValue | null>(null);

interface InteractionsContextValue {
  states: Record<string, InteractionState>;
  seed: (artifacts: Artifact[]) => void;
  get: (a: Artifact) => InteractionState;
  isBusy: (id: string) => boolean;
  toggleLike: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addComment: (id: string, text: string) => Promise<boolean>;
  deleteComment: (id: string, commentId: string) => Promise<boolean>;
}

/**
 * 全局单例 Provider：把互动状态（点赞/收藏/评论）提升到应用根部，
 * 使探索页缩略图、个人中心、详情页共享同一份 `states`。
 *
 * 这样在 A 页面（如探索页缩略图）点赞后，跳转到详情页（B 页面）时，
 * 该文物 id 的乐观更新值已在共享 states 中，`get()` 直接命中，无需刷新。
 *
 * 关键：`seed` 仅「补充」尚未见过的 id，绝不覆盖已有覆盖层（已发生的
 * 乐观更新），因此跨页跳转不会把本地已点赞状态回退成服务端旧快照。
 */
export function InteractionsProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<Record<string, InteractionState>>({});
  // 记录正在请求中的 id，避免重复点击导致计数错位
  const busy = useRef<Set<string>>(new Set());

  /** 用服务端数据批量初始化（仅当该 id 尚无本地覆盖时，避免覆盖已发生的乐观更新） */
  const seed = useCallback((artifacts: Artifact[]) => {
    setStates((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const a of artifacts) {
        if (!next[a.id]) {
          next[a.id] = initial(a);
          changed = true;
        }
      }
      // 关键：没有任何新 id 被加入时，必须返回原引用 prev 而非新对象。
      // 否则每次渲染都强制产生新的 states → interactions 引用变化 → 依赖
      // interactions 的 effect 重跑 → 再次 seed → 又产生新 states …… 无限循环
      // （Maximum update depth exceeded）。
      return changed ? next : prev;
    });
  }, []);

  const get = useCallback(
    (a: Artifact): InteractionState =>
      states[a.id] ?? initial(a),
    [states]
  );

  const isBusy = useCallback((id: string) => busy.current.has(id), []);

  const toggleLike = useCallback(async (id: string) => {
    if (busy.current.has(id)) return;
    busy.current.add(id);
    const before = states[id];
    const wasLiked = before?.likedByMe ?? false;
    // 乐观更新
    setStates((prev) => {
      const s = prev[id] ?? { likedByMe: false, favoritedByMe: false, likes: 0, favorites: 0, comments: [] };
      const likes = s.likes + (wasLiked ? -1 : 1);
      return { ...prev, [id]: { ...s, likedByMe: !wasLiked, likes } };
    });
    try {
      const res = await fetch(`/api/artifacts/${encodeURIComponent(id)}/like`, {
        method: wasLiked ? "DELETE" : "POST",
        headers: { "Cache-Control": "no-store" },
        cache: "no-store",
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || "点赞失败");
      }
      const data = (await res.json()) as { likedByMe: boolean; likes: number };
      setStates((prev) => {
        const s = prev[id];
        if (!s) return prev;
        return { ...prev, [id]: { ...s, likedByMe: data.likedByMe, likes: data.likes } };
      });
    } catch {
      // 回滚
      setStates((prev) => {
        const s = prev[id];
        if (!s) return prev;
        return { ...prev, [id]: { ...s, likedByMe: wasLiked, likes: s.likes + (wasLiked ? 1 : -1) } };
      });
    } finally {
      busy.current.delete(id);
    }
  }, [states]);

  const toggleFavorite = useCallback(async (id: string) => {
    if (busy.current.has(id)) return;
    busy.current.add(id);
    const before = states[id];
    const wasFav = before?.favoritedByMe ?? false;
    setStates((prev) => {
      const s = prev[id] ?? { likedByMe: false, favoritedByMe: false, likes: 0, favorites: 0, comments: [] };
      const favorites = s.favorites + (wasFav ? -1 : 1);
      return { ...prev, [id]: { ...s, favoritedByMe: !wasFav, favorites } };
    });
    try {
      const res = await fetch(`/api/artifacts/${encodeURIComponent(id)}/favorite`, {
        method: wasFav ? "DELETE" : "POST",
        headers: { "Cache-Control": "no-store" },
        cache: "no-store",
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || "收藏失败");
      }
      const data = (await res.json()) as { favoritedByMe: boolean; favorites: number };
      setStates((prev) => {
        const s = prev[id];
        if (!s) return prev;
        return { ...prev, [id]: { ...s, favoritedByMe: data.favoritedByMe, favorites: data.favorites } };
      });
    } catch {
      setStates((prev) => {
        const s = prev[id];
        if (!s) return prev;
        return { ...prev, [id]: { ...s, favoritedByMe: wasFav, favorites: s.favorites + (wasFav ? 1 : -1) } };
      });
    } finally {
      busy.current.delete(id);
    }
  }, [states]);

  const addComment = useCallback(async (id: string, text: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/artifacts/${encodeURIComponent(id)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        cache: "no-store",
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || "评论失败");
      }
      const data = (await res.json()) as { comments: CommentItem[]; count: number };
      setStates((prev) => {
        const s = prev[id];
        if (!s) return prev;
        return { ...prev, [id]: { ...s, comments: data.comments, favorites: s.favorites } };
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const deleteComment = useCallback(async (id: string, commentId: string): Promise<boolean> => {
    try {
      const res = await fetch(
        `/api/artifacts/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}`,
        { method: "DELETE", headers: { "Cache-Control": "no-store" }, cache: "no-store" }
      );
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || "删除失败");
      }
      const data = (await res.json()) as { comments: CommentItem[]; count: number };
      setStates((prev) => {
        const s = prev[id];
        if (!s) return prev;
        return { ...prev, [id]: { ...s, comments: data.comments } };
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  // 关键：返回对象用 useMemo 包裹，避免每次渲染生成全新引用。
  // 否则把该对象放进调用方的 useEffect 依赖时，会因引用变化触发无限重渲染循环。
  const value = useMemo<InteractionsContextValue>(
    () => ({
      states,
      seed,
      get,
      isBusy,
      toggleLike,
      toggleFavorite,
      addComment,
      deleteComment,
    }),
    [states, seed, get, isBusy, toggleLike, toggleFavorite, addComment, deleteComment]
  );

  return (
    <InteractionsContext.Provider value={value}>
      {children}
    </InteractionsContext.Provider>
  );
}

/**
 * 消费全局互动状态的 hook。由于 Provider 挂在应用根部（layout），
 * 任意页面（探索页 / 个人中心 / 详情页）拿到的是同一份 states，
 * 因此跨页面点赞 / 收藏状态会即时同步，无需刷新。
 */
export function useInteractions(): InteractionsContextValue {
  const ctx = useContext(InteractionsContext);
  if (!ctx) {
    throw new Error(
      "useInteractions must be used within an <InteractionsProvider>"
    );
  }
  return ctx;
}
