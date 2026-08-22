"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import LanguageSwitcher from "@/lib/i18n/language-switcher";
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span aria-hidden>🏛️</span>
          <span>{APP_NAME}</span>
        </Link>

        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {isLoading ? (
            <span className="h-5 w-16 animate-pulse rounded bg-muted" />
          ) : user ? (
            <>
              <span
                className="hidden max-w-[12rem] truncate text-sm text-muted-foreground sm:inline"
                title={user.email ?? ""}
              >
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-60"
              >
                {loggingOut ? t("nav.loggingOut") : t("nav.logout")}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
