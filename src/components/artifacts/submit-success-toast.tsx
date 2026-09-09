"use client";

import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/i18n-provider";

/**
 * 表单提交成功后的优雅提示。基于 tailwindcss-animate 的 animate-in 动画。
 * 由父组件根据 showSuccess 控制显隐；跳转（router.push）后组件卸载即消失。
 */
export default function SubmitSuccessToast({ visible }: { visible: boolean }) {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-[100] flex justify-center px-4">
      <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-xl bg-[var(--ink)] px-5 py-3.5 text-[var(--panel)] shadow-2xl">
        <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-[#7FC77F]" />
        <div>
          <p className="text-sm font-semibold">{t("submitSuccess.title")}</p>
          <p className="mt-0.5 text-xs text-[var(--muted-2)]">
            {t("submitSuccess.desc")}
          </p>
        </div>
      </div>
    </div>
  );
}
