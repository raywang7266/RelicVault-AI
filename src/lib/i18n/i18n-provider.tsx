"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE,
  translate,
  type Locale,
} from "./locales";

const COOKIE_NAME = "rv_locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * 多语言 Provider。
 * - 初始语言由服务端通过 cookie 注入（initialLocale），保证 SSR 与水合一致；
 * - 切换语言时写入 cookie + localStorage，并 router.refresh() 让服务端组件重渲染。
 * 注意：用户上传的文物内容（标题/描述/标签/评论等）一律不在此翻译。
 */
export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale ?? DEFAULT_LOCALE
  );

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      // cookie 为权威来源：服务端组件（页脚、认证页、详情页兜底）读取它
      document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000; samesite=lax`;
      try {
        localStorage.setItem(COOKIE_NAME, next);
      } catch {
        /* 隐私模式下可能抛错，忽略即可 */
      }
      // 触发服务端组件用新 cookie 重新渲染（含 getServerTranslation 的页面）
      router.refresh();
    },
    [router]
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within an <I18nProvider>");
  }
  return ctx;
}

/** 仅取翻译函数的便捷 hook */
export function useT() {
  return useTranslation().t;
}
