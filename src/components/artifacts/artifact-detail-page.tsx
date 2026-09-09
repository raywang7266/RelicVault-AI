"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  MapPin,
  ArrowLeft,
  Navigation,
  ExternalLink,
  Bookmark,
  MessageCircle,
} from "lucide-react";
import type { Artifact } from "@/lib/types/artifact";
import type { CommentItem } from "@/lib/types/interactions";
import { statusBadgeClasses, statusLabel } from "@/lib/types/artifact";
import { materialTheme } from "@/lib/types/material-theme";
import SmartImage from "./smart-image";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useToast } from "@/components/ui/toaster";
import { useInteractions } from "@/lib/mock/interactions";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { LOCALE_HTML_LANG, translateOption } from "@/lib/i18n/locales";

const DetailMap = dynamic(() => import("./detail-map"), {
  ssr: false,
  loading: () => {
    const { t } = useTranslation();
    return (
      <div className="flex h-[260px] items-center justify-center rounded-lg bg-[var(--surface)] text-xs text-[var(--muted-2)]">
        {t("detail.mapLoading")}
      </div>
    );
  },
});

interface OwnerInfo {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface Props {
  artifact: Artifact;
  isOwner: boolean;
  owner: OwnerInfo | null;
}

export default function ArtifactDetailPage({ artifact, isOwner, owner }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useTranslation();
  const interactions = useInteractions();
  const theme = materialTheme(artifact.category);

  const hasGeo =
    typeof artifact.latitude === "number" &&
    typeof artifact.longitude === "number";

  // 当前文物的互动状态（优先本地覆盖层，初始来自服务端 likedByMe / favoritedByMe）
  // 依赖只放 [artifact]：seed 是 useCallback([]) 稳定函数，把会随 states 变化的
  // interactions 放进依赖会在 seed 后触发 effect 重跑形成无限循环。
  useEffect(() => {
    interactions.seed([artifact]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifact]);

  const state = interactions.get(artifact);
  const liked = state.likedByMe;
  const favorited = state.favoritedByMe;
  const likeCount = state.likes;
  const favoritesCount = state.favorites;
  const comments: CommentItem[] = useMemo(
    () => state.comments,
    [state.comments]
  );

  // 评论回复：当前正在回复的评论 id（一层嵌套）
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  // 多图画廊：当前查看的图片下标
  const [activeImage, setActiveImage] = useState(0);
  // 归一化：老数据没有 images 字段时回退为单图，保证画廊始终有内容
  const gallery =
    artifact.images && artifact.images.length > 0
      ? artifact.images
      : [artifact.imageUrl];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-3)] hover:text-[var(--bronze-ink)]"
      >
        <ArrowLeft className="h-4 w-4" /> {t("detail.back")}
      </Link>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        {/* 大图 + 多图缩略画廊（仅一张时不显示缩略图行） */}
        <div className="space-y-2">
          <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--ink)]">
            <SmartImage
              src={gallery[activeImage] ?? artifact.imageUrl}
              alt={artifact.title}
              fallbackLabel={artifact.title.slice(0, 1)}
              className="h-full max-h-[70vh] w-full object-contain"
            />
          </div>

          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {gallery.map((src, i) => (
                <button
                  key={`${i}-${src.slice(0, 32)}`}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    i === activeImage
                      ? "border-[var(--bronze)]"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <SmartImage
                    src={src}
                    alt={`${artifact.title} 图 ${i + 1}`}
                    fallbackLabel={artifact.title.slice(0, 1)}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 信息 */}
        <div className="flex flex-col">
          <h1 className="font-serif text-2xl font-bold text-[var(--ink)]">
            {artifact.title}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: theme.bar }} />
              <span
                className="text-[calc(13px*var(--font-scale))] font-semibold uppercase tracking-[0.1em]"
                style={{ color: theme.accent }}
              >
                {translateOption(locale, artifact.category)}
              </span>
            </span>
            <span className="text-[var(--dot)]">·</span>
            <span>{artifact.era}</span>
          </p>

          {artifact.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {artifact.tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    router.push(`/explore?tag=${encodeURIComponent(t)}`)
                  }
                  className="rounded-full bg-[var(--chip)] px-2 py-0.5 text-[calc(11px*var(--font-scale))] text-[var(--chip-ink)] transition-colors hover:bg-[#E2D6C1] hover:text-[var(--bronze)]"
                >
                  #{t}
                </button>
              ))}
            </div>
          )}

          <dl className="mt-4 space-y-2 rounded-xl border border-[var(--border-soft)] bg-white/60 p-3.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[var(--muted-3)]">{t("detail.preservation")}</dt>
              <dd>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[calc(11px*var(--font-scale))] font-medium ${statusBadgeClasses(
                    artifact.preservationStatus
                  )}`}
                >
                  {translateOption(locale, statusLabel(artifact.preservationStatus))}
                </span>
              </dd>
            </div>
            {hasGeo && artifact.locationName && (
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1 text-[var(--muted-3)]">
                  <MapPin className="h-3.5 w-3.5" /> {t("detail.location")}
                </dt>
                <dd className="text-right text-[var(--brown)]">{artifact.locationName}</dd>
              </div>
            )}
            {hasGeo && (
              <div className="flex items-center justify-between">
                <dt className="text-[var(--muted-3)]">{t("detail.coords")}</dt>
                <dd className="tabular-nums text-[var(--brown)]">
                  {artifact.latitude!.toFixed(5)}, {artifact.longitude!.toFixed(5)}
                </dd>
              </div>
            )}
            {owner && (owner.username || owner.displayName) && (
              <div className="flex items-center justify-between">
                <dt className="text-[var(--muted-3)]">{t("detail.contributor")}</dt>
                <dd>
                  <Link
                    href={`/u/${artifact.ownerId}`}
                    className="inline-flex items-center gap-1.5 font-medium text-[var(--bronze)] transition-colors hover:text-[var(--bronze-deep)] hover:underline"
                  >
                    <UserAvatar
                      src={owner.avatarUrl}
                      name={owner.displayName || owner.username}
                      size={22}
                    />
                    {owner.displayName || owner.username}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </dd>
              </div>
            )}
          </dl>

          {hasGeo && (
            <div className="mt-3 overflow-hidden rounded-lg border border-[var(--border)]">
              <DetailMap
                latitude={artifact.latitude!}
                longitude={artifact.longitude!}
                locationName={artifact.locationName}
              />
            </div>
          )}

          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--brown)]">
            {artifact.description}
          </p>

          {/* 操作区 */}
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--border-soft)] pt-4">
            <button
              type="button"
              onClick={() => interactions.toggleLike(artifact.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                liked
                  ? "bg-[#FBEAEA] text-[#C0392B]"
                  : "bg-[var(--chip-2)] text-[var(--chip-ink)] hover:bg-[#E2D6C1]"
              }`}
              aria-pressed={liked}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {liked ? t("detail.liked") : t("detail.like")} · {likeCount}
            </button>

            <button
              type="button"
              onClick={() => interactions.toggleFavorite(artifact.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                favorited
                  ? "bg-[#E7F0E4] text-[#3B5B28]"
                  : "bg-[var(--chip-2)] text-[var(--chip-ink)] hover:bg-[#E2D6C1]"
              }`}
              aria-pressed={favorited}
            >
              <Bookmark
                className={`h-4 w-4 ${favorited ? "fill-current" : ""}`}
              />
              {favorited ? t("detail.favorited") : t("detail.favorite")} · {favoritesCount}
            </button>

            {hasGeo && artifact.latitude != null && (
              <a
                href={`https://www.openstreetmap.org/?mlat=${artifact.latitude}&mlon=${artifact.longitude}#map=13/${artifact.latitude}/${artifact.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--bronze)] hover:underline"
              >
                <Navigation className="h-3.5 w-3.5" /> {t("detail.openInMap")}
              </a>
            )}
          </div>

          {/* 评论区（真实落库，支持点赞 / 回复） */}
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              {t("detail.comments")} {comments.length > 0 && `(${comments.length})`}
            </h3>
            <CommentBox
              onSubmit={async (text) => {
                const ok = await interactions.addComment(artifact.id, text);
                if (!ok) {
                  toast({
                    variant: "error",
                    title: t("detail.commentFailed"),
                    description: t("common.retry"),
                  });
                }
              }}
            />

            <ul className="mt-3 space-y-3">
              {comments.length === 0 && (
                <li className="rounded-lg bg-white/50 px-3 py-4 text-center text-xs text-[var(--muted-2)]">
                  {t("detail.noComments")}
                </li>
              )}
              {comments
                .filter((c) => !c.parentId)
                .map((c) => {
                  const replies = comments.filter(
                    (r) => r.parentId === c.id
                  );
                  return (
                    <CommentNode
                      key={c.id}
                      comment={c}
                      replies={replies}
                      locale={locale}
                      onLike={(cid) =>
                        interactions.toggleCommentLike(artifact.id, cid)
                      }
                      onReply={() => {
                        setReplyTo(c.id);
                        setReplyDraft("");
                      }}
                      onDelete={() =>
                        interactions.deleteComment(artifact.id, c.id)
                      }
                      replyOpen={replyTo === c.id}
                      replyDraft={replyDraft}
                      setReplyDraft={setReplyDraft}
                      onSubmitReply={async (text) => {
                        const ok = await interactions.addComment(
                          artifact.id,
                          text,
                          c.id
                        );
                        if (ok) {
                          setReplyTo(null);
                          setReplyDraft("");
                        } else {
                          toast({
                            variant: "error",
                            title: t("detail.commentFailed"),
                            description: t("common.retry"),
                          });
                        }
                      }}
                      onDeleteReply={(rid) =>
                        interactions.deleteComment(artifact.id, rid)
                      }
                      t={t}
                    />
                  );
                })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentBox({
  onSubmit,
}: {
  onSubmit: (text: string) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    Promise.resolve(onSubmit(text)).then(() => setDraft(""));
  };

  return (
    <div className="mt-2 flex items-end gap-2">
      <textarea
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
        placeholder={t("detail.commentPlaceholder")}
        className="min-h-[44px] flex-1 resize-none rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)]"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!draft.trim()}
        className="inline-flex items-center gap-1 rounded-lg bg-[var(--bronze)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--bronze-deep)] disabled:cursor-not-allowed disabled:bg-[#C2B7A7]"
      >
        {t("detail.publish")}
      </button>
    </div>
  );
}

