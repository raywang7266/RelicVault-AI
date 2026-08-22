import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { APP_NAME } from "@/lib/constants";
import { getServerTranslation } from "@/lib/i18n/server";
import LanguageSwitcher from "@/lib/i18n/language-switcher";

export default function RegisterPage() {
  const { t } = getServerTranslation();
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-lg font-bold">
            🏛️ {APP_NAME}
          </Link>
          <h1 className="mt-3 text-xl font-semibold">{t("register.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("register.subtitle")}
          </p>
        </div>
        <Suspense
          fallback={
            <div className="text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          }
        >
          <AuthForm mode="register" />
        </Suspense>
      </div>
    </div>
  );
}
