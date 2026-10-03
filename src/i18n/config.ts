export const locales = ["en", "hi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE_NAME = "mmm_locale";

export function isValidLocale(locale: unknown): locale is Locale {
  return typeof locale === "string" && (locales as readonly string[]).includes(locale);
}