interface CommentNodeProps {
  comment: CommentItem;
  replies: CommentItem[];
  locale: "zh-CN" | "zh-TW" | "en";
  onLike: (commentId: string) => void;
  onReply: () => void;
  onDelete: () => void;
  replyOpen: boolean;
  replyDraft: string;
  setReplyDraft: (v: string) => void;
  onSubmitReply: (text: string) => Promise<void>;
  onDeleteReply: (rid: string) => void;
  t: (k: string, vars?: Record<string, string | number>) => string;
}

/** 单条评论（含点赞 / 回复 + 一层回复嵌套） */
function CommentNode({
  comment,
  replies,
  locale,
  onLike,
  onReply,
  onDelete,
  replyOpen,
  replyDraft,
  setReplyDraft,
  onSubmitReply,
  onDeleteReply,
  t,
}: CommentNodeProps) {
  const timeStr = (iso: string) =>
    new Date(iso).toLocaleString(LOCALE_HTML_LANG[locale], {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <li className="rounded-lg bg-white/70 px-3.5 py-2.5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5">
          <UserAvatar src={comment.authorAvatar} name={comment.author} size={22} />
          {comment.authorId ? (
            <Link
              href={`/u/${comment.authorId}`}
              className="text-xs font-medium text-[var(--chip-ink)] transition-colors hover:text-[var(--bronze)] hover:underline"
            >
              {comment.author}
            </Link>
          ) : (
            <span className="text-xs font-medium text-[var(--chip-ink)]">{comment.author}</span>
          )}
        </span>
        <span className="inline-flex items-center gap-2 text-[calc(11px*var(--font-scale))] text-[var(--muted-4)]">
          <span>{timeStr(comment.createdAt)}</span>
          <button
            type="button"
            onClick={onDelete}
            className="text-[var(--muted-2)] transition-colors hover:text-[#9B2C2C]"
            aria-label={t("detail.deleteComment")}
          >
            {t("detail.deleteComment")}
          </button>
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--brown)]">{comment.text}</p>

      {/* 点赞 / 回复操作 */}
      <div className="mt-1.5 flex items-center gap-3 text-[calc(11px*var(--font-scale))]">
        <button
          type="button"
          onClick={() => onLike(comment.id)}
          className={`inline-flex items-center gap-1 transition-colors ${
            comment.likedByMe
              ? "text-[#C0392B]"
              : "text-[var(--muted-2)] hover:text-[#C0392B]"
          }`}
          aria-pressed={comment.likedByMe}
        >
          <Heart className={`h-3.5 w-3.5 ${comment.likedByMe ? "fill-current" : ""}`} />
          {comment.likes > 0 && <span>{comment.likes}</span>}
        </button>
        <button
          type="button"
          onClick={onReply}
          className="inline-flex items-center gap-1 text-[var(--muted-2)] transition-colors hover:text-[var(--bronze)]"
        >
          <MessageCircle className="h-3.5 w-3.5" /> {t("detail.reply")}
        </button>
      </div>

      {/* 回复输入 */}
      {replyOpen && (
        <div className="mt-2 flex items-end gap-2">
          <input
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && replyDraft.trim()) {
                Promise.resolve(onSubmitReply(replyDraft.trim()));
              }
            }}
            placeholder={t("detail.replyPlaceholder", { name: comment.author })}
            className="flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)]"
          />
          <button
            type="button"
            onClick={() => onSubmitReply(replyDraft.trim())}
            disabled={!replyDraft.trim()}
            className="rounded-lg bg-[var(--bronze)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--bronze-deep)] disabled:cursor-not-allowed disabled:bg-[#C2B7A7]"
          >
            {t("detail.publish")}
          </button>
        </div>
      )}

      {/* 一层回复 */}
      {replies.length > 0 && (
        <ul className="mt-2 space-y-2 border-l-2 border-[#EDE6D7] pl-3">
          {replies.map((r) => (
            <li key={r.id}>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <UserAvatar src={r.authorAvatar} name={r.author} size={20} />
                  {r.authorId ? (
                    <Link
                      href={`/u/${r.authorId}`}
                      className="text-xs font-medium text-[var(--chip-ink)] transition-colors hover:text-[var(--bronze)] hover:underline"
                    >
                      {r.author}
                    </Link>
                  ) : (
                    <span className="text-xs font-medium text-[var(--chip-ink)]">{r.author}</span>
                  )}
                </span>
                <span className="inline-flex items-center gap-2 text-[calc(11px*var(--font-scale))] text-[var(--muted-4)]">
                  <span>{timeStr(r.createdAt)}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteReply(r.id)}
                    className="text-[var(--muted-2)] transition-colors hover:text-[#9B2C2C]"
                    aria-label={t("detail.deleteComment")}
                  >
                    {t("detail.deleteComment")}
                  </button>
                </span>
              </div>
              <p className="mt-0.5 text-sm text-[var(--brown)]">{r.text}</p>
              <button
                type="button"
                onClick={() => onLike(r.id)}
                className="mt-1 inline-flex items-center gap-1 text-[calc(11px*var(--font-scale))] text-[var(--muted-2)] transition-colors hover:text-[#C0392B]"
                aria-label={t("detail.likeComment")}
              >
                <Heart className="h-3 w-3" /> {r.likes > 0 ? r.likes : ""}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
