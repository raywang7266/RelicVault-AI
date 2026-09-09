"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export interface NotificationItem {
  id: string;
  type: "new_artifact" | "new_comment" | "comment_reply" | "new_follow";
  actor: { id: string; displayName: string; avatarUrl: string };
  artifactId?: string;
  artifactTitle?: string;
  read: boolean;
  createdAt: string;
}

/**
 * 通知共享 hook：导航铃铛与探索页「关注」tab 共用同一份数据。
 * - unreadCount：全部未读（铃铛红点）
 * - unreadFollowing：仅「新文物」类未读（关注 tab 红点）
 * 路由切换时自动刷新；提供 markAllRead / markFollowingRead 清除红点。
 */
export function useNotifications() {
  const pathname = usePathname();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (!r.ok) {
        setItems([]);
        setUnreadCount(0);
        return;
      }
      const data = (await r.json()) as {
        notifications: NotificationItem[];
        unreadCount: number;
      };
      setItems(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // 每次路由切换刷新（发新文物 / 评论后，粉丝侧红点会更新）
  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  const unreadFollowing = items.filter(
    (n) => !n.read && n.type === "new_artifact"
  ).length;

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "all" }),
      });
    } catch {
      /* ignore */
    }
  }, []);

  /**
   * 清除「新文物」类红点。
   * - 不带参数：清全部（关注 tab「全部」混排 / tab 红点）
   * - 带 actorId：只清该关注者的（其头像右上角红点「点击查看后消失」）
   */
  const markFollowingRead = useCallback(async (actorId?: string) => {
    setItems((prev) =>
      prev.map((n) =>
        n.type === "new_artifact" && (!actorId || n.actor.id === actorId)
          ? { ...n, read: true }
          : n
      )
    );
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          actorId ? { scope: "following", actorId } : { scope: "following" }
        ),
      });
    } catch {
      /* ignore */
    }
  }, []);

  return {
    items,
    unreadCount,
    unreadFollowing,
    loading,
    open,
    setOpen,
    refresh,
    markAllRead,
    markFollowingRead,
  };
}
