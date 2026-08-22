"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Heart, MapPin, X, Send, Navigation, Bookmark } from "lucide-react";
import type { Artifact } from "@/lib/types/artifact";
import { statusBadgeClasses, statusLabel } from "@/lib/types/artifact";
import type { CommentItem } from "@/lib/types/interactions";
import SmartImage from "./smart-image";

/** 点击标签跳转探索页按 #标签 检索；onNavigate 用于关闭弹窗等收尾操作 */
function TagChip({
  tag,
  onNavigate,
}: {
  tag: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/explore?tag=${encodeURIComponent(tag)}`);
        onNavigate?.();
      }}
      className="rounded-full bg-[#F2ECE1] px-2 py-0.5 text-[11px] text-[#6E5D4F] transition-colors hover:bg-[#E2D6C1] hover:text-[#8C6D46]"
    >
      #{tag}
    </button>
  );
}

// Leaflet 依赖 window，必须仅在客户端加载，避免 SSR 报错。
const DetailMap = dynamic(() => import("./detail-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] items-center justify-center rounded-lg bg-[#F5F0E6] text-xs text-[#9C8E80]">
      地图加载中…
    </div>
  ),
});

interface ArtifactDetailProps {
  artifact: Artifact;
  liked: boolean;
  likeCount: number;
  comments: CommentItem[];
  onClose: () => void;
  onToggleLike: () => void;
  onAddComment: (text: string) => void;
  onDeleteComment?: (commentId: string) => void;
  /** 个人中心等场景：隐藏点赞/评论互动区（只读查看） */
  hideInteractions?: boolean;
  /** 收藏状态与切换（参考小红书「收藏」） */
  favorited?: boolean;
  onToggleFavorite?: () => void;
}

export default function ArtifactDetail({
  artifact,
  liked,
  likeCount,
  comments,
  onClose,
  onToggleLike,
  onAddComment,
  onDeleteComment,
  hideInteractions = false,
  favorited = false,
  onToggleFavorite,
}: ArtifactDetailProps) {
  const [draft, setDraft] = useState("");
  const hasGeo =
    typeof artifact.latitude === "number" && typeof artifact.longitude === "number";

  // ESC 关闭
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const submitComment = () => {
    const text = draft.trim();
    if (!text) return;
    onAddComment(text);
    setDraft("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1F1714] p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${artifact.title} 详情`}
    >
      <div
        className="relative my-4 w-full max-w-3xl rounded-2xl border border-[#E6DFC6] bg-[#FAF7F2] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/60"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid max-h-[88vh] grid-cols-1 md:grid-cols-2">
          {/* 左：大图 */}
          <div className="flex max-h-[40vh] items-center justify-center overflow-hidden rounded-t-2xl bg-[#2C221E] md:max-h-none md:rounded-l-2xl md:rounded-tr-none">
            <SmartImage
              src={artifact.imageUrl}
              alt={artifact.title}
              fallbackLabel={artifact.title.slice(0, 1)}
              className="h-full max-h-[60vh] w-full object-contain"
            />
          </div>

          {/* 右：信息 + 互动 */}
          <div className="flex max-h-[88vh] flex-col overflow-y-auto p-5">
            <h2 className="pr-8 font-serif text-xl font-bold text-[#2C221E]">
              {artifact.title}
            </h2>
            <p className="mt-1 text-sm text-[#7A6B5D]">
              {artifact.era} · {artifact.category}
            </p>

            {/* 标签 */}
            {artifact.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {artifact.tags.map((t) => (
                  <TagChip key={t} tag={t} onNavigate={onClose} />
                ))}
              </div>
            )}

            {/* 元数据 */}
            <dl className="mt-4 space-y-2 rounded-xl border border-[#E6DFC6] bg-white/60 p-3.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-[#8C7E72]">保存状态</dt>
                <dd>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusBadgeClasses(
                      artifact.preservationStatus
                    )}`}
                  >
                    {statusLabel(artifact.preservationStatus)}
                  </span>
                </dd>
              </div>
              {hasGeo && artifact.locationName && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="flex items-center gap-1 text-[#8C7E72]">
                    <MapPin className="h-3.5 w-3.5" /> 出土地
                  </dt>
                  <dd className="text-right text-[#3E3228]">{artifact.locationName}</dd>
                </div>
              )}
              {hasGeo && (
                <div className="flex items-center justify-between">
                  <dt className="text-[#8C7E72]">经纬度</dt>
                  <dd className="tabular-nums text-[#3E3228]">
                    {artifact.latitude!.toFixed(5)}, {artifact.longitude!.toFixed(5)}
                  </dd>
                </div>
              )}
            </dl>

            {/* 地图图钉 */}
            {hasGeo && (
              <div className="mt-3 overflow-hidden rounded-lg border border-[#D6CBBA]">
                <DetailMap
                  latitude={artifact.latitude!}
                  longitude={artifact.longitude!}
                  locationName={artifact.locationName}
                />
              </div>
            )}

            {/* 描述 */}
            <p className="mt-4 text-sm leading-relaxed text-[#3E3228]">
              {artifact.description}
            </p>

            {/* 点赞 / 收藏 */}
            {!hideInteractions && (
              <div className="mt-4 flex items-center gap-3 border-t border-[#E6DFC6] pt-4">
                <button
                  type="button"
                  onClick={onToggleLike}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    liked
                      ? "bg-[#FBEAEA] text-[#C0392B]"
                      : "bg-[#EFE6D5] text-[#6E5D4F] hover:bg-[#E2D6C1]"
                  }`}
                  aria-pressed={liked}
                >
                  <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                  {liked ? "已赞" : "点赞"} · {likeCount}
                </button>
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={onToggleFavorite}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      favorited
                        ? "bg-[#E7F0E4] text-[#3B5B28]"
                        : "bg-[#EFE6D5] text-[#6E5D4F] hover:bg-[#E2D6C1]"
                    }`}
                    aria-pressed={favorited}
                  >
                    <Bookmark
                      className={`h-4 w-4 ${favorited ? "fill-current" : ""}`}
                    />
                    {favorited ? "已收藏" : "收藏"}
                  </button>
                )}
                {hasGeo && artifact.latitude != null && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${artifact.latitude}&mlon=${artifact.longitude}#map=13/${artifact.latitude}/${artifact.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#8C6D46] hover:underline"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    在地图中打开
                  </a>
                )}
              </div>
            )}

            {/* 评论区 */}
            {!hideInteractions && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-[#2C221E]">
                  评论 {comments.length > 0 && `(${comments.length})`}
                </h3>

                {/* 输入 */}
                <div className="mt-2 flex items-end gap-2">
                  <textarea
                    rows={2}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitComment();
                    }}
                    placeholder="留下你的见解…（⌘/Ctrl + Enter 发送）"
                    className="min-h-[44px] flex-1 resize-none rounded-lg border border-[#D6CBBA] bg-white px-3 py-2 text-sm text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50"
                  />
                  <button
                    type="button"
                    onClick={submitComment}
                    disabled={!draft.trim()}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#8C6D46] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#735836] disabled:cursor-not-allowed disabled:bg-[#C2B7A7]"
                  >
                    <Send className="h-3.5 w-3.5" />
                    发表
                  </button>
                </div>

                {/* 列表 */}
                <ul className="mt-3 space-y-3">
                  {comments.length === 0 && (
                    <li className="rounded-lg bg-white/50 px-3 py-4 text-center text-xs text-[#9C8E80]">
                      还没有评论，来做第一个留言的人吧。
                    </li>
                  )}
                  {comments.map((c) => (
                    <li key={c.id} className="rounded-lg bg-white/70 px-3.5 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E5D4F]">{c.author}</span>
                        <span className="inline-flex items-center gap-2 text-[11px] text-[#A39587]">
                          <span>
                            {new Date(c.createdAt).toLocaleString("zh-CN", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {onDeleteComment && (
                            <button
                              type="button"
                              onClick={() => onDeleteComment(c.id)}
                              className="text-[#9C8E80] transition-colors hover:text-[#9B2C2C]"
                              aria-label="删除评论"
                            >
                              删除
                            </button>
                          )}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#3E3228]">{c.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
