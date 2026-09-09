"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
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

const MAX_EDITOR_IMAGES = 6;

/** 编辑器追加图片时的轻量压缩（与上传表单一致：最长边 1600、≤1.2MB），
 *  避免直接塞入超大原图撑爆 MongoDB 单文档 16MB 上限。 */
async function compressForEditor(dataUrl: string): Promise<string> {
  const maxBase64Length = 1.2 * 1024 * 1024;
  const maxSide = 1600;
  if (dataUrl.length <= maxBase64Length) return dataUrl;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = dataUrl;
    });
    const longest = Math.max(img.naturalWidth, img.naturalHeight) || maxSide;
    const scale = Math.min(1, maxSide / longest);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    let quality = 0.85;
    let out = canvas.toDataURL("image/jpeg", quality);
    while (out.length > maxBase64Length && quality > 0.4) {
      quality = Math.max(0.4, quality - 0.15);
      out = canvas.toDataURL("image/jpeg", quality);
    }
    return out.length < dataUrl.length ? out : dataUrl;
  } catch {
    return dataUrl;
  }
}

/** 编辑「我上传的文物」信息的弹窗，含出土地定位（复用 LocationPicker）。 */

/**
 * 仅 data: / http(s):// 视为「真实可编辑的图片地址」。
 * 后端列表接口在 listMode 下会把 base64 重写为 /api/artifacts/<id>/image 这种
 * 相对路径用于减少 JSON 体积；如果编辑器直接拿这个路径当 imageUrl/images 初值，
 * 用户不改图片保存时会被原样回写，覆盖掉真实的 base64（自指死链）。
 * 因此在 useEffect 初始化时要把这类相对路径过滤掉。
 */
