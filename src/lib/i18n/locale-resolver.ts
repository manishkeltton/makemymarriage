import { cookies, headers } from "next/headers";
import { defaultLocale, isValidLocale, LOCALE_COOKIE_NAME, type Locale } from "@/i18n/config";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";

/**
 * Resolves the effective UI locale based on precedence:
 * 1. Authenticated user's preferredLanguage (from User model via session)
 * 2. `mmm_locale` cookie
 * 3. `Accept-Language` request header
 * 4. Default fallback ("en")
 */
export async function getEffectiveLocale(): Promise<Locale> {
  try {
    // 1. Authenticated User preference
    const token = await getSessionToken();
    if (token) {
      const authResult = await AuthService.verifySession(token);
      if (authResult.success && authResult.user.preferredLanguage) {
        if (isValidLocale(authResult.user.preferredLanguage)) {
          return authResult.user.preferredLanguage;
        }
      }
    }

    // 2. Cookie preference
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
    if (isValidLocale(cookieLocale)) {
      return cookieLocale;
    }

    // 3. Accept-Language header fallback
    const headersList = await headers();
    const acceptLang = headersList.get("accept-language");
    if (acceptLang) {
      if (acceptLang.toLowerCase().includes("hi")) {
        return "hi";
      }
    }
  } catch (err) {
    console.error("[getEffectiveLocale] Error resolving locale:", err);
  }

  // 4. Default fallback
  return defaultLocale;
}

/**
 * Helper to map machine-readable API error codes to localized error messages.
 */
export function getLocalizedErrorMessage(
  code: string | undefined,
  t: (key: string) => string,
  fallbackMessage?: string
): string {
  if (!code) {
    return fallbackMessage || t("Errors.generic");
  }

  const codeMap: Record<string, string> = {
    INVALID_CREDENTIALS: "Errors.invalidCredentials",
    EMAIL_ALREADY_EXISTS: "Errors.emailAlreadyExists",
    AUTH_REQUIRED: "Errors.authRequired",
    SESSION_EXPIRED: "Errors.sessionExpired",
    ACCOUNT_SUSPENDED: "Errors.accountSuspended",
    FORBIDDEN_FIELD_UPDATE: "Errors.forbiddenFieldUpdate",
    VALIDATION_ERROR: "Errors.validationError",
    RESET_TOKEN_INVALID: "Errors.resetTokenInvalid",
    NOT_FOUND: "Errors.notFound",
    FORBIDDEN: "Errors.forbidden",
    INTERNAL_ERROR: "Errors.internalError",
  };

  const key = codeMap[code];
  if (key) {
    try {
      return t(key);
    } catch {
      // Fallback if key missing
    }
  }

  return fallbackMessage || t("Errors.generic");
}
