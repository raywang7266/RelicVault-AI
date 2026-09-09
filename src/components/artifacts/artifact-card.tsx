"use client";

import { Heart, MapPin, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Artifact } from "@/lib/types/artifact";
import { statusBadgeClasses, statusLabel } from "@/lib/types/artifact";
import { materialTheme } from "@/lib/types/material-theme";
import SmartImage from "./smart-image";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { translateOption } from "@/lib/i18n/locales";

interface ArtifactCardProps {
  artifact: Artifact;
  liked: boolean;
  likeCount: number;
  onOpen: () => void;
  onToggleLike: () => void;
  favorited?: boolean;
  onToggleFavorite?: () => void;
}

/** 从 picsum URL 中解析宽高比，用于瀑布流中保持图片原始高低错落 */
function aspectRatioOf(url: string): string {
  const m = url.match(/\/(\d+)\/(\d+)(?:\?|$)/);
  return m ? `${m[1]} / ${m[2]}` : "3 / 4";
}

export default function ArtifactCard({
  artifact,
  liked,
  likeCount,
  onOpen,
  onToggleLike,
  favorited = false,
  onToggleFavorite,
}: ArtifactCardProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const hasGeo = typeof artifact.latitude === "number" && typeof artifact.longitude === "number";
  const theme = materialTheme(artifact.category);

  return (
    <div
      className="card-sheen group relative mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-white shadow-[0_1px_2px_rgba(92,72,49,0.05),0_10px_26px_-14px_rgba(92,72,49,0.28)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border)] hover:shadow-[0_2px_4px_rgba(92,72,49,0.07),0_22px_44px_-18px_rgba(92,72,49,0.42)] dark:border-[var(--border)] dark:shadow-[inset_0_1px_0_0_rgba(212,178,128,0.22),0_4px_14px_rgba(0,0,0,0.55),0_24px_48px_-18px_rgba(0,0,0,0.7)] dark:hover:shadow-[inset_0_1px_0_0_rgba(226,188,128,0.30),0_6px_18px_rgba(0,0,0,0.65),0_30px_60px_-20px_rgba(0,0,0,0.8)]"
      style={{ ["--cat"]: theme.accent } as any}
    >
      {/* 顶部门类色条：用对应门类的传统色点睛，让瀑布流色彩有逻辑地丰富 */}
      <div className="h-[3px] w-full" style={{ background: theme.bar }} />

      {/* 缩略图（可点击打开详情） */}
      <button
        type="button"
        onClick={onOpen}
        className="relative block w-full overflow-hidden bg-[var(--chip-2)] ring-1 ring-inset ring-black/5"
        style={{ aspectRatio: aspectRatioOf(artifact.imageUrl) }}
        aria-label={t("card.view", { title: artifact.title })}
      >
        <SmartImage
          src={artifact.imageUrl}
          alt={artifact.title}
          fallbackLabel={artifact.title.slice(0, 1)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {hasGeo && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[calc(11px*var(--font-scale))] font-medium text-white backdrop-blur-sm">
            <MapPin className="h-3 w-3" /> {t("card.located")}
          </span>
        )}
        {/* 门类角标：左下角以门类色标签呼应顶部色条 */}
        <span
          className="absolute bottom-2 left-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[calc(11px*var(--font-scale))] font-medium backdrop-blur-sm"
          style={{ background: theme.tint, color: theme.accent, borderColor: theme.border }}
        >
          {translateOption(locale, artifact.category)}
        </span>
      </button>

      {/* 文案区 */}
      <div className="space-y-2.5 p-3.5">
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <h3 className="font-serif text-[calc(15px*var(--font-scale))] font-bold leading-snug text-[var(--ink)] line-clamp-2 transition-colors group-hover:text-[var(--cat)]">
            {artifact.title}
          </h3>
          <p
            className="mt-1 text-[calc(11px*var(--font-scale))] font-medium uppercase tracking-[0.12em]"
            style={{ color: theme.accent }}
          >
            {translateOption(locale, artifact.category)} · {artifact.era}
          </p>
        </button>

        {/* 标签（最多 3 个，点击搜索） */}
        {artifact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {artifact.tags.slice(0, 3).map((t) => (
              <button
                key={t}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/explore?tag=${encodeURIComponent(t)}`);
                }}
                className="pressable rounded-full border border-[var(--border-soft)] bg-[var(--paper-2)] px-2 py-0.5 text-[calc(11px*var(--font-scale))] font-medium text-[var(--chip-ink)] shadow-sm transition-colors hover:border-[var(--gold)] hover:bg-[var(--chip-2)] hover:text-[var(--bronze)]"
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {/* 底部：状态徽章 + 点赞 + 收藏 */}
        <div className="flex items-center justify-between pt-1">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[calc(11px*var(--font-scale))] font-medium ${statusBadgeClasses(
              artifact.preservationStatus
            )}`}
          >
            {translateOption(locale, statusLabel(artifact.preservationStatus))}
          </span>

          {artifact.ownerId && (artifact.ownerName || artifact.ownerAvatar) && (
            <Link
              href={`/u/${artifact.ownerId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-[calc(11px*var(--font-scale))] text-[var(--muted)] transition-colors hover:text-[var(--bronze)]"
            >
              <UserAvatar
                src={artifact.ownerAvatar}
                name={artifact.ownerName}
                size={20}
              />
              <span className="max-w-[8rem] truncate">
                {artifact.ownerName || t("common.unknownUser")}
              </span>
            </Link>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike();
              }}
              className={`pressable inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[calc(12px*var(--font-scale))] font-medium transition-colors ${
                liked
                  ? "bg-[#FBEAEA] text-[#C0392B]"
                  : "bg-[var(--surface)] text-[var(--muted-3)] hover:bg-[var(--chip-2)]"
              }`}
              aria-pressed={liked}
              aria-label={liked ? t("profile.unlike") : t("profile.like")}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
              <span className="tabular-nums">{likeCount}</span>
            </button>
            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={`pressable inline-flex items-center rounded-full px-2 py-0.5 text-[calc(12px*var(--font-scale))] font-medium transition-colors ${
                  favorited
                    ? "bg-[#E7F0E4] text-[#3B5B28]"
                    : "bg-[var(--surface)] text-[var(--muted-3)] hover:bg-[var(--chip-2)]"
                }`}
                aria-pressed={favorited}
                aria-label={favorited ? t("profile.unfavorite") : t("profile.favorite")}
              >
                <Bookmark
                  className={`h-3.5 w-3.5 ${favorited ? "fill-current" : ""}`}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
