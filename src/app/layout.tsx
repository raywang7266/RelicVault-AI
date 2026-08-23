import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/header";
import { getServerUser } from "@/lib/auth/server";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_HTML_LANG,
  type Locale,
} from "@/lib/i18n/locales";
import { InteractionsProvider } from "@/lib/mock/interactions";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "RelicVault AI",
    template: "%s | RelicVault AI",
  },
  description:
    "A crowdsourced digital heritage and minor artifact museum powered by AI.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getServerUser();
  // 从 cookie 读取语言，作为 SSR 初始语言，保证水合一致
  const cookieLocale = cookies().get("rv_locale")?.value;
  const initialLocale: Locale = isLocale(cookieLocale)
    ? cookieLocale
    : DEFAULT_LOCALE;

  return (
    <html lang={LOCALE_HTML_LANG[initialLocale]} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <I18nProvider initialLocale={initialLocale}>
          <InteractionsProvider>
            <Toaster>
              <Navbar initialUser={user} />
              <main className="animate-fade-in">{children}</main>
            </Toaster>
          </InteractionsProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
