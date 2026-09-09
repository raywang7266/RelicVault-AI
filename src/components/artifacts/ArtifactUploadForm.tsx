"use client";

import React, { useState, useRef, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import {
  Upload,
  Sparkles,
  Loader2,
  X,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Wand2,
} from "lucide-react";
import LocationPicker, { type LocationValue } from "./location-picker";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { translateOption } from "@/lib/i18n/locales";
import { DYNASTY_OPTIONS, MATERIAL_OPTIONS } from "@/lib/types/artifact";

/**
 * 生成一张 SVG 占位“文物影像”，以 data URL 形式返回。
 * 用于「填充示例数据」按钮：无需联网、无需调用 AI 即可获得可预览的图片。
 */
function makeSampleImage(label: string, from: string, to: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800' viewBox='0 0 600 800'>
    <defs>
      <linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='${from}'/>
        <stop offset='100%' stop-color='${to}'/>
      </linearGradient>
    </defs>
    <rect width='600' height='800' fill='url(#bg)'/>
    <g fill='rgba(255,255,255,0.16)'>
      <ellipse cx='300' cy='350' rx='150' ry='210'/>
      <rect x='250' y='140' width='100' height='42' rx='10'/>
      <rect x='262' y='560' width='76' height='150' rx='14'/>
    </g>
    <text x='300' y='630' font-family='serif' font-size='34' fill='rgba(54,40,28,0.88)' text-anchor='middle'>${label}</text>
    <text x='300' y='672' font-family='sans-serif' font-size='17' fill='rgba(54,40,28,0.55)' text-anchor='middle'>RelicVault · 示例影像</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 识图前把过大的图片压缩到安全体积。
 *
 * 背景：智谱 GLM（glm-4v-flash）对请求里的图片体积有上限（base64 约 10MB）。
 * 前端允许上传最大 10MB 的原图，base64 编码后会膨胀到约 13MB，超出上限时
 * 智谱直接返回「API 调用参数有误」→ 接口 502 → 前端表现为「AI 识图失败」。
 * （实测：4000x5000 但仅 4.19MB 的图可成功，9.37MB 的图必失败，故是体积而非分辨率限制。）
 *
 * 这里在浏览器端用 canvas 先把最长边缩到 2048、再按质量递减压到 ≤4MB：
 * 既避开体积上限，也大幅缩短上传耗时。压缩失败时回退原图，不阻断流程。
 */
/** 单件文物最多可上传的图片张数（与后端 schema、智谱总体积上限配套） */
const MAX_UPLOAD_IMAGES = 6;

async function compressImage(
  dataUrl: string,
  opts: { maxBase64Length?: number; maxSide?: number } = {}
): Promise<string> {
  const maxBase64Length = opts.maxBase64Length ?? 4 * 1024 * 1024;
  const maxSide = opts.maxSide ?? 2048;
  if (dataUrl.length <= maxBase64Length) return dataUrl;

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image decode failed"));
      img.src = src;
    });

  try {
    const img = await loadImage(dataUrl);
    const longest = Math.max(img.naturalWidth, img.naturalHeight) || maxSide;
    const scale = Math.min(1, maxSide / longest);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;

    // JPEG 无透明通道，先铺白底，避免 PNG 透明区域被压成黑块
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    let quality = 0.85;
    let out = canvas.toDataURL("image/jpeg", quality);
    while (out.length > maxBase64Length && quality > 0.4) {
      quality = Math.max(0.4, quality - 0.15);
      out = canvas.toDataURL("image/jpeg", quality);
      if (quality === 0.4) break;
    }
    return out.length < dataUrl.length ? out : dataUrl;
  } catch {
    // 浏览器无法解码该格式等情况 → 回退原图，交由后端处理
    return dataUrl;
  }
}

/**
 * 上传前的压缩（比识图压缩更严格）：最长边 1600、单张 ≤1.2MB。
 *
 * 为什么上传时就要压：图片以 data URL 内联存进 MongoDB，而单文档上限 16MB；
 * 6 张合计约 7MB 既能守住该上限，也低于智谱单次请求约 10MB 的图片总体积上限，
 * 让「多图一次送 AI」无需再额外瘦身。
 */
