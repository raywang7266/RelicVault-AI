"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { useNotifications, type NotificationItem } from "@/hooks/use-notifications";
import { useTranslation } from "@/lib/i18n/i18n-provider";

function timeAgo(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return locale === "en" ? "just now" : "刚刚";
  if (min < 60) return locale === "en" ? `${min}m` : `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return locale === "en" ? `${hr}h` : `${hr} 小时前`;
  const d = Math.floor(hr / 24);
  return locale === "en" ? `${d}d` : `${d} 天前`;
}

function describe(
  n: NotificationItem,
  t: (k: string, vars?: Record<string, string | number>) => string
): string {
  const name = n.actor.displayName;
  switch (n.type) {
    case "new_artifact":
      return t("notif.postedArtifact", { name, title: n.artifactTitle || "" });
    case "new_comment":
      return t("notif.commented", { name, title: n.artifactTitle || "" });
    case "comment_reply":
      return t("notif.replied", { name, title: n.artifactTitle || "" });
    case "new_follow":
      return t("notif.followed", { name });
    default:
      return "";
  }
}

function IconFor({ type }: { type: NotificationItem["type"] }) {
  if (type === "new_follow")
    return <UserPlus className="h-4 w-4 text-[var(--bronze)]" />;
  if (type === "comment_reply" || type === "new_comment")
    return <MessageCircle className="h-4 w-4 text-[#3B6B9B]" />;
  return <Heart className="h-4 w-4 text-[#C0392B]" />;
}

export function NotificationBell() {
  const { items, unreadCount, open, setOpen, markAllRead } = useNotifications();
  const { t, locale } = useTranslation();
  const ref = useRef<HTMLDivElement | null>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, setOpen]);

  const targetHref = (n: NotificationItem) =>
    n.artifactId ? `/artifacts/${n.artifactId}` : `/explore`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && unreadCount > 0) markAllRead();
        }}
        aria-label={t("notif.bell")}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--bronze-ink)] transition-colors hover:bg-[var(--chip-2)]"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#C0392B] ring-2 ring-[var(--panel)]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--border-soft)] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--chip-2)] px-4 py-2.5">
            <span className="text-sm font-semibold text-[var(--ink)]">
              {t("notif.title")}
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#FBEAEA] px-2 py-0.5 text-[calc(11px*var(--font-scale))] font-medium text-[#C0392B]">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-[var(--muted-2)]">
                {t("notif.empty")}
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border-soft)]">
                {items.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={targetHref(n)}
                      onClick={() => setOpen(false)}
                      className={`flex items-start gap-2.5 px-4 py-3 transition-colors hover:bg-[var(--panel)] ${
                        n.read ? "" : "bg-[var(--panel)]"
                      }`}
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--chip-2)]">
                        {n.actor.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={n.actor.avatarUrl}
                            alt={n.actor.displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <IconFor type={n.type} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[calc(13px*var(--font-scale))] leading-snug text-[var(--brown)]">
                          {describe(n, t)}
                        </p>
                        <span className="mt-0.5 block text-[calc(11px*var(--font-scale))] text-[var(--muted-4)]">
                          {timeAgo(n.createdAt, locale)}
                        </span>
                      </div>
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C0392B]" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
