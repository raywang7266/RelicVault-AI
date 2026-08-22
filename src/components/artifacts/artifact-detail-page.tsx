"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  MapPin,
  Pencil,
  Trash2,
  ArrowLeft,
  Navigation,
  ExternalLink,
  Bookmark,
} from "lucide-react";
import type { Artifact } from "@/lib/types/artifact";
import type { CommentItem } from "@/lib/types/interactions";
import { statusBadgeClasses, statusLabel } from "@/lib/types/artifact";
import SmartImage from "./smart-image";
import ArtifactEditor from "@/components/profile/artifact-editor";
import { useToast } from "@/components/ui/toaster";
import { useInteractions } from "@/lib/mock/interactions";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { LOCALE_HTML_LANG } from "@/lib/i18n/locales";

const DetailMap = dynamic(() => import("./detail-map"), {
  ssr: false,
  loading: () => {
    const { t } = useTranslation();
    return (
      <div className="flex h-[260px] items-center justify-center rounded-lg bg-[#F5F0E6] text-xs text-[#9C8E80]">
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
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const interactions = useInteractions();

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

  const handleSave = async (patch: Partial<Artifact>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/artifacts/${encodeURIComponent(artifact.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || t("detail.saveFailed"));
      }
      toast({ variant: "success", title: t("detail.saveSuccess"), description: t("detail.saveSuccessDesc") });
      setEditorOpen(false);
      router.refresh();
    } catch (e) {
      toast({
        variant: "error",
        title: t("detail.saveFailed"),
        description: e instanceof Error ? e.message : t("common.retry"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("profile.deleteConfirm", { title: artifact.title })))
      return;
    setSaving(true);
    try {
      const res = await fetch(`/api/artifacts/${encodeURIComponent(artifact.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || t("detail.deleteFailed"));
      }
      toast({ variant: "success", title: t("detail.deleteTitle"), description: t("detail.deleteDesc") });
      router.push(isOwner ? "/profile" : "/explore");
    } catch (e) {
      toast({
        variant: "error",
        title: t("detail.deleteFailed"),
        description: e instanceof Error ? e.message : t("common.retry"),
      });
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1 text-sm text-[#8C7E72] hover:text-[#5C4831]"
      >
        <ArrowLeft className="h-4 w-4" /> {t("detail.back")}
      </Link>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        {/* 大图 */}
        <div className="overflow-hidden rounded-2xl border border-[#E6DFC6] bg-[#2C221E]">
          <SmartImage
            src={artifact.imageUrl}
            alt={artifact.title}
            fallbackLabel={artifact.title.slice(0, 1)}
            className="h-full max-h-[70vh] w-full object-contain"
          />
        </div>

        {/* 信息 */}
        <div className="flex flex-col">
          <h1 className="font-serif text-2xl font-bold text-[#2C221E]">
            {artifact.title}
          </h1>
          <p className="mt-1 text-sm text-[#7A6B5D]">
            {artifact.era} · {artifact.category}
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
                  className="rounded-full bg-[#F2ECE1] px-2 py-0.5 text-[11px] text-[#6E5D4F] transition-colors hover:bg-[#E2D6C1] hover:text-[#8C6D46]"
                >
                  #{t}
                </button>
              ))}
            </div>
          )}

          <dl className="mt-4 space-y-2 rounded-xl border border-[#E6DFC6] bg-white/60 p-3.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[#8C7E72]">{t("detail.preservation")}</dt>
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
                  <MapPin className="h-3.5 w-3.5" /> {t("detail.location")}
                </dt>
                <dd className="text-right text-[#3E3228]">{artifact.locationName}</dd>
              </div>
            )}
            {hasGeo && (
              <div className="flex items-center justify-between">
                <dt className="text-[#8C7E72]">{t("detail.coords")}</dt>
                <dd className="tabular-nums text-[#3E3228]">
                  {artifact.latitude!.toFixed(5)}, {artifact.longitude!.toFixed(5)}
                </dd>
              </div>
            )}
            {owner && (owner.username || owner.displayName) && (
              <div className="flex items-center justify-between">
                <dt className="text-[#8C7E72]">{t("detail.contributor")}</dt>
                <dd>
                  <span className="inline-flex items-center gap-1 font-medium text-[#8C6D46]">
                    {owner.displayName || owner.username}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </dd>
              </div>
            )}
          </dl>

          {hasGeo && (
            <div className="mt-3 overflow-hidden rounded-lg border border-[#D6CBBA]">
              <DetailMap
                latitude={artifact.latitude!}
                longitude={artifact.longitude!}
                locationName={artifact.locationName}
              />
            </div>
          )}

          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#3E3228]">
            {artifact.description}
          </p>

          {/* 操作区 */}
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#E6DFC6] pt-4">
            <button
              type="button"
              onClick={() => interactions.toggleLike(artifact.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                liked
                  ? "bg-[#FBEAEA] text-[#C0392B]"
                  : "bg-[#EFE6D5] text-[#6E5D4F] hover:bg-[#E2D6C1]"
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
                  : "bg-[#EFE6D5] text-[#6E5D4F] hover:bg-[#E2D6C1]"
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
                className="inline-flex items-center gap-1 text-xs text-[#8C6D46] hover:underline"
              >
                <Navigation className="h-3.5 w-3.5" /> {t("detail.openInMap")}
              </a>
            )}

            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => setEditorOpen(true)}
                  disabled={saving}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[#D6CBBA] px-4 py-2 text-sm font-medium text-[#5C4831] hover:bg-[#EFE6D5] disabled:opacity-60"
                >
                  <Pencil className="h-4 w-4" /> {t("detail.edit")}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#EFC9C9] px-4 py-2 text-sm font-medium text-[#9B2C2C] hover:bg-[#FBEAEA] disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" /> {t("detail.delete")}
                </button>
              </>
            )}
          </div>

          {/* 评论区（真实落库） */}
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-[#2C221E]">
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
              onDelete={(commentId) =>
                interactions.deleteComment(artifact.id, commentId)
              }
            />
            <ul className="mt-3 space-y-3">
              {comments.length === 0 && (
                <li className="rounded-lg bg-white/50 px-3 py-4 text-center text-xs text-[#9C8E80]">
                  {t("detail.noComments")}
                </li>
              )}
              {comments.map((c) => (
                <li key={c.id} className="rounded-lg bg-white/70 px-3.5 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#6E5D4F]">{c.author}</span>
                    <span className="inline-flex items-center gap-2 text-[11px] text-[#A39587]">
                      <span>
                        {new Date(c.createdAt).toLocaleString(
                          LOCALE_HTML_LANG[locale],
                          {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          interactions.deleteComment(artifact.id, c.id)
                        }
                        className="text-[#9C8E80] transition-colors hover:text-[#9B2C2C]"
                        aria-label={t("detail.deleteComment")}
                      >
                        {t("detail.deleteComment")}
                      </button>
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#3E3228]">{c.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <ArtifactEditor
        open={editorOpen}
        artifact={artifact}
        saving={saving}
        onSave={handleSave}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}

function CommentBox({
  onSubmit,
  onDelete,
}: {
  onSubmit: (text: string) => Promise<void> | void;
  onDelete: (commentId: string) => void;
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
        className="min-h-[44px] flex-1 resize-none rounded-lg border border-[#D6CBBA] bg-white px-3 py-2 text-sm text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!draft.trim()}
        className="inline-flex items-center gap-1 rounded-lg bg-[#8C6D46] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#735836] disabled:cursor-not-allowed disabled:bg-[#C2B7A7]"
      >
        {t("detail.publish")}
      </button>
    </div>
  );
}
