"use client";

import { Heart, MapPin, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Artifact } from "@/lib/types/artifact";
import { statusBadgeClasses, statusLabel } from "@/lib/types/artifact";
import SmartImage from "./smart-image";
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

  return (
    <div
      className="card-sheen group mb-5 break-inside-avoid overflow-hidden rounded-xl border border-[#E6DFC6] bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#D6CBBA]"
    >
      {/* 缩略图（可点击打开详情） */}
      <button
        type="button"
        onClick={onOpen}
        className="relative block w-full overflow-hidden bg-[#EFE6D5]"
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
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <MapPin className="h-3 w-3" /> {t("card.located")}
          </span>
        )}
      </button>

      {/* 文案区 */}
      <div className="space-y-2.5 p-3.5">
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <h3 className="font-serif text-[15px] font-bold leading-snug text-[#2C221E] line-clamp-2 group-hover:text-[#8C6D46]">
            {artifact.title}
          </h3>
          <p className="mt-1 text-xs text-[#7A6B5D]">
            {artifact.era} · {translateOption(locale, artifact.category)}
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
                className="pressable rounded-full bg-[#F2ECE1] px-2 py-0.5 text-[11px] text-[#6E5D4F] transition-colors hover:bg-[#E2D6C1] hover:text-[#8C6D46]"
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {/* 底部：状态徽章 + 点赞 + 收藏 */}
        <div className="flex items-center justify-between pt-1">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusBadgeClasses(
              artifact.preservationStatus
            )}`}
          >
            {translateOption(locale, statusLabel(artifact.preservationStatus))}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike();
              }}
              className={`pressable inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium transition-colors ${
                liked
                  ? "bg-[#FBEAEA] text-[#C0392B]"
                  : "bg-[#F5F0E6] text-[#8C7E72] hover:bg-[#EFE6D5]"
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
                className={`pressable inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium transition-colors ${
                  favorited
                    ? "bg-[#E7F0E4] text-[#3B5B28]"
                    : "bg-[#F5F0E6] text-[#8C7E72] hover:bg-[#EFE6D5]"
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
