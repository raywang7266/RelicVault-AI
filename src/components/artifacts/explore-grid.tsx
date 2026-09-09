"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  SlidersHorizontal,
  MapPin,
  Loader2,
  LayoutGrid,
  Map as MapIcon,
  Users,
} from "lucide-react";

const ExploreMap = dynamic(() => import("./explore-map"), {
  ssr: false,
  loading: () => {
    const { t } = useTranslation();
    return (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-white/40 text-sm text-[var(--muted-2)]">
        {t("explore.mapLoading")}
      </div>
    );
  },
});
import { useToast } from "@/components/ui/toaster";
import {
  DYNASTY_OPTIONS,
  MATERIAL_OPTIONS,
  STATUS_OPTIONS,
  type Artifact,
  type Dynasty,
  type Material,
  type StatusLabel,
} from "@/lib/types/artifact";
import ArtifactCard from "./artifact-card";
import { useInteractions } from "@/lib/mock/interactions";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { translateOption } from "@/lib/i18n/locales";
import { useNotifications } from "@/hooks/use-notifications";
import { UserAvatar } from "@/components/ui/user-avatar";

interface FollowingUser {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl: string;
  /** 该关注者有多少条我未读的「新文物」通知（头像右上角红点用） */
  unreadArtifacts?: number;
}

const MAX_ITEMS = 50;