function isUsableImageUrl(u: unknown): u is string {
  return (
    typeof u === "string" &&
    u.length > 0 &&
    (u.startsWith("data:") || /^https?:\/\//i.test(u))
  );
}

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
  /** 多图：images[0] 为封面 */
  const [images, setImages] = useState<string[]>([]);
  /** 封面 URL 输入框（改动后同步替换第一张） */
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState<LocationValue | null>(null);
  /** 追加图片超限的错误提示。
   *  铁律：所有 useState 必须放在组件顶部「提前 return」之前——否则弹窗
   *  关闭/打开两种渲染的 hooks 数量不一致，React 会抛
   *  "Rendered more hooks than during the previous render" 并整页崩进
   *  错误边界（表现为：点「编辑」弹窗打不开、页面直接报错）。 */
  const [addImageError, setAddImageError] = useState<string | null>(null);
  const addImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && artifact) {
      setTitle(artifact.title);
      setEra(artifact.era);
      setDynasty(artifact.dynasty);
      setCategory(artifact.category);
      setStatus(artifact.preservationStatus);
      setTags(artifact.tags.join(", "));
      setDescription(artifact.description);
      // 过滤掉列表形态下的相对路径占位（/api/...），避免保存时把自指写回 DB
      const initialImage = isUsableImageUrl(artifact.imageUrl) ? artifact.imageUrl : "";
      const initialImages = Array.isArray(artifact.images)
        ? artifact.images.filter(isUsableImageUrl)
        : [];
      setImageUrl(initialImage);
      // 老数据没有 images → 回退为单图数组（且只接受真实图片 URL）
      setImages(
        initialImages.length > 0
          ? initialImages
          : initialImage
            ? [initialImage]
            : []
      );
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

  const handleAddImages = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    const remaining = MAX_EDITOR_IMAGES - images.length;
    if (remaining <= 0) {
      setAddImageError(t("upload.errMaxImages"));
      return;
    }
    setAddImageError(null);
    const accepted = list.slice(0, remaining);
    const added: string[] = [];
    for (const f of accepted) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(f);
      });
      added.push(await compressForEditor(dataUrl));
    }
    setImages((prev) => [...prev, ...added]);
    if (list.length > remaining) setAddImageError(t("upload.errMaxImages"));
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const tagList = tags
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean);

    const fallback = `https://picsum.photos/seed/${encodeURIComponent(trimmedTitle)}/600/800`;
    // 多图：以缩略图列表为准；若封面输入框被改动则同步替换第一张
    let finalImages = images.length > 0 ? images.slice() : [];
    const typed = imageUrl.trim();
    if (typed && finalImages[0] !== typed) {
      if (finalImages.length > 0) finalImages[0] = typed;
      else finalImages = [typed];
    }
    if (finalImages.length === 0) finalImages = [fallback];
    const finalImage = finalImages[0];

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
        images: finalImages,
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
        className="w-full max-w-lg rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-[var(--ink)]">
            {t("artifactEditor.title")}
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
          {/* 预览（封面） */}
          <div className="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--chip-2)]">
            <SmartImage
              src={imageUrl.trim() || `https://picsum.photos/seed/${encodeURIComponent(title || "artifact")}/600/800`}
              alt={title || "预览"}
              fallbackLabel={(title || "藏").slice(0, 1)}
              className="h-40 w-full object-cover"
            />
          </div>

          {/* 多图管理：可删除 / 设为封面 */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div
                  key={`${i}-${src.slice(0, 24)}`}
                  className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 ${
                    i === 0 ? "border-[var(--bronze)]" : "border-[var(--border)]"
                  }`}
                >
                  <SmartImage
                    src={src}
                    alt={`图 ${i + 1}`}
                    fallbackLabel={(title || "藏").slice(0, 1)}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                    {i !== 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = images.slice();
                          const [picked] = next.splice(i, 1);
                          next.unshift(picked);
                          setImages(next);
                          setImageUrl(picked);
                        }}
                        className="rounded bg-white/90 px-1 text-[calc(9px*var(--font-scale))] text-[var(--ink)]"
                      >
                        {t("upload.setCover")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const next = images.filter((_, idx) => idx !== i);
                        setImages(next);
                        setImageUrl(next[0] ?? "");
                      }}
                      className="rounded-full bg-red-600 p-0.5 text-white"
                      title={t("upload.removeImage")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  {i === 0 && (
                    <span className="absolute left-0.5 top-0.5 rounded bg-[var(--bronze)] px-1 text-[calc(9px*var(--font-scale))] text-white">
                      {t("upload.cover")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {images.length < MAX_EDITOR_IMAGES && (
            <div>
              <input
                ref={addImageRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    void handleAddImages(e.target.files);
                  }
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => addImageRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--bronze)] px-3 py-2 text-xs font-medium text-[var(--bronze)] hover:bg-[var(--chip-2)]"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("upload.addImage")}
              </button>
              {addImageError && (
                <p className="mt-1 text-xs text-red-600">{addImageError}</p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--brown)]">
              {t("artifactEditor.name")}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--brown)]">
                {t("artifactEditor.eraDisplay")}
              </label>
              <input
                value={era}
                onChange={(e) => setEra(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)]"
                placeholder={t("artifactEditor.eraDisplayPlaceholder")}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--brown)]">
                {t("artifactEditor.eraFilter")}
              </label>
              <select
                value={dynasty}
                onChange={(e) => setDynasty(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)]"
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
              <label className="mb-1.5 block text-sm font-medium text-[var(--brown)]">
                {t("artifactEditor.category")}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)]"
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
              <label className="mb-1.5 block text-sm font-medium text-[var(--brown)]">
                {t("artifactEditor.preservation")}
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as PreservationStatus)
                }
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)]"
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
            <label className="mb-1.5 block text-sm font-medium text-[var(--brown)]">
              {t("artifactEditor.tags")}
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)]"
              placeholder={t("artifactEditor.tagsPlaceholder")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--brown)]">
              {t("artifactEditor.location")}
            </label>
            <LocationPicker value={location} onChange={setLocation} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--brown)]">
              {t("artifactEditor.imageUrl")}
            </label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)]"
              placeholder={t("artifactEditor.imageUrlPlaceholder")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--brown)]">
              {t("artifactEditor.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)]"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--bronze-ink)] hover:bg-[var(--chip-2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--bronze)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--bronze-deep)] disabled:cursor-not-allowed disabled:opacity-60"
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
