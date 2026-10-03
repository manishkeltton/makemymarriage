import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "./config";
import { getEffectiveLocale } from "@/lib/i18n/locale-resolver";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  let locale: Locale;
  if (requested && locales.includes(requested as Locale)) {
    locale = requested as Locale;
  } else {
    locale = await getEffectiveLocale();
  }

  if (!locales.includes(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
