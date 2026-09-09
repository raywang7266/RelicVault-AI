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
import { AssistantProvider } from "@/components/assistant/assistant-context";
import { FloatingAssistant } from "@/components/assistant/floating-assistant";

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
      <head>
        {/* 高级感字体：拉丁文 Cormorant Garamond（展示衬线）+ 中文思源宋体/黑体。
            通过运行时 <link> 加载，不依赖构建期网络，失败时优雅回落到系统字体。 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* 首帧前应用用户保存的字号与主题偏好，避免进入页面后文字突然缩放 /
            整屏闪白闪黑。主题：未手动选择时跟随系统 prefers-color-scheme。 */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var s=localStorage.getItem('rv_font_scale');if(s){document.documentElement.style.setProperty('--font-scale',s);}var th=localStorage.getItem('rv_theme');var dark=th?th==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(dark){document.documentElement.classList.add('dark');}}catch(e){}})();",
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AssistantProvider>
          <I18nProvider initialLocale={initialLocale}>
            <InteractionsProvider>
              <Toaster>
                <Navbar initialUser={user} />
                <main className="animate-fade-in">{children}</main>
              </Toaster>
              <FloatingAssistant />
            </InteractionsProvider>
          </I18nProvider>
        </AssistantProvider>
      </body>
    </html>
  );
}
