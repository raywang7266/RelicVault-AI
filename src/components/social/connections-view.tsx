"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  UserPlus,
  UserCheck,
  Loader2,
  ArrowLeft,
  Lock,
  Users,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/i18n-provider";

interface ConnectionUser {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl: string;
  bio: string;
  isCurator: boolean;
  isFollowing: boolean;
  followsMe: boolean;
  isSelf: boolean;
  followersCount: number;
}

interface ConnectionsResponse {
  canView: boolean;
  reason?: "private" | "notfound";
  users: ConnectionUser[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  target?: { id: string; displayName: string } | null;
}

const PAGE_SIZE = 20;

export default function ConnectionsView({
  userId,
  initialTab = "following",
}: {
  userId: string;
  initialTab?: "following" | "followers";
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [tab, setTab] = useState<"following" | "followers">(initialTab);
  const [q, setQ] = useState("");
  const [data, setData] = useState<ConnectionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [targetName, setTargetName] = useState("");
  const reqId = useRef(0);

  const load = useCallback(
    async (type: "following" | "followers", page: number, query: string, append: boolean) => {
      const myReq = ++reqId.current;
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const url = `/api/users/${userId}/connections?type=${type}&page=${page}&pageSize=${PAGE_SIZE}&q=${encodeURIComponent(query)}`;
        const r = await fetch(url, { cache: "no-store" });
        if (myReq !== reqId.current) return;
        const json = (await r.json()) as ConnectionsResponse;
        if (json.target) setTargetName(json.target.displayName);
        setData((prev) => {
          if (json.canView === false) return json;
          return append && prev && prev.canView
            ? {
                ...json,
                users: [...prev.users, ...json.users],
                page,
              }
            : { ...json, page };
        });
      } catch {
        /* 网络错误保持现状 */
      } finally {
        if (myReq === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [userId]
  );

  // tab / 搜索词变化 → 重新拉第一页
  useEffect(() => {
    const handle = setTimeout(() => load(tab, 1, q, false), q ? 300 : 0);
    return () => clearTimeout(handle);
  }, [tab, q, load]);

  const onLoadMore = () => {
    if (!data || !data.hasMore || loadingMore) return;
    load(tab, (data.page || 1) + 1, q, true);
  };

  const toggleFollow = async (u: ConnectionUser) => {
    if (u.isSelf) return;
    // 乐观更新
    setData((prev) =>
      prev
        ? {
            ...prev,
            users: prev.users.map((x) =>
              x.id === u.id ? { ...x, isFollowing: !x.isFollowing } : x
            ),
          }
        : prev
    );
    try {
      const r = await fetch(`/api/users/${u.id}/follow`, { method: "POST" });
      if (!r.ok) throw new Error();
    } catch {
      // 失败回滚
      setData((prev) =>
        prev
          ? {
              ...prev,
              users: prev.users.map((x) =>
                x.id === u.id ? { ...x, isFollowing: !x.isFollowing } : x
              ),
            }
          : prev
      );
    }
  };

  const switchTab = (next: "following" | "followers") => {
    if (next === tab) return;
    setTab(next);
    router.replace(`/u/${userId}/connections?tab=${next}`, { scroll: false });
  };

  const emptyKey =
    tab === "following" ? "connections.emptyFollowing" : "connections.emptyFollowers";
  const privateKey =
    tab === "following" ? "connections.privateFollowing" : "connections.privateFollowers";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* 头部：返回 + 标题 */}
      <div className="mb-5 flex items-center gap-3">
        <Link
          href={`/u/${userId}`}
          className="rounded-full border border-[var(--border)] p-2 text-[var(--bronze-ink)] transition hover:bg-[var(--chip-2)]"
          aria-label={t("connections.backToProfile")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-serif text-xl font-bold text-[var(--ink)]">
          {targetName ? `${targetName} · ${t("connections.title")}` : t("connections.title")}
        </h1>
      </div>

      {/* Tab 切换 */}
      <div className="mb-4 inline-flex rounded-lg border border-[var(--border)] bg-[var(--panel)] p-0.5">
        <button
          type="button"
          onClick={() => switchTab("following")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "following"
              ? "bg-[var(--bronze)] text-white"
              : "text-[var(--muted)] hover:bg-[var(--chip-2)]"
          }`}
        >
          {t("connections.following")}
        </button>
        <button
          type="button"
          onClick={() => switchTab("followers")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "followers"
              ? "bg-[var(--bronze)] text-white"
              : "text-[var(--muted)] hover:bg-[var(--chip-2)]"
          }`}
        >
          {t("connections.followers")}
        </button>
      </div>

      {/* 搜索框 */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-2)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("connections.searchPlaceholder")}
          className="w-full rounded-lg border border-[var(--border)] bg-white py-2 pl-9 pr-3 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)]"
        />
      </div>

      {/* 内容 */}
      {loading ? (
        <div className="py-16 text-center text-sm text-[var(--muted-2)]">
          <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-[var(--bronze)]" />
          {t("common.loading")}
        </div>
      ) : data && data.canView === false ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/50 py-16 text-center">
          <Lock className="mx-auto mb-3 h-7 w-7 text-[var(--gold)]" />
          <p className="text-sm font-medium text-[var(--bronze-ink)]">{t(privateKey)}</p>
          <p className="mt-1 text-xs text-[var(--muted-2)]">{t("connections.privateHint")}</p>
        </div>
      ) : data && data.users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/50 py-16 text-center text-sm text-[var(--muted-2)]">
          {t(emptyKey)}
        </div>
      ) : (
        <ul className="space-y-2">
          {data?.users.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3"
            >
              <Link
                href={`/u/${u.id}`}
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--chip-2)]"
              >
                {u.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatarUrl} alt={u.displayName} className="h-full w-full object-cover" />
                ) : (
                  <Users className="h-5 w-5 text-[var(--bronze)]" />
                )}
              </Link>

              <Link href={`/u/${u.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-[var(--ink)]">
                    {u.displayName}
                  </span>
                  {u.isCurator && (
                    <span className="rounded-full bg-[var(--chip-2)] px-1.5 py-0.5 text-[calc(10px*var(--font-scale))] font-medium text-[var(--bronze)]">
                      {t("social.curator")}
                    </span>
                  )}
                  {u.followsMe && (
                    <span className="rounded-full bg-[var(--chip-2)] px-1.5 py-0.5 text-[calc(10px*var(--font-scale))] font-medium text-[var(--bronze)]">
                      {u.isFollowing ? t("connections.mutual") : t("connections.followsYou")}
                    </span>
                  )}
                </div>
                {u.bio && (
                  <p className="truncate text-xs text-[var(--muted)]">{u.bio}</p>
                )}
              </Link>

              {!u.isSelf && (
                <button
                  type="button"
                  onClick={() => toggleFollow(u)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    u.isFollowing
                      ? "border border-[var(--border)] bg-white text-[var(--bronze-ink)] hover:bg-[var(--chip-2)]"
                      : "bg-[var(--bronze)] text-white hover:bg-[var(--bronze-deep)]"
                  }`}
                >
                  {u.isFollowing ? (
                    <>
                      <UserCheck className="h-3.5 w-3.5" /> {t("social.following")}
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" /> {t("social.follow")}
                    </>
                  )}
                </button>
              )}
            </li>
          ))}

          {data?.hasMore && (
            <li className="pt-2 text-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--bronze-ink)] hover:bg-[var(--chip-2)] disabled:opacity-60"
              >
                {loadingMore ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  t("connections.loadMore")
                )}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
