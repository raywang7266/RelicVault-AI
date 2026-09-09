"use client";

import { useEffect, useRef, useState } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import type { UserProfile } from "@/lib/mock/profile";
import { useTranslation } from "@/lib/i18n/i18n-provider";

interface ProfileEditModalProps {
  open: boolean;
  initial: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
}

const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024; // 1.5MB 上限

/** 编辑个人资料（昵称 / 简介 / 头像）的弹窗。头像支持本地上传（转为 data URL）。 */
export default function ProfileEditModal({
  open,
  initial,
  onSave,
  onClose,
}: ProfileEditModalProps) {
  const { t } = useTranslation();
  const [nickname, setNickname] = useState(initial.nickname);
  const [bio, setBio] = useState(initial.bio);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? "");
  const [avatarError, setAvatarError] = useState<string | null>(null);
  // 隐私设置：默认公开（与后端 DEFAULT_PRIVACY 一致）
  const [showFollowing, setShowFollowing] = useState(
    initial.privacy?.showFollowing ?? true
  );
  const [showFollowers, setShowFollowers] = useState(
    initial.privacy?.showFollowers ?? true
  );
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setNickname(initial.nickname);
      setBio(initial.bio);
      setAvatarUrl(initial.avatarUrl ?? "");
      setAvatarError(null);
      setShowFollowing(initial.privacy?.showFollowing ?? true);
      setShowFollowers(initial.privacy?.showFollowers ?? true);
    }
  }, [open, initial]);

  if (!open) return null;

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError(t("editProfile.avatarErrFormat"));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError(t("editProfile.avatarErrSize"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(typeof reader.result === "string" ? reader.result : "");
      setAvatarError(null);
    };
    reader.onerror = () => setAvatarError(t("editProfile.avatarErrRead"));
    reader.readAsDataURL(file);
  };

  const clearAvatar = () => {
    setAvatarUrl("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    onSave({
      nickname: trimmed,
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
      privacy: {
        showFollowing,
        showFollowers,
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-[var(--ink)]">
            {t("editProfile.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[var(--muted-3)] hover:bg-[var(--chip-2)]"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 头像：本地上传 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--brown)]">
              {t("editProfile.avatar")}
            </label>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--border)] bg-[var(--chip-2)]">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="头像预览"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-7 w-7 text-[var(--bronze)]" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--bronze-ink)] transition hover:bg-[var(--chip-2)]"
                >
                  <Upload className="h-4 w-4" /> {t("editProfile.uploadAvatar")}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={clearAvatar}
                    className="text-xs text-[#9B2C2C] hover:underline"
                  >
                    {t("editProfile.removeAvatar")}
                  </button>
                )}
              </div>
            </div>
            {avatarError && (
              <p className="mt-1.5 text-xs text-[#9B2C2C]">{avatarError}</p>
            )}
            <p className="mt-1 text-[calc(11px*var(--font-scale))] text-[var(--muted-2)]">
              {t("editProfile.avatarHint")}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--brown)]">
              {t("editProfile.nickname")}
            </label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)]"
              placeholder={t("editProfile.nicknamePlaceholder")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--brown)]">
              {t("editProfile.bio")}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={140}
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)]"
              placeholder={t("editProfile.bioPlaceholder")}
            />
            <p className="mt-1 text-right text-[calc(11px*var(--font-scale))] text-[var(--muted-2)]">
              {bio.length}/140
            </p>
          </div>

          {/* 隐私设置 */}
          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--panel)] p-3">
            <p className="mb-2 text-sm font-medium text-[var(--brown)]">
              {t("connections.privacyTitle")}
            </p>
            <PrivacyToggle
              label={t("connections.privacyShowFollowing")}
              checked={showFollowing}
              onChange={setShowFollowing}
            />
            <PrivacyToggle
              label={t("connections.privacyShowFollowers")}
              checked={showFollowers}
              onChange={setShowFollowers}
            />
            <p className="mt-1 text-[calc(11px*var(--font-scale))] text-[var(--muted-2)]">
              {t("connections.privacyHint")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--bronze-ink)] hover:bg-[var(--chip-2)]"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!nickname.trim()}
            className="rounded-lg bg-[var(--bronze)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--bronze-deep)] disabled:opacity-50"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function PrivacyToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1.5">
      <span className="text-sm text-[var(--bronze-ink)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--bronze)]" : "bg-[var(--border)]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "left-0.5 translate-x-4" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}
