"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/i18n-provider";

// 白天 / 夜间主题一键切换。偏好保存在 localStorage["rv_theme"]，并由 <head>
// 内联脚本在首帧前应用 .dark 类，避免进入页面后整屏闪白/闪黑。
const STORAGE_KEY = "rv_theme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const [dark, setDark] = useState(false);

  // 挂载时同步真实状态（首帧前内联脚本已应用过 .dark 类）。
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* 忽略持久化失败 */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      data-theme={dark ? "dark" : "light"}
      aria-label={t("a11y.theme")}
      title={dark ? t("a11y.theme.dark") : t("a11y.theme.light")}
      className="rv-ctrl"
    >
      {dark ? (
        <Sun className="h-[18px] w-[18px]" />
      ) : (
        <Moon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
