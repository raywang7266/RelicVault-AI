import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { getServerTranslation } from "@/lib/i18n/server";

export function Footer() {
  const { t } = getServerTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-[var(--border-soft)] bg-[var(--paper-2)]">
      {/* 顶部金色细线 */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* 品牌 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gold-2)] to-[var(--bronze)] font-display text-lg font-semibold text-white shadow-[0_3px_10px_-3px_rgba(140,109,70,0.65)] ring-1 ring-inset ring-white/20">
                R
              </span>
              <span className="font-display text-[calc(20px*var(--font-scale))] font-semibold tracking-tight text-[var(--ink)]">
                {APP_NAME}
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[var(--muted)]">
              {t("footer.tagline")}
            </p>
          </div>

          {/* 探索 */}
          <div className="space-y-3">
            <p className="eyebrow">{t("footer.explore")}</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/explore"
                  className="text-[var(--bronze-ink)] transition-colors hover:text-[var(--gold)]"
                >
                  {t("nav.explore")}
                </Link>
              </li>
              <li>
                <Link
                  href="/artifacts/new"
                  className="text-[var(--bronze-ink)] transition-colors hover:text-[var(--gold)]"
                >
                  {t("nav.upload")}
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="text-[var(--bronze-ink)] transition-colors hover:text-[var(--gold)]"
                >
                  {t("nav.profile")}
                </Link>
              </li>
            </ul>
          </div>

          {/* 关于 */}
          <div className="space-y-3">
            <p className="eyebrow">{t("footer.about")}</p>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              {t("footer.aboutText")}
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-6 text-xs text-[var(--muted-2)] sm:flex-row">
          <span>
            © {year} {APP_NAME}
          </span>
          <span className="tracking-wide">{t("footer.tagline")}</span>
        </div>
      </div>
    </footer>
  );
}
