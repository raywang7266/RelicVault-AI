"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/components/ui/toaster";
import { useTranslation } from "@/lib/i18n/i18n-provider";

interface FollowButtonProps {
  targetId: string;
  initialFollowing?: boolean;
  size?: "sm" | "md";
  onChanged?: (following: boolean, followersCount?: number) => void;
}

/** 复用关注按钮：详情页贡献者行 / 头像处等。登录后才可操作。 */
export function FollowButton({
  targetId,
  initialFollowing = false,
  size = "sm",
  onChanged,
}: FollowButtonProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  const isSelf = !!user && user.id === targetId;
  if (isSelf) return null;

  const toggle = async () => {
    if (!user) {
      toast({ variant: "info", title: t("social.loginToFollow") });
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/users/${targetId}/follow`, {
        method: "POST",
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || t("social.followFailed"));
      setFollowing(data.following);
      onChanged?.(data.following, data.followersCount);
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

  const pad = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`inline-flex items-center gap-1 rounded-full font-medium transition-colors disabled:opacity-60 ${
        following
          ? `border border-[var(--border)] bg-white text-[var(--bronze-ink)] hover:bg-[var(--chip-2)] ${pad}`
          : `bg-[var(--bronze)] text-white hover:bg-[var(--bronze-deep)] ${pad}`
      }`}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : following ? (
        <UserCheck className="h-3.5 w-3.5" />
      ) : (
        <UserPlus className="h-3.5 w-3.5" />
      )}
      {following ? t("social.following") : t("social.follow")}
    </button>
  );
}