async function compressForUpload(dataUrl: string): Promise<string> {
  return compressImage(dataUrl, {
    maxSide: 1600,
    maxBase64Length: 1.2 * 1024 * 1024,
  });
}

/** 一批可一键填充的示例文物（循环切换，便于反复体验打标流程） */
const SAMPLE_DATA: {
  title: string;
  era: string;
  category: string;
  preservationStatus: PreservationStatus;
  tags: string[];
  description: string;
  location?: LocationValue;
  from: string;
  to: string;
}[] = [
  {
    title: "清·粉彩百花不落地葫芦瓶",
    era: "清乾隆",
    category: "陶瓷器",
    preservationStatus: "Intact",
    tags: ["粉彩", "官窑", "葫芦瓶", "吉祥"],
    description:
      "通体绘各色花卉密不露地，寓意百花呈瑞。粉彩柔润、色泽富丽，为乾隆繁缛华美风格之代表，底书青花六字篆款。",
    location: {
      locationName: "江西·景德镇（御窑厂遗址）",
      latitude: 29.2922,
      longitude: 117.1794,
    },
    from: "#F3E7D3",
    to: "#D9C3A0",
  },
  {
    title: "西周·青铜饕餮纹方鼎",
    era: "西周早期",
    category: "金属器",
    preservationStatus: "Minor Damage",
    tags: ["青铜器", "礼器", "饕餮纹"],
    description:
      "立耳方腹，四壁饰饕餮纹，纹饰森严庄重，为宗庙祭器。一足有旧裂经加固，绿锈自然，铭文漫漶可辨。",
    location: {
      locationName: "陕西·西安（周原遗址）",
      latitude: 34.3416,
      longitude: 108.9398,
    },
    from: "#Dfe3dc",
    to: "#A9B7A0",
  },
  {
    title: "汉·玉辟邪",
    era: "汉",
    category: "玉石",
    preservationStatus: "Intact",
    tags: ["玉器", "瑞兽", "辟邪"],
    description:
      "圆雕辟邪昂首张口，身生双翼，肌理圆润，为汉代镇墓辟邪之物。玉质青白，局部受沁呈褐斑，琢工苍劲。",
    location: {
      locationName: "江苏·徐州（狮子山楚王陵）",
      latitude: 34.2274,
      longitude: 117.184,
    },
    from: "#E7E2D6",
    to: "#C3BBA6",
  },
];

export type PreservationStatus =
  | "Intact"
  | "Minor Damage"
  | "Severe Degradation"
  | "Ruin";

export interface ArtifactFormData {
  title: string;
  era: string;
  category: string;
  preservationStatus: PreservationStatus;
  tags: string[];
  description: string;
  /** 封面（= images[0]） */
  imageUrl: string;
  /** 全部图片（第一张为封面） */
  images: string[];
  /** 出土地 / 发现位置：地点名称（详细地址） */
  locationName?: string;
  /** 纬度 (WGS84) */
  latitude?: number;
  /** 经度 (WGS84) */
  longitude?: number;
  /**
   * 提交者用户标识（由父组件注入）。后端据此归属到「我的贡献」并便于多用户
   * 隔离；不传时落库为 undefined，个人中心将按"全部"兜底展示。
   */
  ownerId?: string;
}

interface ArtifactUploadFormProps {
  onSubmit?: (data: ArtifactFormData) => Promise<void> | void;
  className?: string;
  /**
   * 当前登录用户标识；提交时随表单数据一起送达后端，
   * 落库为 `artifact.ownerId`，便于个人中心「我的贡献」过滤。
   */
  ownerId?: string;
}

