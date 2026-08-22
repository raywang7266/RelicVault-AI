"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "./i18n-provider";
import { LOCALES, LOCALE_LABELS, type Locale } from "./locales";
import { cn } from "@/lib/utils";

/**
 * 语言切换器：仅切换「网站结构文案」的语言。
 * 用户上传的文物内容（标题/描述/标签/评论等）不受影响。
 */
export default function LanguageSwitcher({
  className = "",
}: {
  className?: string;
}) {
  const { locale, setLocale, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const choose = (l: Locale) => {
    setLocale(l);
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("lang.label")}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-[120] mt-1.5 w-40 overflow-hidden rounded-lg border border-border bg-white text-[#2C221E] shadow-lg"
        >
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => choose(l)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-secondary",
                  l === locale && "font-semibold text-[#8C6D46]"
                )}
              >
                {LOCALE_LABELS[l]}
                {l === locale && <Check className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
