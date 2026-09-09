"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User as UserIcon, Loader2, Users, UserPlus, UserCheck } from "lucide-react";
import type { PublicUser } from "@/lib/store/social";
import type { Artifact } from "@/lib/types/artifact";
import { useInteractions } from "@/lib/mock/interactions";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/components/ui/toaster";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import ArtifactCard from "@/components/artifacts/artifact-card";

interface FollowInfo {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

const MAX_ITEMS = 50;

export default function PublicProfileView({ userId }: { userId: string }) {
  const { user: me } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();
  const interactions = useInteractions();

  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [follow, setFollow] = useState<FollowInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [artsLoading, setArtsLoading] = useState(true);

  const loadProfile = () => {
    setLoading(true);
    fetch(`/api/users/${userId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setProfile(data.user);
          setFollow(data.follow);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    let active = true;
    setArtsLoading(true);
    fetch(`/api/artifacts?owner=${userId}&limit=${MAX_ITEMS}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.artifacts) {
          setArtifacts(data.artifacts);
          interactions.seed(data.artifacts);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setArtsLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const isSelf = !!me && me.id === userId;

  const onToggleFollow = async () => {
    if (!me) {
      toast({ variant: "info", title: t("social.loginToFollow") });
      router.push("/login");
      return;
    }
    if (isSelf) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/users/${userId}/follow`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || t("social.followFailed"));
      setFollow({
        isFollowing: data.following,
        followersCount: data.followersCount,
        followingCount: data.followingCount,
      });
    } catch (e) {
      toast({
        variant: "error",
        title: t("social.followFailed"),
        description: e instanceof Error ? e.message : t("common.retry"),
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-[var(--muted-2)]">
        <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-[var(--bronze)]" />
        {t("common.loading")}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-[var(--muted-2)]">
        {t("social.userNotFound")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 个人信息卡片 */}
      <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--border)] bg-[var(--chip-2)]">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserIcon className="h-10 w-10 text-[var(--bronze)]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 truncate font-serif text-2xl font-bold text-[var(--ink)]">
              {profile.displayName}
              {profile.isCurator && (
                <span className="rounded-full bg-[var(--chip-2)] px-2 py-0.5 text-[calc(11px*var(--font-scale))] font-medium text-[var(--bronze)]">
                  {t("social.curator")}
                </span>
              )}
            </h1>
            {profile.bio && (
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--bronze-ink)]">
                {profile.bio}
              </p>
            )}
            <p className="mt-2 flex items-center gap-4 text-xs text-[var(--muted)]">
              <Link
                href={`/u/${userId}/connections?tab=followers`}
                className="transition hover:text-[var(--bronze)]"
              >
                <b className="text-[var(--ink)]">{follow?.followersCount ?? 0}</b>{" "}
                {t("social.followers")}
              </Link>
              <Link
                href={`/u/${userId}/connections?tab=following`}
                className="transition hover:text-[var(--bronze)]"
              >
                <b className="text-[var(--ink)]">{follow?.followingCount ?? 0}</b>{" "}
                {t("social.following")}
              </Link>
              <span>
                <b className="text-[var(--ink)]">{profile.artifactsCount}</b>{" "}
                {t("social.artifacts")}
              </span>
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            {isSelf ? (
              <span className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-2)]">
                {t("social.thisIsYou")}
              </span>
            ) : (
              <button
                type="button"
                onClick={onToggleFollow}
                disabled={busy}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                  follow?.isFollowing
                    ? "border border-[var(--border)] bg-white text-[var(--bronze-ink)] hover:bg-[var(--chip-2)]"
                    : "bg-[var(--bronze)] text-white hover:bg-[var(--bronze-deep)]"
                }`}
              >
                {follow?.isFollowing ? (
                  <>
                    <UserCheck className="h-4 w-4" /> {t("social.following")}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> {t("social.follow")}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 该用户的文物 */}
      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
          <Users className="h-4 w-4 text-[var(--bronze)]" />
          {t("social.uploadsOf", { name: profile.displayName })}
        </div>
        {artsLoading ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/50 py-16 text-center text-sm text-[var(--muted-2)]">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-[var(--bronze)]" />
            {t("common.loading")}
          </div>
        ) : artifacts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/50 py-16 text-center text-sm text-[var(--muted-2)]">
            {t("social.noUploads")}
          </div>
        ) : (
          <div className="stagger-fade columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
            {artifacts.map((a) => {
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
      </section>
    </div>
  );
}
