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
  imageUrl: string;
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  // Handle Drag & Drop / File Input
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(t("upload.errImageFormat"));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(t("upload.errImageSize"));
      return;
    }

    setError(null);
    setAiSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    if (!imagePreview) {
      setError(t("upload.errNoImageForAi"));
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAiSuccessMsg(null);

    try {
      const response = await fetch("/api/analyze-artifact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imagePreview, locale }),
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
    setImagePreview(makeSampleImage(s.title, s.from, s.to));
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
    if (!imagePreview) {
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
        imageUrl: imagePreview,
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
      className={`max-w-4xl mx-auto p-6 md:p-8 bg-[#FAF7F2] rounded-2xl border border-[#E6DFC6] shadow-sm text-[#3E3228] font-sans ${className}`}
    >
      {/* Header Title Section */}
      <div className="mb-6 pb-4 border-b border-[#E6DFC6] flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#2C221E] tracking-tight">
            {t("upload.title")}
          </h2>
          <p className="text-sm text-[#7A6B5D] mt-1">
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
          <label className="block text-sm font-semibold text-[#2C221E]">
            {t("upload.imageHint")} <span className="text-red-500">*</span>
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative min-h-[280px] rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 bg-[#F5F0E6]/60 ${
              isDragging
                ? "border-[#8C6D46] bg-[#EFE6D5] dropzone-active"
                : "border-[#D6CBBA] hover:border-[#8C6D46] hover:bg-[#F2ECE1]"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleInputChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative w-full h-72 rounded-lg overflow-hidden group">
                <Image
                  src={imagePreview}
                  alt="文物影像预览"
                  fill
                  unoptimized={imagePreview.startsWith("data:")}
                  className="object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <span className="text-xs text-white bg-black/60 px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" /> {t("upload.changePhoto")}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    title={t("upload.removeImage")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 py-8">
                <div className="w-14 h-14 rounded-full bg-[#EFE6D5] flex items-center justify-center mx-auto text-[#8C6D46] shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2C221E]">
                    {t("upload.clickOrDrag")}
                  </p>
                  <p className="text-xs text-[#8C7E72] mt-1">
                    {t("upload.imageRequired")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Requirement 2: AI Trigger Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-[#EFE6D5] to-[#E5D9C3] border border-[#D6CBBA] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#8C6D46] text-white shadow-sm flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
            <p className="text-sm font-semibold text-[#2C221E]">
              {t("upload.aiEngine")}
            </p>
            <p className="text-xs text-[#6E5D4F]">
              {t("upload.aiEngineDesc")}
            </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleFillSample}
              className="px-4 py-2.5 rounded-lg border border-[#8C6D46] text-[#8C6D46] hover:bg-[#EFE6D5] font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer flex-shrink-0 pressable"
              title={t("upload.fillSample")}
            >
              <Wand2 className="w-4 h-4" />
              <span>{t("upload.fillSample")}</span>
            </button>

            <button
              type="button"
              onClick={handleAIAnalyze}
              disabled={isAnalyzing || !imagePreview}
              className="px-5 py-2.5 rounded-lg bg-[#8C6D46] hover:bg-[#735836] disabled:bg-[#C2B7A7] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed flex-shrink-0 pressable"
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
            <label className="block text-sm font-medium text-[#3E3228]">
              {t("upload.name")} <span className="text-red-500">*</span>
            </label>
            <input
              key={`title-${fillPulse}`}
              type="text"
              required
              placeholder={t("upload.namePlaceholder")}
              value={title}
              onChange={(e)  => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#D6CBBA] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50 focus:border-[#8C6D46] transition-all text-sm field-filled"
            />
          </div>

          {/* Era / Dynasty */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#3E3228]">
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
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#D6CBBA] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50 focus:border-[#8C6D46] transition-all text-sm cursor-pointer field-filled"
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
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D6CBBA] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50 focus:border-[#8C6D46] transition-all text-sm field-filled"
              />
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#3E3228]">
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
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#D6CBBA] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50 focus:border-[#8C6D46] transition-all text-sm cursor-pointer field-filled"
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
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D6CBBA] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50 focus:border-[#8C6D46] transition-all text-sm field-filled"
              />
            )}
          </div>

          {/* Preservation Status */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#3E3228]">
              {t("upload.preservation")}
            </label>
            <select
              key={`status-${fillPulse}`}
              value={preservationStatus}
              onChange={(e) =>
                setPreservationStatus(e.target.value as PreservationStatus)
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#D6CBBA] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50 focus:border-[#8C6D46] transition-all text-sm cursor-pointer field-filled"
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
          <label className="block text-sm font-medium text-[#3E3228]">
            {t("upload.tags")}
          </label>
          <div key={`tags-${fillPulse}`} className="flex flex-wrap items-center gap-2 p-3.5 rounded-lg border border-[#D6CBBA] bg-[#F5F0E6]/40 min-h-[56px] field-filled">
            {tags.length === 0 && (
              <span className="text-xs text-[#9C8E80] italic">
                {t("upload.noTags")}
              </span>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EFE6D5] text-[#5C4831] border border-[#D8CCB7] hover:bg-[#E2D6C1] transition-colors shadow-xs"
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
                className="w-full bg-transparent border-none text-sm text-[#2C221E] focus:outline-none px-1 py-1 placeholder-[#A39587]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="p-1.5 text-[#8C6D46] hover:bg-[#EFE6D5] rounded-md transition-colors"
                title={t("upload.addTag")}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Description Textarea */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#3E3228]">
            {t("upload.description")}
          </label>
          <textarea
            key={`desc-${fillPulse}`}
            rows={4}
            placeholder={t("upload.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#D6CBBA] bg-[#FAF7F2] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8C6D46]/50 focus:border-[#8C6D46] transition-all text-sm resize-y leading-relaxed field-filled"
          />
        </div>

        {/* 出土地 / 发现位置（地图定位） */}
        <LocationPicker value={location} onChange={setLocation} />

        {/* Form Actions / Submit Button */}
        <div className="pt-4 border-t border-[#E6DFC6] flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-[#2C221E] hover:bg-[#42332D] disabled:bg-[#8C827A] text-[#FAF7F2] font-medium text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed pressable"
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