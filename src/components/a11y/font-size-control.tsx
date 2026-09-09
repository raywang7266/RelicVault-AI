"use client";

import { useEffect, useRef, useState } from "react";
import { Type, Check } from "lucide-react";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { cn } from "@/lib/utils";

// 字号档位：scale 为相对浏览器默认根字号（16px）的倍率。
// previewPx 用固定像素，使下拉里的「Aa」预览不受当前档位影响，
// 始终清楚展示各档位之间的相对大小差异。
const LEVELS = [
  { key: "small", scale: 0.875, labelKey: "a11y.fontSize.small", previewPx: 12 },
  { key: "default", scale: 1, labelKey: "a11y.fontSize.default", previewPx: 14 },
  { key: "large", scale: 1.15, labelKey: "a11y.fontSize.large", previewPx: 18 },
  { key: "xl", scale: 1.35, labelKey: "a11y.fontSize.xl", previewPx: 22 },
  { key: "xxl", scale: 1.6, labelKey: "a11y.fontSize.xxl", previewPx: 26 },
  { key: "xxxl", scale: 1.9, labelKey: "a11y.fontSize.xxxl", previewPx: 32 },
] as const;

type LevelKey = (typeof LEVELS)[number]["key"];

const STORAGE_KEY = "rv_font_scale";

function applyScale(scale: number) {
  document.documentElement.style.setProperty("--font-scale", String(scale));
}

/**
 * 字号调节控件（无障碍）：只缩放文字大小（间距/布局不动），方便不同人群阅读。
 * 偏好保存在 localStorage，并由 <head> 内联脚本在首帧前应用，避免闪烁。
 */
export default function FontSizeControl({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<LevelKey>("default");
  const ref = useRef<HTMLDivElement>(null);

  // 挂载时从 localStorage 恢复 UI 选中态（首帧前内联脚本已应用过实际缩放）。
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const lvl = LEVELS.find((l) => String(l.scale) === saved);
        if (lvl) setCurrent(lvl.key);
      }
    } catch {
      /* localStorage 不可用时回退到默认档 */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const choose = (scale: number, key: LevelKey) => {
    applyScale(scale);
    setCurrent(key);
    try {
      localStorage.setItem(STORAGE_KEY, String(scale));
    } catch {
      /* 忽略持久化失败 */
    }
    setOpen(false);
  };

  const currentScale = LEVELS.find((l) => l.key === current)?.scale ?? 1;

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("a11y.fontSize")}
        title={t("a11y.fontSize")}
        className="rv-ctrl"
      >
        <Type className="h-[18px] w-[18px]" />
        <span className="rv-ctrl-badge" aria-hidden="true">
          {currentScale}×
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("a11y.fontSize")}
          className="rv-menu"
        >
          {LEVELS.map((l) => (
            <li key={l.key}>
              <button
                type="button"
                role="option"
                aria-selected={l.key === current}
                onClick={() => choose(l.scale, l.key)}
                className="rv-menu-item"
              >
                <span
                  className="leading-none text-[var(--bronze-ink)]"
                  style={{ fontSize: `${l.previewPx}px` }}
                >
                  Aa
                </span>
                <span className="flex-1 text-left">{t(l.labelKey)}</span>
                {l.key === current && <Check className="h-4 w-4 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
