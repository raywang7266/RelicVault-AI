import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  isLocale,
  translate,
  type Locale,
} from "./locales";

/**
 * 服务端翻译辅助：从 cookie 读取当前语言。
 * 供页脚、认证页、详情页等「服务端组件」渲染结构文案时使用。
 * 注意：必须在服务端组件中调用（内部使用 next/headers 的 cookies()）。
 */
export function getServerLocale(): Locale {
  const value = cookies().get("rv_locale")?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getServerTranslation() {
  const locale = getServerLocale();
  return {
    locale,
    t: (key: string, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
  };
}
