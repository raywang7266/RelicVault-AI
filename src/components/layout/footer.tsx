import { APP_NAME } from "@/lib/constants";
import { getServerTranslation } from "@/lib/i18n/server";

export function Footer() {
  const { t } = getServerTranslation();
  return (
    <footer className="border-t border-border py-6">
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME} · {t("footer.tagline")}
      </div>
    </footer>
  );
}