/** 简单 Fisher-Yates 洗牌：用于关注流「全部」随机混排 */
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function ExploreGrid({ initialTag }: { initialTag?: string }) {
  const [search, setSearch] = useState<string>(
    initialTag ? `#${initialTag}` : ""
  );
  const [dynasty, setDynasty] = useState<Dynasty | "">("");
  const [material, setMaterial] = useState<Material | "">("");
  const [status, setStatus] = useState<StatusLabel | "">("");

  const [view, setView] = useState<"grid" | "map">("grid");
  // 探索页双流：推荐（全部）/ 关注（仅我关注的人）
  const [feed, setFeed] = useState<"recommended" | "following">("recommended");
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);
  const [followingLoaded, setFollowingLoaded] = useState(false);
  // 关注流中当前选中的用户：null 表示「全部 / 随机混排」
  const [selectedFollowing, setSelectedFollowing] = useState<string | null>(null);

  // 数据源：直接来自后端 /api/artifacts（服务端统一过滤 + 前 50 条），
  // 网格与地图共用同一份查询结果，保证一致。
  const [serverArtifacts, setServerArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const interactions = useInteractions();
  const router = useRouter();
  const { t } = useTranslation();
  const { unreadFollowing, markFollowingRead } = useNotifications();

  // 拉取「我关注的人」头像条（小红书风格）
  useEffect(() => {
    let active = true;
    fetch("/api/following", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.users) setFollowingUsers(data.users as FollowingUser[]);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setFollowingLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const switchFeed = useCallback((next: "recommended" | "following") => {
    setFeed(next);
    if (next !== "following") {
      // 切回推荐时清空已选中的关注用户
      setSelectedFollowing(null);
    }
    // 注意：进入「关注」流本身不再立即清红点——
    // 改为「点击某个头像 / 点击全部查看更新」后才消失（小红书式）。
  }, []);

  /** 点击某个关注者头像：查看其更新流，并清除该用户的头像红点 */
  const selectFollowingUser = useCallback(
    (u: FollowingUser) => {
      setSelectedFollowing(u.id);
      if ((u.unreadArtifacts ?? 0) > 0) {
        setFollowingUsers((prev) =>
          prev.map((x) => (x.id === u.id ? { ...x, unreadArtifacts: 0 } : x))
        );
        markFollowingRead(u.id);
      }
    },
    [markFollowingRead]
  );

  /** 点击「全部」：随机混排所有关注者的帖子，并清除全部头像红点 */
  const selectAllFollowing = useCallback(() => {
    setSelectedFollowing(null);
    if (followingUsers.some((x) => (x.unreadArtifacts ?? 0) > 0)) {
      markFollowingRead();
    }
    setFollowingUsers((prev) =>
      prev.map((x) => ({ ...x, unreadArtifacts: 0 }))
    );
  }, [followingUsers, markFollowingRead]);

  // 是否有任何关注者存在未读更新（「全部」头像上的红点）
  const hasAnyFollowingUnread = useMemo(
    () => followingUsers.some((u) => (u.unreadArtifacts ?? 0) > 0),
    [followingUsers]
  );

  // 关键修复：在「探索页内部」点击标签时，router.push 到 /explore?tag=xxx
  // 仍是同一路由，ExploreGrid 组件不会重新挂载，而 useState 的初始值只在
  // 首次挂载生效，导致 initialTag 变化后搜索框不更新、需要手动刷新。这里把
  // initialTag 的变化同步进 search，使其即时反映到输入框与查询条件。
  useEffect(() => {
    setSearch(initialTag ? `#${initialTag}` : "");
  }, [initialTag]);

  // 是否处于「标签」搜索模式（#xxx）
  const isTagSearch = search.trim().startsWith("#");

  // 拉取后端数据：把筛选条件作为 query 参数发往服务端统一过滤。
  // 注意：依赖数组只包含「会触发查询重跑」的状态变量。绝不能把
  // `interactions` / `toast` 这类每次渲染都可能变化的对象放进来，否则会
  // 造成 effect 无限重跑 → 疯狂 GET 请求 → 拖垮 MongoDB 连接。
  const seed = interactions.seed;
  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (isTagSearch) {
      const tag = search.trim().slice(1).trim();
      if (tag) params.set("tag", tag);
    } else if (search.trim()) {
      params.set("q", search.trim());
    }
    if (dynasty) params.set("dynasty", dynasty);
    if (material) params.set("material", material);
    if (status) params.set("status", status);
    params.set("limit", String(MAX_ITEMS));
    if (feed === "following") {
      if (selectedFollowing) {
        params.set("owner", selectedFollowing);
      } else {
        params.set("feed", "following");
      }
    }

    fetch(`/api/artifacts?${params.toString()}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          let msg = `HTTP ${r.status}`;
          try {
            const body = await r.json();
            if (body?.error) msg = body.error;
          } catch {
            /* ignore */
          }
          throw new Error(msg);
        }
        return r.json() as Promise<{ artifacts: Artifact[] }>;
      })
      .then((data) => {
        if (!active) return;
        let list = Array.isArray(data.artifacts) ? data.artifacts : [];
        // 关注流未选中具体用户时：随机混排，模拟小红书「全部关注」的体验
        if (feed === "following" && !selectedFollowing && list.length > 1) {
          list = shuffleArray(list);
        }
        setServerArtifacts(list);
        seed(list);
      })
      .catch((err) => {
        if (!active) return;
        const message =
          err instanceof Error
            ? t("explore.errorDesc", { msg: err.message })
            : t("explore.errorDesc", { msg: t("common.retry") });
        toast({
          variant: "error",
          title: t("explore.errorTitle"),
          description: message,
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, dynasty, material, status, isTagSearch, feed, selectedFollowing]);

  const hasFilters = !!search || !!dynasty || !!material || !!status;

  const resetFilters = () => {
    setSearch("");
    setDynasty("");
    setMaterial("");
    setStatus("");
  };

  // 仅取前 50 条（服务端已过滤，这里再兜底）
  const results = useMemo(
    () => serverArtifacts.slice(0, MAX_ITEMS),
    [serverArtifacts]
  );

  // 含出土地定位的文物数量（与地图 Marker 完全一致：均来自 results 中
  // blurredLat/blurredLng 非空者）
  const locatedCount = useMemo(
    () =>
      results.filter(
        (a) => typeof a.latitude === "number" && typeof a.longitude === "number"
      ).length,
    [results]
  );

  // 当前关注流选中的用户展示名（用于空状态提示）
  const selectedFollowingName = useMemo(() => {
    if (!selectedFollowing) return null;
    return followingUsers.find((u) => u.id === selectedFollowing)?.displayName ?? null;
  }, [selectedFollowing, followingUsers]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      {/* 英雄区：眉标 + 衬线大标题 + 渐变分隔线，消除「简陋」观感 */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-[var(--border-soft)] bg-gradient-to-br from-[var(--panel)] to-[var(--paper-2)] px-6 py-8 shadow-[0_24px_60px_-36px_rgba(92,72,49,0.55)] sm:px-10 sm:py-10">
        {/* 柔光装饰 */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[var(--gold)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-[var(--bronze)] blur-3xl" />
        <p className="eyebrow relative mb-3">{t("explore.eyebrow")}</p>
        <h1 className="relative font-display text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
          {t("explore.title")}
        </h1>
        <p className="relative mt-3 max-w-2xl text-[calc(15px*var(--font-scale))] leading-relaxed text-[var(--muted)]">
          {t("explore.subtitle")}
        </p>
        <div className="gold-rule relative mt-6 max-w-[220px]" />
      </div>

      {/* 我关注的人（小红书风格头像条），仅在「关注」tab 显示 */}
      {feed === "following" && followingLoaded && followingUsers.length > 0 && (
        <div className="mb-5 flex items-center gap-3 overflow-x-auto pb-1">
          {/* 全部：随机混排所有关注者的帖子 */}
          <button
            type="button"
            onClick={selectAllFollowing}
            className={`group flex w-16 shrink-0 flex-col items-center gap-1 ${
              selectedFollowing === null ? "opacity-100" : "opacity-80"
            }`}
            title={t("common.all")}
          >
            <span className="relative">
              <span
                className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 transition-colors ${
                  selectedFollowing === null
                    ? "border-[var(--bronze)] bg-[var(--chip-2)]"
                    : "border-[var(--border-soft)] bg-[var(--panel)] group-hover:border-[var(--bronze)]"
                }`}
              >
                <Users className="h-5 w-5 text-[var(--bronze)]" />
              </span>
              {hasAnyFollowingUnread && (
                <span className="pointer-events-none absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-[#C0392B] ring-2 ring-[var(--paper)]" />
              )}
            </span>
            <span
              className={`w-full truncate text-center text-[calc(11px*var(--font-scale))] ${
                selectedFollowing === null
                  ? "font-medium text-[var(--ink)]"
                  : "text-[var(--chip-ink)]"
              }`}
            >
              {t("common.all")}
            </span>
          </button>

          {followingUsers.map((u) => {
            const selected = selectedFollowing === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => selectFollowingUser(u)}
                className="group flex w-16 shrink-0 flex-col items-center gap-1"
                title={u.displayName}
              >
                <span className="relative">
                  <span
                    className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 transition-colors ${
                      selected
                        ? "border-[var(--bronze)]"
                        : "border-[var(--border-soft)] group-hover:border-[var(--bronze)]"
                    }`}
                  >
                    <UserAvatar
                      src={u.avatarUrl}
                      name={u.displayName}
                      size={56}
                      className="h-14 w-14 rounded-full"
                    />
                  </span>
                  {(u.unreadArtifacts ?? 0) > 0 && (
                    <span className="pointer-events-none absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-[#C0392B] ring-2 ring-[var(--paper)]" />
                  )}
                </span>
                <span
                  className={`w-full truncate text-center text-[calc(11px*var(--font-scale))] ${
                    selected
                      ? "font-medium text-[var(--ink)]"
                      : "text-[var(--chip-ink)]"
                  }`}
                >
                  {u.displayName}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 搜索 + 筛选栏 */}
      <div className="mb-6 space-y-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-4">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-2)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("explore.searchPlaceholder")}
            className="w-full rounded-lg border border-[var(--border)] bg-white py-2.5 pl-10 pr-9 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-2)] hover:text-[var(--bronze-ink)]"
              aria-label={t("explore.clearSearch")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 筛选器 */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-3)]">
            <SlidersHorizontal className="h-3.5 w-3.5" /> {t("explore.filter")}
          </span>

          <FilterSelect
            label={t("explore.filterDynasty")}
            value={dynasty}
            onChange={(v) => setDynasty(v as Dynasty | "")}
            options={DYNASTY_OPTIONS as readonly string[]}
          />
          <FilterSelect
            label={t("explore.filterMaterial")}
            value={material}
            onChange={(v) => setMaterial(v as Material | "")}
            options={MATERIAL_OPTIONS as readonly string[]}
          />
          <FilterSelect
            label={t("explore.filterStatus")}
            value={status}
            onChange={(v) => setStatus(v as StatusLabel | "")}
            options={STATUS_OPTIONS as readonly string[]}
          />

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--chip-2)] px-3 py-1.5 text-xs font-medium text-[var(--chip-ink)] hover:bg-[#E2D6C1]"
            >
              <X className="h-3.5 w-3.5" /> {t("explore.clearFilters")}
            </button>
          )}
        </div>
      </div>

      {/* 结果计数 + 视图切换 */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
        <span>{t("explore.count", { n: results.length })}</span>
        {results.length >= MAX_ITEMS && (
          <span>{t("explore.maxShown")}</span>
        )}
        <span className="text-[var(--dot)]">·</span>
        <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-2)]">
          <MapPin className="h-3.5 w-3.5" />
          {t("explore.located", { n: locatedCount })}
        </span>

        {/* 双流切换：推荐 / 关注（关注流有未读更新时显示红点） */}
        <div className="inline-flex items-center rounded-lg border border-[var(--border)] bg-white p-0.5">
          <button
            type="button"
            onClick={() => switchFeed("recommended")}
            className={`relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              feed === "recommended"
                ? "bg-[var(--bronze)] text-white"
                : "text-[var(--muted)] hover:bg-[var(--chip-2)]"
            }`}
            aria-pressed={feed === "recommended"}
          >
            {t("explore.tabRecommended")}
          </button>
          <button
            type="button"
            onClick={() => switchFeed("following")}
            className={`relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              feed === "following"
                ? "bg-[var(--bronze)] text-white"
                : "text-[var(--muted)] hover:bg-[var(--chip-2)]"
            }`}
            aria-pressed={feed === "following"}
          >
            {t("explore.tabFollowing")}
            {unreadFollowing > 0 && (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#C0392B] ring-2 ring-white" />
            )}
          </button>
        </div>

        <div className="ml-auto inline-flex items-center rounded-lg border border-[var(--border)] bg-white p-0.5">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              view === "grid"
                ? "bg-[var(--bronze)] text-white"
                : "text-[var(--muted)] hover:bg-[var(--chip-2)]"
            }`}
            aria-pressed={view === "grid"}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> {t("explore.grid")}
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              view === "map"
                ? "bg-[var(--bronze)] text-white"
                : "text-[var(--muted)] hover:bg-[var(--chip-2)]"
            }`}
            aria-pressed={view === "map"}
          >
            <MapIcon className="h-3.5 w-3.5" /> {t("explore.map")}
          </button>
        </div>
      </div>

      {/* 瀑布流网格 / 地图视图 */}
      {loading ? (
        <div
          className="rounded-2xl border border-dashed border-[var(--border)] bg-white/40 py-16 text-center text-sm text-[var(--muted-2)]"
          aria-busy="true"
        >
          <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-[var(--bronze)]" />
          <p>{t("explore.loading")}</p>
        </div>
      ) : results.length === 0 ? (
        feed === "following" ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/50 py-16 text-center">
            <p className="text-sm text-[var(--muted-2)]">
              {selectedFollowingName
                ? t("explore.emptyFollowingOf", { name: selectedFollowingName })
                : t("explore.emptyFollowing")}
            </p>
            {!selectedFollowingName && (
              <Link
                href="/explore"
                onClick={() => switchFeed("recommended")}
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[var(--bronze)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--bronze-deep)]"
              >
                {t("explore.discoverPeople")}
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/50 py-20 text-center text-sm text-[var(--muted-2)]">
            {t("explore.empty")}
          </div>
        )
      ) : view === "map" ? (
        <ExploreMap artifacts={results} />
      ) : (
        <div className="stagger-fade columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
          {results.map((a) => {
            const it = interactions.get(a);
            return (
              <ArtifactCard
                key={a.id}
                artifact={a}
                liked={it.likedByMe}
                likeCount={it.likes}
                onOpen={() => router.push(`/artifacts/${a.id}`)}
                onToggleLike={() => interactions.toggleLike(a.id)}
                favorited={it.favoritedByMe}
                onToggleFavorite={() => interactions.toggleFavorite(a.id)}
              />
            );
          })}
        </div>
      )}

    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  const { t, locale } = useTranslation();
  return (
    <label className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm">
      <span className="text-xs text-[var(--muted-3)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[var(--ink)] focus:outline-none"
      >
        <option value="">{t("common.all")}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {translateOption(locale, o)}
          </option>
        ))}
      </select>
    </label>
  );
}
