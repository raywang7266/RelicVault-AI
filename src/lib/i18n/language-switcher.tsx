"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
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
        title={LOCALE_LABELS[locale]}
        className="rv-ctrl rv-ctrl-lang"
      >
        <Globe className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <ul role="listbox" className="rv-menu w-40">
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => choose(l)}
                className="rv-menu-item"
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
