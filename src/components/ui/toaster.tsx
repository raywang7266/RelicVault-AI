"use client";

import * as React from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

/**
 * 全局 Toast Provider + useToast hook。
 *
 * 设计：
 * - 内部维护一个简短的 ID 队列，最大 5 条；
 * - 每次 `toast()` 推入新项，4s/6s 自动关闭（可显式覆盖）；
 * - 通过 Context 暴露给所有 client 组件，避免依赖第三方 store。
 */

type Variant = "default" | "success" | "error" | "info";

interface ToastInput {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: Variant;
  /** 自定义持续时间（毫秒）。default 4000 / error 6000 */
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: string;
  open: boolean;
  duration: number;
}

interface ToastContextValue {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 5;

export function Toaster({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (input: ToastInput): string => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const variant = input.variant ?? "default";
      const duration =
        input.duration ?? (variant === "error" ? 6000 : 4000);
      setItems((prev) => {
        const next: ToastItem[] = [
          ...prev,
          { ...input, id, variant, duration, open: true },
        ];
        return next.length > MAX_TOASTS
          ? next.slice(next.length - MAX_TOASTS)
          : next;
      });
      return id;
    },
    []
  );

  const ctx = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={ctx}>
      <ToastProvider swipeDirection="right" duration={4000}>
        {children}
        {items.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            duration={t.duration}
            open={t.open}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
          >
            <div className="flex-1">
              {t.title && <ToastTitle>{t.title}</ToastTitle>}
              {t.description && (
                <ToastDescription>{t.description}</ToastDescription>
              )}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    // SSR 或 Provider 缺失时给出友好 fallback，避免页面崩溃
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.warn("[useToast] Toaster Provider 未挂载；toast 调用将被忽略。");
    }
    return {
      toast: (input) => {
        if (typeof window !== "undefined") {
          const message =
            `${input.variant ?? "default"}: ` +
            `${typeof input.title === "string" ? input.title : "(toast)"}`;
          // eslint-disable-next-line no-console
          console.log("[toast]", message, input.description ?? "");
        }
        return "noop";
      },
      dismiss: () => undefined,
    };
  }
  return ctx;
}