const PRESERVATION_OPTIONS: { labelKey: string; descKey: string; value: PreservationStatus }[] = [
  { labelKey: "upload.presIntact", descKey: "upload.presIntactDesc", value: "Intact" },
  { labelKey: "upload.presMinor", descKey: "upload.presMinorDesc", value: "Minor Damage" },
  { labelKey: "upload.presSevere", descKey: "upload.presSevereDesc", value: "Severe Degradation" },
  { labelKey: "upload.presRuin", descKey: "upload.presRuinDesc", value: "Ruin" },
];

export default function ArtifactUploadForm({
  onSubmit,
  className = "",
  ownerId,
}: ArtifactUploadFormProps) {
  const { t, locale } = useTranslation();
  // Form Field States
  // 多图：imagePreviews[0] 为封面/主图
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  /** 封面（派生值），供只需单张的旧逻辑使用 */
  const imagePreview = imagePreviews[0] ?? null;
  const [title, setTitle] = useState("");
  const [era, setEra] = useState("");
  const [eraOther, setEraOther] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOther, setCategoryOther] = useState("");
  const [preservationStatus, setPreservationStatus] =
    useState<PreservationStatus>("Intact");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<LocationValue | null>(null);

  // UI / UX Statuses
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);
  // 示例数据按钮：循环切换的样本索引
  const [sampleIndex, setSampleIndex] = useState(0);
  // 「填充脉冲」：每次 AI / 示例填充完成时 +1，用于驱动表单字段做一次
  // field-filled 「吸气」动效（通过给字段套 key={...${fillPulse}} 触发重挂载）。
  const [fillPulse, setFillPulse] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag & Drop / File Input（支持一次选择多张）
  const readAsDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });

  const processFiles = async (files: FileList | File[]) => {
    const all = Array.from(files);
    if (all.length === 0) return;

    const images = all.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      setError(t("upload.errImageFormat"));
      return;
    }
    if (images.some((f) => f.size > 10 * 1024 * 1024)) {
      setError(t("upload.errImageSize"));
      return;
    }

    const remaining = MAX_UPLOAD_IMAGES - imagePreviews.length;
    if (remaining <= 0) {
      setError(t("upload.errMaxImages"));
      return;
    }

    setError(null);
    setAiSuccessMsg(null);

    // 逐张压缩：控制单张体积，避免多图撑爆 MongoDB 文档 / 智谱请求上限
    const accepted = images.slice(0, remaining);
    const compressed: string[] = [];
    for (const f of accepted) {
      const dataUrl = await readAsDataURL(f);
      compressed.push(await compressForUpload(dataUrl));
    }
    setImagePreviews((prev) => [...prev, ...compressed]);

    // 超出上限时只取前面几张，并给出提示
    if (images.length > remaining) {
      setError(t("upload.errMaxImages"));
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void processFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void processFiles(e.target.files);
    }
    // 允许重复选择同一批文件
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  /** 设为封面：把该图移到第一位（imagePreviews[0] 即封面） */
  const handleSetCover = (index: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreviews((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const next = prev.slice();
      const [picked] = next.splice(index, 1);
      next.unshift(picked);
      return next;
    });
  };

  // Tag Management
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Trigger AI Analysis API (/api/analyze-artifact)
  const handleAIAnalyze = async () => {
    if (imagePreviews.length === 0) {
      setError(t("upload.errNoImageForAi"));
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAiSuccessMsg(null);

    try {
      // 上传时已把单张压到 ≤1.2MB；这里再兜底压缩一次，然后**一次性把全部图片
      // 送入智谱**（已实测支持多图），让 AI 综合多角度判断，比单张更准确。
      const imagesForAI = await Promise.all(
        imagePreviews.map((url) => compressImage(url))
      );
      const response = await fetch("/api/analyze-artifact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ images: imagesForAI, locale }),
      });

      if (!response.ok) {
        // 透传服务端返回的可读错误（如 429 限额 / 模型不可用）
        let serverMsg = "";
        try {
          const errJson = await response.json();
          serverMsg =
            [errJson?.details, errJson?.error].filter(Boolean).join(" — ") ||
            "";
        } catch {
          /* ignore */
        }
        const base = t("upload.errAiFailed");
        throw new Error(serverMsg ? `${base}：${serverMsg}` : base);
      }

      const data = await response.json();
      // 后端响应是嵌套结构 { analysis: { title, era, category, ... } }
      // 解构到 analysis 上；兼容旧扁平结构以防后端以后改回
      const analysis = data?.analysis ?? data ?? {};
      const resultTitle = analysis.title;
      const resultEra = analysis.era;
      const resultCategory = analysis.category;
      const resultStatus = analysis.preservationStatus;
      const resultDescription = analysis.description;
      const resultTags: unknown = analysis.tags;

      // Auto-fill form fields with AI output
      if (resultTitle) setTitle(String(resultTitle));
      if (resultEra) {
        const eraVal = String(resultEra);
        if (DYNASTY_OPTIONS.includes(eraVal as any)) setEra(eraVal);
        else {
          setEra("其他");
          setEraOther(eraVal);
        }
      }
      if (resultCategory) {
        const catVal = String(resultCategory);
        if (MATERIAL_OPTIONS.includes(catVal as any)) setCategory(catVal);
        else {
          setCategory("其他");
          setCategoryOther(catVal);
        }
      }
      if (resultStatus) {
        setPreservationStatus(resultStatus as PreservationStatus);
      }
      if (resultDescription) setDescription(String(resultDescription));
      if (Array.isArray(resultTags)) {
        const newTags = (resultTags as unknown[]).map((x) => String(x)).filter(Boolean);
        if (newTags.length > 0) {
          // Merge AI tags with current tags, avoiding duplicates
          const merged = Array.from(new Set([...tags, ...newTags]));
          setTags(merged);
        }
      }

      setAiSuccessMsg(t("upload.aiSuccessDesc"));
      setFillPulse((n) => n + 1);
    } catch (  err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : t("upload.errAiUnknown")
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 一键填充示例数据：便于在不调用 AI 接口时快速体验打标与保存流程
  const handleFillSample = () => {
    const s = SAMPLE_DATA[sampleIndex % SAMPLE_DATA.length];
    setSampleIndex((i) => i + 1);
    setImagePreviews([makeSampleImage(s.title, s.from, s.to)]);
    setTitle(s.title);
    if (DYNASTY_OPTIONS.includes(s.era as any)) setEra(s.era);
    else {
      setEra("其他");
      setEraOther(s.era);
    }
    if (MATERIAL_OPTIONS.includes(s.category as any)) setCategory(s.category);
    else {
      setCategory("其他");
      setCategoryOther(s.category);
    }
    setPreservationStatus(s.preservationStatus);
    setTags(s.tags);
    setDescription(s.description);
    setLocation(s.location ?? null);
    setError(null);
    setAiSuccessMsg(null);
    setFillPulse((n) => n + 1);
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imagePreviews.length === 0) {
      setError(t("upload.errNoImage"));
      return;
    }
    if (!title.trim()) {
      setError(t("upload.errNoTitle"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData: ArtifactFormData = {
        title,
        era: era === "其他" ? eraOther : era,
        category: category === "其他" ? categoryOther : category,
        preservationStatus,
        tags,
        description,
        imageUrl: imagePreviews[0],
        images: imagePreviews,
        locationName: location?.locationName,
        latitude: location?.latitude,
        longitude: location?.longitude,
        // 注入当前用户标识（若未登录则 undefined，个人中心将做"全部"兜底）
        ownerId: ownerId || undefined,
      };

      if (onSubmit) {
        await onSubmit(formData);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : t("upload.errSubmitFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`max-w-4xl mx-auto p-6 md:p-8 bg-[var(--panel)] rounded-2xl border border-[var(--border-soft)] shadow-sm text-[var(--brown)] font-sans ${className}`}
    >
      {/* Header Title Section */}
      <div className="mb-6 pb-4 border-b border-[var(--border-soft)] flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[var(--ink)] tracking-tight">
            {t("upload.title")}
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            {t("upload.subtitle")}
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50/80 border border-red-200 text-red-800 flex items-start gap-3 text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{t("upload.errorTitle")}</p>
            <p className="mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {aiSuccessMsg && (
        <div className="mb-6 p-4 rounded-xl bg-[#F1F6EC] border border-[#D0E2C3] text-[#3B5B28] flex items-start gap-3 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#547E3B] mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{t("upload.aiSuccessTitle")}</p>
            <p className="mt-0.5 opacity-90">{aiSuccessMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Requirement 1: File Upload & Preview */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[var(--ink)]">
            {t("upload.imageHint")} <span className="text-red-500">*</span>
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative min-h-[280px] rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 bg-[var(--surface)] ${
              isDragging
                ? "border-[var(--bronze)] bg-[var(--chip-2)] dropzone-active"
                : "border-[var(--border)] hover:border-[var(--bronze)] hover:bg-[var(--chip)]"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleInputChange}
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
            />

            {imagePreviews.length > 0 ? (
              <div className="w-full space-y-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {imagePreviews.map((src, i) => (
                    <div
                      key={`${i}-${src.slice(0, 32)}`}
                      className="relative aspect-square rounded-lg overflow-hidden group border border-[var(--border)] bg-white"
                    >
                      <Image
                        src={src}
                        alt={`文物影像 ${i + 1}`}
                        fill
                        unoptimized={src.startsWith("data:")}
                        className="object-cover"
                      />
                      {i === 0 && (
                        <span className="absolute left-1 top-1 text-[calc(10px*var(--font-scale))] px-1.5 py-0.5 rounded bg-[var(--bronze)] text-white">
                          {t("upload.cover")}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                        {i !== 0 && (
                          <button
                            type="button"
                            onClick={handleSetCover(i)}
                            className="text-[calc(10px*var(--font-scale))] px-2 py-1 rounded bg-white/90 text-[var(--ink)] hover:bg-white"
                          >
                            {t("upload.setCover")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleRemoveImage(i)}
                          className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                          title={t("upload.removeImage")}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[calc(11px*var(--font-scale))] text-[var(--muted-3)] text-center">
                  {t("upload.imageCount")} {imagePreviews.length}/{MAX_UPLOAD_IMAGES}
                  {" · "}
                  {t("upload.clickOrDrag")}
                </p>
              </div>
            ) : (
              <div className="text-center space-y-3 py-8">
                <div className="w-14 h-14 rounded-full bg-[var(--chip-2)] flex items-center justify-center mx-auto text-[var(--bronze)] shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {t("upload.clickOrDrag")}
                  </p>
                  <p className="text-xs text-[var(--muted-3)] mt-1">
                    {t("upload.imageRequired")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Requirement 2: AI Trigger Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-[var(--chip-2)] to-[var(--paper-2)] border border-[var(--border)] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[var(--bronze)] text-white shadow-sm flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
            <p className="text-sm font-semibold text-[var(--ink)]">
              {t("upload.aiEngine")}
            </p>
            <p className="text-xs text-[var(--chip-ink)]">
              {t("upload.aiEngineDesc")}
            </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleFillSample}
              className="px-4 py-2.5 rounded-lg border border-[var(--bronze)] text-[var(--bronze)] hover:bg-[var(--chip-2)] font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer flex-shrink-0 pressable"
              title={t("upload.fillSample")}
            >
              <Wand2 className="w-4 h-4" />
              <span>{t("upload.fillSample")}</span>
            </button>

            <button
              type="button"
              onClick={handleAIAnalyze}
              disabled={isAnalyzing || !imagePreview}
              className="px-5 py-2.5 rounded-lg bg-[var(--bronze)] hover:bg-[var(--bronze-deep)] disabled:bg-[#C2B7A7] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed flex-shrink-0 pressable"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{t("upload.analyzing")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 transition-transform duration-300 group-active:rotate-12" />
                  <span>{t("upload.aiButton")}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Requirement 3: Auto-filled Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--brown)]">
              {t("upload.name")} <span className="text-red-500">*</span>
            </label>
            <input
              key={`title-${fillPulse}`}
              type="text"
              required
              placeholder={t("upload.namePlaceholder")}
              value={title}
              onChange={(e)  => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)] focus:border-[var(--bronze)] transition-all text-sm field-filled"
            />
          </div>

          {/* Era / Dynasty */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--brown)]">
              {t("upload.era")}
            </label>
            <select
              key={`era-${fillPulse}`}
              value={era}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "其他") {
                  setEra("其他");
                } else {
                  setEra(v);
                  setEraOther("");
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)] focus:border-[var(--bronze)] transition-all text-sm cursor-pointer field-filled"
            >
              {DYNASTY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {translateOption(locale, d)}
                </option>
              ))}
            </select>
            {era === "其他" && (
              <input
                key={`eraOther-${fillPulse}`}
                type="text"
                placeholder={t("upload.eraPlaceholder")}
                value={eraOther}
                onChange={(e) => setEraOther(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)] focus:border-[var(--bronze)] transition-all text-sm field-filled"
              />
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--brown)]">
              {t("upload.category")}
            </label>
            <select
              key={`category-${fillPulse}`}
              value={category}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "其他") {
                  setCategory("其他");
                } else {
                  setCategory(v);
                  setCategoryOther("");
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)] focus:border-[var(--bronze)] transition-all text-sm cursor-pointer field-filled"
            >
              {MATERIAL_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {translateOption(locale, m)}
                </option>
              ))}
            </select>
            {category === "其他" && (
              <input
                key={`categoryOther-${fillPulse}`}
                type="text"
                placeholder={t("upload.categoryPlaceholder")}
                value={categoryOther}
                onChange={(e) => setCategoryOther(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)] focus:border-[var(--bronze)] transition-all text-sm field-filled"
              />
            )}
          </div>

          {/* Preservation Status */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--brown)]">
              {t("upload.preservation")}
            </label>
            <select
              key={`status-${fillPulse}`}
              value={preservationStatus}
              onChange={(e) =>
                setPreservationStatus(e.target.value as PreservationStatus)
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)] focus:border-[var(--bronze)] transition-all text-sm cursor-pointer field-filled"
            >
              {PRESERVATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* AI Suggested Tags / Clickable Badge Chips */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--brown)]">
            {t("upload.tags")}
          </label>
          <div key={`tags-${fillPulse}`} className="flex flex-wrap items-center gap-2 p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] min-h-[56px] field-filled">
            {tags.length === 0 && (
              <span className="text-xs text-[var(--muted-2)] italic">
                {t("upload.noTags")}
              </span>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--chip-2)] text-[var(--bronze-ink)] border border-[#D8CCB7] hover:bg-[#E2D6C1] transition-colors shadow-xs"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-600 transition-colors cursor-pointer p-0.5 rounded-full"
                  title={`移除标签 #${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <div className="flex items-center gap-1.5 min-w-[150px] flex-1">
              <input
                type="text"
                placeholder={t("upload.tagInputPlaceholder")}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDownTag}
                className="w-full bg-transparent border-none text-sm text-[var(--ink)] focus:outline-none px-1 py-1 placeholder-[#A39587]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="p-1.5 text-[var(--bronze)] hover:bg-[var(--chip-2)] rounded-md transition-colors"
                title={t("upload.addTag")}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Description Textarea */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--brown)]">
            {t("upload.description")}
          </label>
          <textarea
            key={`desc-${fillPulse}`}
            rows={4}
            placeholder={t("upload.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--bronze)] focus:border-[var(--bronze)] transition-all text-sm resize-y leading-relaxed field-filled"
          />
        </div>

        {/* 出土地 / 发现位置（地图定位） */}
        <LocationPicker value={location} onChange={setLocation} />

        {/* Form Actions / Submit Button */}
        <div className="pt-4 border-t border-[var(--border-soft)] flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-[var(--ink)] hover:bg-[#42332D] disabled:bg-[#8C827A] text-[var(--panel)] font-medium text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed pressable"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("upload.submitting")}</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                <span>{t("upload.submit")}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}