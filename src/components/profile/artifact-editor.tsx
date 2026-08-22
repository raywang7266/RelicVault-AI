"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { Artifact, PreservationStatus } from "@/lib/types/artifact";
import {
  DYNASTY_OPTIONS,
  MATERIAL_OPTIONS,
  statusLabel,
} from "@/lib/types/artifact";
import LocationPicker, {
  type LocationValue,
} from "@/components/artifacts/location-picker";
import SmartImage from "@/components/artifacts/smart-image";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { translateOption } from "@/lib/i18n/locales";

interface ArtifactEditorProps {
  open: boolean;
  artifact: Artifact | null;
  /** 远端保存进行中（profile-view 注入），按钮显示 Loading 并禁用 */
  saving?: boolean;
  onSave: (patch: Partial<Artifact>) => void | Promise<void>;
  onClose: () => void;
}

const STATUS_OPTIONS: PreservationStatus[] = [
  "Intact",
  "Minor Damage",
  "Severe Degradation",
  "Ruin",
];

/** 编辑「我上传的文物」信息的弹窗，含出土地定位（复用 LocationPicker）。 */
export default function ArtifactEditor({
  open,
  artifact,
  saving,
  onSave,
  onClose,
}: ArtifactEditorProps) {
  const { t, locale } = useTranslation();
  const [title, setTitle] = useState("");
  const [era, setEra] = useState("");
  const [dynasty, setDynasty] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] =
    useState<PreservationStatus>("Intact");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState<LocationValue | null>(null);

  useEffect(() => {
    if (open && artifact) {
      setTitle(artifact.title);
      setEra(artifact.era);
      setDynasty(artifact.dynasty);
      setCategory(artifact.category);
      setStatus(artifact.preservationStatus);
      setTags(artifact.tags.join(", "));
      setDescription(artifact.description);
      setImageUrl(artifact.imageUrl);
      setLocation(
        artifact.latitude != null && artifact.longitude != null
          ? {
              locationName: artifact.locationName ?? "",
              latitude: artifact.latitude,
              longitude: artifact.longitude,
            }
          : null
      );
    }
  }, [open, artifact]);

  if (!open || !artifact) return null;

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const tagList = tags
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean);

    const finalImage =
      imageUrl.trim() ||
      `https://picsum.photos/seed/${encodeURIComponent(trimmedTitle)}/600/800`;

    try {
      await onSave({
        title: trimmedTitle,
        era: era.trim() || "未知",
        dynasty: ((dynasty as Artifact["dynasty"]) || "其他") as Artifact["dynasty"],
        category: ((category as Artifact["category"]) || "其他") as Artifact["category"],
        preservationStatus: status,
        tags: tagList,
        description: description.trim(),
        imageUrl: finalImage,
        locationName: location?.locationName || undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
    } catch (err) {
      // 让外层 toast 或后续处理；这里仅在控制台留下诊断
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.warn("[ArtifactEditor] 保存失败：", err);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[#E6DFC6] bg-[#FAF7F2] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-[#2C221E]">
            {t("artifactEditor.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[#8C7E72] hover:bg-[#EFE6D5]"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 预览 */}
          <div className="overflow-hidden rounded-lg border border-[#E6DFC6] bg-[#EFE6D5]">
            <SmartImage
              src={imageUrl.trim() || `https://picsum.photos/seed/${encodeURIComponent(title || "artifact")}/600/800`}
              alt={title || "预览"}
              fallbackLabel={(title || "藏").slice(0, 1)}
              className="h-40 w-full object-cover"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#3E3228]">
              {t("artifactEditor.name")}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[#D6CBBA] bg-white px-3 py-2 text-sm text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#3E3228]">
                {t("artifactEditor.eraDisplay")}
              </label>
              <input
                value={era}
                onChange={(e) => setEra(e.target.value)}
                className="w-full rounded-lg border border-[#D6CBBA] bg-white px-3 py-2 text-sm text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50"
                placeholder={t("artifactEditor.eraDisplayPlaceholder")}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#3E3228]">
                {t("artifactEditor.eraFilter")}
              </label>
              <select
                value={dynasty}
                onChange={(e) => setDynasty(e.target.value)}
                className="w-full rounded-lg border border-[#D6CBBA] bg-white px-3 py-2 text-sm text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50"
              >
                <option value="">{t("common.all")}</option>
                {DYNASTY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {translateOption(locale, d)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#3E3228]">
                {t("artifactEditor.category")}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-[#D6CBBA] bg-white px-3 py-2 text-sm text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50"
              >
                <option value="">{t("common.all")}</option>
                {MATERIAL_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {translateOption(locale, m)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#3E3228]">
                {t("artifactEditor.preservation")}
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as PreservationStatus)
                }
                className="w-full rounded-lg border border-[#D6CBBA] bg-white px-3 py-2 text-sm text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {translateOption(locale, statusLabel(s))}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#3E3228]">
              {t("artifactEditor.tags")}
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-lg border border-[#D6CBBA] bg-white px-3 py-2 text-sm text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50"
              placeholder={t("artifactEditor.tagsPlaceholder")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#3E3228]">
              {t("artifactEditor.location")}
            </label>
            <LocationPicker value={location} onChange={setLocation} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#3E3228]">
              {t("artifactEditor.imageUrl")}
            </label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-lg border border-[#D6CBBA] bg-white px-3 py-2 text-sm text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50"
              placeholder={t("artifactEditor.imageUrlPlaceholder")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#3E3228]">
              {t("artifactEditor.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-[#D6CBBA] bg-white px-3 py-2 text-sm text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-[#D6CBBA] px-4 py-2 text-sm font-medium text-[#5C4831] hover:bg-[#EFE6D5] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#8C6D46] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#78592F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("artifactEditor.save")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
