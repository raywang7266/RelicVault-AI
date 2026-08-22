"use client";

import { useCallback, useEffect, useState } from "react";

export interface UserProfile {
  /** 展示昵称（对应 profiles.display_name） */
  nickname: string;
  /** 个人简介（对应 profiles.bio） */
  bio: string;
  /** 头像图片地址（对应 profiles.avatar_url） */
  avatarUrl?: string;
  /** 唯一用户名（对应 profiles.username），用于公开主页 /profile/[username] */
  username?: string;
}

function defaultProfile(fallbackEmail?: string | null): UserProfile {
  return {
    nickname: fallbackEmail?.split("@")[0] ?? "文物爱好者",
    bio: "",
    avatarUrl: undefined,
    username: undefined,
  };
}

/**
 * 当前用户的「个人资料」（昵称/简介/头像/用户名）。
 *
 * 数据通路（已切换为真实 Supabase）：
 * 1) 挂载时 GET `/api/profile` 读取 `profiles` 行（按当前会话用户）；
 * 2) 保存时 PUT `/api/profile` 写回 `profiles`（乐观更新 + 失败回滚）；
 * 3) localStorage 仅作为离线兜底，不再作为主存储。
 */
export function useProfile(userId: string, fallbackEmail?: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    fetch("/api/profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        const p = data?.profile;
        if (p) {
          setProfile({
            nickname:
              p.display_name || fallbackEmail?.split("@")[0] || "文物爱好者",
            bio: p.bio || "",
            avatarUrl: p.avatar_url || undefined,
            username: p.username,
          });
        } else {
          setProfile(defaultProfile(fallbackEmail));
        }
      })
      .catch(() => {
        if (active) setProfile(defaultProfile(fallbackEmail));
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [userId, fallbackEmail]);

  const update = useCallback(
    async (next: UserProfile): Promise<boolean> => {
      // 乐观更新
      setProfile((prev) => ({ ...(prev ?? defaultProfile(fallbackEmail)), ...next }));
      setSaving(true);
      try {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nickname: next.nickname,
            bio: next.bio,
            avatarUrl: next.avatarUrl ?? "",
          }),
        });
        if (!res.ok) {
          const e = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(e.error || "保存失败");
        }
        const data = (await res.json()) as {
          profile: {
            display_name: string;
            bio: string;
            avatar_url: string | null;
            username: string;
          };
        };
        setProfile({
          nickname: data.profile.display_name,
          bio: data.profile.bio || "",
          avatarUrl: data.profile.avatar_url || undefined,
          username: data.profile.username,
        });
        return true;
      } catch (err) {
        // 失败回滚：重新拉取服务端状态
        try {
          const r = await fetch("/api/profile", { cache: "no-store" });
          if (r.ok) {
            const d = await r.json();
            const p = d?.profile;
            if (p)
              setProfile({
                nickname: p.display_name || fallbackEmail?.split("@")[0] || "文物爱好者",
                bio: p.bio || "",
                avatarUrl: p.avatar_url || undefined,
                username: p.username,
              });
          }
        } catch {
          /* 忽略 */
        }
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fallbackEmail]
  );

  return { profile, loaded, saving, update };
}
