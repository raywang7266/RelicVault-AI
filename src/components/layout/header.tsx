"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { NotificationBell } from "@/components/social/notification-bell";
import { useAssistant } from "@/components/assistant/assistant-context";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import LanguageSwitcher from "@/lib/i18n/language-switcher";
import FontSizeControl from "@/components/a11y/font-size-control";
import ThemeToggle from "@/components/a11y/theme-toggle";
import type { SessionUser } from "@/lib/auth/types";

const NAV_ITEMS = [
  { href: "/artifacts/new", key: "nav.upload" },
  { href: "/explore", key: "nav.explore" },
  { href: "/profile", key: "nav.profile" },
];

// 这些路由不展示全局导航栏（登录/注册等认证页、回调页）。
const HIDDEN_PATHS = ["/login", "/register", "/callback"];

export function Navbar({ initialUser }: { initialUser?: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useUser(initialUser);
  const { t } = useTranslation();
  const { mode: assistantMode, summon: summonAssistant } = useAssistant();
  const [loggingOut, setLoggingOut] = useState(false);

  // 路由切换时复位退出态：避免 router.refresh() 软导航场景下
  //「退出中」状态残留导致按钮卡死、无法点击，直到切页才恢复。
  // 注意：此 hook 必须放在任何条件 return 之前，否则会触发
  // "Rendered more hooks than during the previous render"。
  useEffect(() => {
    setLoggingOut(false);
  }, [pathname]);

  if (HIDDEN_PATHS.includes(pathname)) {
    return null;
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // 即使登出接口失败，也强制回登录页
    } finally {
      // 无论成功与否都复位并跳转；若跳转被拦截，按钮也能再次点击
      setLoggingOut(false);
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border-soft)] bg-[var(--paper)] backdrop-blur-md supports-[backdrop-filter]:bg-[var(--paper)] shadow-[0_1px_0_rgba(140,109,70,0.10),0_8px_30px_-18px_rgba(92,72,49,0.45)]">
      {/* 顶部一缕金色细线，强化品牌质感 */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          {/* 青铜渐变 monogram 徽标 */}
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gold-2)] to-[var(--bronze)] font-display text-lg font-semibold text-white shadow-[0_3px_10px_-3px_rgba(140,109,70,0.65)] ring-1 ring-inset ring-white/20 transition-transform duration-300 group-hover:scale-105">
            R
          </span>
          <span className="font-display text-[calc(20px*var(--font-scale))] font-semibold tracking-tight text-[var(--ink)]">
            {APP_NAME}
          </span>
        </Link>

        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  data-active={active}
                  className={cn(
                    "nav-link-underline rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--chip-2)] text-[var(--bronze-ink)]"
                      : "text-[var(--muted)] hover:bg-[var(--chip)] hover:text-[var(--ink)]"
                  )}
                >
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="rv-controls">
            <ThemeToggle />
            <FontSizeControl />
            <LanguageSwitcher />
            {assistantMode === "hidden" && (
              <button
                type="button"
                className="rv-ctrl"
                onClick={summonAssistant}
                aria-label={t("assistant.summon")}
                title={t("assistant.summon")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-4 4v-4H5.5C4.67 15 4 14.33 4 13.5v-8Z"
                    fill="currentColor"
                  />
                  <circle cx="9" cy="9.2" r="1.1" fill="var(--paper)" />
                  <circle cx="12.5" cy="9.2" r="1.1" fill="var(--paper)" />
                  <circle cx="16" cy="9.2" r="1.1" fill="var(--paper)" />
                </svg>
              </button>
            )}
          </div>
          {user && <NotificationBell />}
          {isLoading && !user ? (
            <span className="h-5 w-16 animate-pulse rounded bg-muted" />
          ) : user ? (
            <>
              <span
                className="hidden max-w-[12rem] truncate text-sm text-[var(--muted)] sm:inline"
                title={user.email ?? ""}
              >
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-full border border-[var(--border)] px-3.5 py-1.5 text-sm font-medium text-[var(--bronze-ink)] transition-colors hover:border-[var(--gold)] hover:bg-[var(--chip)] disabled:opacity-60"
              >
                {loggingOut ? t("nav.loggingOut") : t("nav.logout")}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-gradient-to-r from-[var(--gold-2)] to-[var(--bronze)] px-4 py-1.5 text-sm font-semibold text-white shadow-[0_3px_12px_-3px_rgba(140,109,70,0.7)] transition-all duration-300 hover:shadow-[0_6px_18px_-4px_rgba(140,109,70,0.8)] hover:brightness-105"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
