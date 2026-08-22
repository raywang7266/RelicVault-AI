"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Search, X, SlidersHorizontal, MapPin, Loader2, LayoutGrid, Map as MapIcon } from "lucide-react";

const ExploreMap = dynamic(() => import("./explore-map"), {
  ssr: false,
  loading: () => {
    const { t } = useTranslation();
    return (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-dashed border-[#D6CBBA] bg-white/40 text-sm text-[#9C8E80]">
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
  statusLabel,
  type Artifact,
  type Dynasty,
  type Material,
  type StatusLabel,
} from "@/lib/types/artifact";
import ArtifactCard from "./artifact-card";
import { useInteractions } from "@/lib/mock/interactions";
import { useTranslation } from "@/lib/i18n/i18n-provider";

const MAX_ITEMS = 50;

export default function ExploreGrid({ initialTag }: { initialTag?: string }) {
  const [search, setSearch] = useState<string>(
    initialTag ? `#${initialTag}` : ""
  );
  const [dynasty, setDynasty] = useState<Dynasty | "">("");
  const [material, setMaterial] = useState<Material | "">("");
  const [status, setStatus] = useState<StatusLabel | "">("");

  const [view, setView] = useState<"grid" | "map">("grid");

  // 数据源：直接来自后端 /api/artifacts（服务端统一过滤 + 前 50 条），
  // 网格与地图共用同一份查询结果，保证一致。
  const [serverArtifacts, setServerArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const interactions = useInteractions();
  const router = useRouter();
  const { t } = useTranslation();

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
        const list = Array.isArray(data.artifacts) ? data.artifacts : [];
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
  }, [search, dynasty, material, status, isTagSearch]);

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* 标题区 */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-[#2C221E]">
          {t("explore.title")}
        </h1>
        <p className="mt-1.5 text-sm text-[#7A6B5D]">{t("explore.subtitle")}</p>
      </div>

      {/* 搜索 + 筛选栏 */}
      <div className="mb-6 space-y-3 rounded-2xl border border-[#E6DFC6] bg-[#FAF7F2] p-4">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9C8E80]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("explore.searchPlaceholder")}
            className="w-full rounded-lg border border-[#D6CBBA] bg-white py-2.5 pl-10 pr-9 text-sm text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8E80] hover:text-[#5C4831]"
              aria-label={t("explore.clearSearch")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 筛选器 */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#8C7E72]">
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
              className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#EFE6D5] px-3 py-1.5 text-xs font-medium text-[#6E5D4F] hover:bg-[#E2D6C1]"
            >
              <X className="h-3.5 w-3.5" /> {t("explore.clearFilters")}
            </button>
          )}
        </div>
      </div>

      {/* 结果计数 + 视图切换 */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-[#7A6B5D]">
        <span>{t("explore.count", { n: results.length })}</span>
        {results.length >= MAX_ITEMS && (
          <span>{t("explore.maxShown")}</span>
        )}
        <span className="text-[#C9BCA6]">·</span>
        <span className="inline-flex items-center gap-1 text-xs text-[#9C8E80]">
          <MapPin className="h-3.5 w-3.5" />
          {t("explore.located", { n: locatedCount })}
        </span>

        <div className="ml-auto inline-flex items-center rounded-lg border border-[#D6CBBA] bg-white p-0.5">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              view === "grid"
                ? "bg-[#8C6D46] text-white"
                : "text-[#7A6B5D] hover:bg-[#EFE6D5]"
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
                ? "bg-[#8C6D46] text-white"
                : "text-[#7A6B5D] hover:bg-[#EFE6D5]"
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
          className="rounded-2xl border border-dashed border-[#D6CBBA] bg-white/40 py-16 text-center text-sm text-[#9C8E80]"
          aria-busy="true"
        >
          <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-[#8C6D46]" />
          <p>{t("explore.loading")}</p>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D6CBBA] bg-white/50 py-20 text-center text-sm text-[#9C8E80]">
          {t("explore.empty")}
        </div>
      ) : view === "map" ? (
        <ExploreMap artifacts={results} />
      ) : (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
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
  return (
    <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#D6CBBA] bg-white px-3 py-1.5 text-sm">
      <span className="text-xs text-[#8C7E72]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[#2C221E] focus:outline-none"
      >
        <option value="">全部</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
