"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Plus,
  MapPin,
  Heart,
  Layers,
  Trophy,
  CalendarDays,
  Loader2,
  User as UserIcon,
  Bookmark,
  Trash2,
  MessageCircle,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth/types";
import { useProfile } from "@/lib/mock/profile";
import { useUserUploads } from "@/lib/mock/user-uploads";
import { useInteractions } from "@/lib/mock/interactions";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { translateOption } from "@/lib/i18n/locales";
import type { Artifact } from "@/lib/types/artifact";
import { statusBadgeClasses, statusLabel } from "@/lib/types/artifact";
import ArtifactCard from "@/components/artifacts/artifact-card";
import SmartImage from "@/components/artifacts/smart-image";
import { useToast } from "@/components/ui/toaster";
import ProfileEditModal from "./profile-edit-modal";
import ArtifactEditor from "./artifact-editor";

export default function ProfileView({ user }: { user: SessionUser }) {
  const { profile, loaded: profileLoaded, saving: profileSaving, update } =
    useProfile(user.id, user.email);
  const {
    uploads,
    loaded: uploadsLoaded,
    refreshing,
    savingIds,
    error: uploadsError,
    refetch,
    updateUploadRemote,
    deleteUploadRemote,
  } = useUserUploads(user.id);
  const interactions = useInteractions();
  const { toast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Artifact | null>(null);
  const [tab, setTab] = useState<"uploads" | "favorites">("uploads");
  const [favArtifacts, setFavArtifacts] = useState<Artifact[]>([]);
  const [favLoading, setFavLoading] = useState(false);

  // 切换到「我的收藏」时拉取收藏的文物完整数据
  useEffect(() => {
    if (tab !== "favorites") return;
    let active = true;
    setFavLoading(true);
    fetch("/api/favorites", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.artifacts) setFavArtifacts(data.artifacts as Artifact[]);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setFavLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tab]);

  // 个人中心组件挂载/路由变化（如提交后 router.push+refresh）时主动拉取最新
  // 远端数据（`/api/artifacts?owner=<id>`，带 cache:no-store）。即便 hook 内部
  // 已有 effect，这里再加一层兜底，保证任何情况下都能拿到服务器最新提交。
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // 「我的贡献」加载完成后，用服务端权威互动数据初始化覆盖层
  // 注意：依赖只放 [uploads]，不放 interactions（seed 是 useCallback([]) 稳定函数，
  // 把会随 states 变化的 interactions 放进依赖会在 seed 后触发 effect 重跑形成循环）。
  useEffect(() => {
    if (uploads.length) interactions.seed(uploads);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploads]);

  // 「我的收藏」切换时，用收藏列表初始化互动覆盖层（含 favoritedByMe 等）
  useEffect(() => {
    if (tab === "favorites" && favArtifacts.length) {
      interactions.seed(favArtifacts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, favArtifacts]);

  // 删除文物：二次确认 → DELETE /api/artifacts/[id] → 成功后从本地 state 移除
  const handleDelete = async (a: Artifact) => {
    if (!window.confirm(t("profile.deleteConfirm", { title: a.title }))) return;
    const ok = await deleteUploadRemote(a.id);
    if (ok) {
      toast({ variant: "success", title: t("profile.deleted"), description: t("profile.deleteSuccessDesc") });
    } else {
      toast({ variant: "error", title: t("profile.deleteFailed"), description: t("common.retry") });
    }
  };

  // 远端拉取错误 → Toast 提示（避免阻塞 UI，仅作提示）
  useEffect(() => {
    if (uploadsError) {
      toast({
        variant: "error",
        title: t("profile.fetchFailed"),
        description: uploadsError,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadsError]);

  const stats = useMemo(() => {
    const totalLikes = uploads.reduce((s, a) => s + (a.likes ?? 0), 0);
    let joinedDays: number | null = null;
    if (user.createdAt) {
      const diff = Date.now() - new Date(user.createdAt).getTime();
      joinedDays = Math.max(1, Math.floor(diff / 86_400_000));
    }
    return { count: uploads.length, totalLikes, joinedDays };
  }, [uploads, user.createdAt]);

  const joinedText = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("zh-CN")
    : "—";

  const nickname = profile?.nickname ?? user.email ?? "用户";

  const openEditor = (a: Artifact) => {
    setEditing(a);
    setEditorOpen(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 个人信息卡片 */}
      <section className="rounded-2xl border border-[#E6DFC6] bg-[#FAF7F2] p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {/* 头像 */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#D6CBBA] bg-[#EFE6D5]">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={nickname}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserIcon className="h-10 w-10 text-[#8C6D46]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-serif text-2xl font-bold text-[#2C221E]">
              {nickname}
            </h1>
            <p className="mt-0.5 truncate text-sm text-[#7A6B5D]">{user.email}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-[#9C8E80]">
              <CalendarDays className="h-3.5 w-3.5" /> {t("profile.joinedOn", { date: joinedText })}
            </p>
            {profile?.bio && (
              <p className="mt-2 text-sm leading-relaxed text-[#5C4831]">
                {profile.bio}
              </p>
            )}
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              disabled={profileSaving}
              className="rounded-lg border border-[#D6CBBA] px-4 py-2 text-sm font-medium text-[#5C4831] hover:bg-[#EFE6D5] disabled:opacity-60"
            >
              <Pencil className="mr-1 inline h-4 w-4" /> {t("profile.editProfile")}
            </button>
          </div>
        </div>
      </section>

      {/* 统计看板 */}
      <section className="mt-5 grid grid-cols-3 gap-4">
        <StatTile
          icon={<Layers className="h-5 w-5" />}
          label={t("profile.statUploads")}
          value={stats.count}
        />
        <StatTile
          icon={<Heart className="h-5 w-5" />}
          label={t("profile.statLikes")}
          value={stats.totalLikes}
        />
        <StatTile
          icon={<CalendarDays className="h-5 w-5" />}
          label={t("profile.statDays")}
          value={stats.joinedDays ?? "—"}
        />
      </section>

      {/* 我的贡献 / 我的收藏（Tab） */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex rounded-lg border border-[#D6CBBA] bg-[#FAF7F2] p-0.5">
            <button
              type="button"
              onClick={() => setTab("uploads")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === "uploads"
                  ? "bg-[#8C6D46] text-white"
                  : "text-[#7A6B5D] hover:bg-[#EFE6D5]"
              }`}
              aria-pressed={tab === "uploads"}
            >
              <Layers className="h-3.5 w-3.5" /> {t("profile.tabUploads")}
            </button>
            <button
              type="button"
              onClick={() => setTab("favorites")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === "favorites"
                  ? "bg-[#8C6D46] text-white"
                  : "text-[#7A6B5D] hover:bg-[#EFE6D5]"
              }`}
              aria-pressed={tab === "favorites"}
            >
              <Bookmark className="h-3.5 w-3.5" /> {t("profile.tabFavorites")}
            </button>
          </div>
          {tab === "uploads" && (
            <Link
              href="/artifacts/new"
              className="inline-flex items-center gap-1 rounded-lg bg-[#8C6D46] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#78592F]"
            >
              <Plus className="h-4 w-4" /> {t("profile.uploadNew")}
            </Link>
          )}
        </div>

        {tab === "uploads" ? (
          !uploadsLoaded ? (
            <div className="rounded-2xl border border-dashed border-[#D6CBBA] bg-white/50 py-16 text-center text-sm text-[#9C8E80]">
              {t("common.loading")}
            </div>
          ) : uploads.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {uploads.map((a) => {
                const it = interactions.get(a);
                return (
                  <UploadCard
                    key={a.id}
                    artifact={a}
                    saving={savingIds.has(a.id)}
                    liked={it.likedByMe}
                    likeCount={it.likes}
                    commentCount={it.comments.length}
                    favorited={it.favoritedByMe}
                    onView={() => router.push(`/artifacts/${a.id}`)}
                    onEdit={() => openEditor(a)}
                    onToggleLike={() => interactions.toggleLike(a.id)}
                    onToggleFavorite={() => interactions.toggleFavorite(a.id)}
                    onDelete={() => handleDelete(a)}
                  />
                );
              })}
            </div>
          )
        ) :           favLoading ? (
          <div className="rounded-2xl border border-dashed border-[#D6CBBA] bg-white/50 py-16 text-center text-sm text-[#9C8E80]">
            {t("common.loading")}
          </div>
        ) : favArtifacts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D6CBBA] bg-white/50 py-16 text-center">
            <p className="text-sm text-[#9C8E80]">
              {t("profile.emptyFavorites")}
            </p>
            <Link
              href="/explore"
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#8C6D46] px-4 py-2 text-sm font-semibold text-white hover:bg-[#78592F]"
            >
              {t("profile.exploreCta")}
            </Link>
          </div>
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
            {favArtifacts.map((a) => {
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
                  onToggleFavorite={async () => {
                    // 状态取自 interactions.favoritedByMe，避免「未变化」误删
                    const wasFav = it.favoritedByMe;
                    await interactions.toggleFavorite(a.id);
                    if (wasFav) {
                      // 在「我的收藏」中取消收藏：把该卡片从当前 tab 移除，
                      // 以保持 fav tab 的展示与数据源一致
                      setFavArtifacts((prev) =>
                        prev.filter((x) => x.id !== a.id)
                      );
                      toast({
                        variant: "info",
                        title: t("profile.unfavorited"),
                        description: t("profile.unfavoritedDesc", { title: a.title }),
                      });
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* 弹窗：编辑资料 */}
      {profileLoaded && (
        <ProfileEditModal
          open={editOpen}
          initial={
            profile ?? { nickname, bio: "", avatarUrl: undefined }
          }
          onSave={async (p) => {
            try {
              await update(p);
              toast({
                variant: "success",
                title: t("profile.profileSaved"),
                description: t("profile.profileSavedDesc"),
              });
            } catch (e) {
              toast({
                variant: "error",
                title: t("profile.saveFailed"),
                description:
                  e instanceof Error ? e.message : t("common.retry"),
              });
            } finally {
              setEditOpen(false);
            }
          }}
          onClose={() => setEditOpen(false)}
        />
      )}

      {/* 弹窗：编辑文物 */}
      <ArtifactEditor
        open={editorOpen}
        artifact={editing}
        saving={editing ? savingIds.has(editing.id) : false}
        onSave={async (patch) => {
          if (!editing) return;
          // 先 PATCH 远端；useUserUploads 内部失败时会回退到本地修改
          const updated = await updateUploadRemote(editing.id, patch);
          if (updated) {
            toast({
              variant: "success",
              title: t("profile.artifactSaved"),
              description: t("profile.artifactSavedDesc", { title: updated.title }),
            });
          } else {
            toast({
              variant: "info",
              title: t("profile.savedLocally"),
              description: t("profile.savedLocallyDesc"),
            });
          }
          // 强制服务端组件刷新，让其它依赖远端的视图（/explore 等）也能拉到新数据
          try {
            window.dispatchEvent(new Event("relicvault:uploads-changed"));
          } catch {
            /* SSR */
          }
          setEditorOpen(false);
          setEditing(null);
        }}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
      />

    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E6DFC6] bg-white p-4 text-center">
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#F2ECE1] text-[#8C6D46]">
        {icon}
      </div>
      <div className="font-serif text-2xl font-bold text-[#2C221E] tabular-nums">
        {value}
      </div>
      <div className="mt-0.5 text-xs text-[#7A6B5D]">{label}</div>
    </div>
  );
}

function UploadCard({
  artifact,
  saving,
  liked,
  likeCount,
  commentCount,
  favorited,
  onView,
  onEdit,
  onToggleLike,
  onToggleFavorite,
  onDelete,
}: {
  artifact: Artifact;
  saving?: boolean;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  favorited: boolean;
  onView: () => void;
  onEdit: () => void;
  onToggleLike: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  const { t, locale } = useTranslation();
  const hasGeo =
    typeof artifact.latitude === "number" &&
    typeof artifact.longitude === "number";

  return (
    <div className="overflow-hidden rounded-xl border border-[#E6DFC6] bg-white shadow-sm transition-all hover:shadow-md">
      <button
        type="button"
        onClick={onView}
        className="relative block w-full overflow-hidden bg-[#EFE6D5]"
        style={{ aspectRatio: "3 / 4" }}
        aria-label={t("profile.viewAria", { title: artifact.title })}
      >
        <SmartImage
          src={artifact.imageUrl}
          alt={artifact.title}
          fallbackLabel={artifact.title.slice(0, 1)}
          className="h-full w-full object-cover"
        />
          {hasGeo && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">
            <MapPin className="h-3 w-3" /> {t("profile.located")}
          </span>
        )}
      </button>

      <div className="space-y-2 p-3.5">
        <button type="button" onClick={onView} className="block w-full text-left">
          <h3 className="font-serif text-[15px] font-bold leading-snug text-[#2C221E] line-clamp-2">
            {artifact.title}
          </h3>
          <p className="mt-1 text-xs text-[#7A6B5D]">
            {artifact.era} · {translateOption(locale, artifact.category)}
          </p>
        </button>

        {artifact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {artifact.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-[#F2ECE1] px-2 py-0.5 text-[11px] text-[#6E5D4F]"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

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
              onClick={onToggleLike}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium transition-colors ${
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
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium transition-colors ${
                favorited
                  ? "bg-[#E7F0E4] text-[#3B5B28]"
                  : "bg-[#F5F0E6] text-[#8C7E72] hover:bg-[#EFE6D5]"
              }`}
              aria-pressed={favorited}
              aria-label={favorited ? t("profile.unfavorite") : t("profile.favorite")}
            >
              <Bookmark className={`h-3.5 w-3.5 ${favorited ? "fill-current" : ""}`} />
            </button>
            <span className="inline-flex items-center gap-1 text-[12px] text-[#8C7E72]">
              <MessageCircle className="h-3.5 w-3.5" />
              {commentCount}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onEdit}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-[#D6CBBA] px-3 py-1.5 text-xs font-medium text-[#5C4831] transition hover:bg-[#EFE6D5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("common.saving")}
              </>
            ) : (
              <>
                <Pencil className="h-3.5 w-3.5" /> {t("profile.edit")}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-[#EFC9C9] px-3 py-1.5 text-xs font-medium text-[#9B2C2C] transition hover:bg-[#FBEAEA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" /> {t("profile.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-dashed border-[#D6CBBA] bg-white/50 py-16 text-center">
      <p className="text-sm text-[#9C8E80]">{t("profile.emptyUploads")}</p>
      <Link
        href="/artifacts/new"
        className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#8C6D46] px-4 py-2 text-sm font-semibold text-white hover:bg-[#78592F]"
      >
        <Plus className="h-4 w-4" /> {t("profile.emptyUploadsCta")}
      </Link>
    </div>
  );
}
