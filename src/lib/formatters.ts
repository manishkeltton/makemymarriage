import { type Locale } from "@/i18n/config";

/**
 * Formats an amount in Indian Rupees (INR) using Indian numbering system (e.g. ₹1,50,000).
 * Preserves exact numerical inputs and integer calculations.
 */
export function formatINR(amount: number, locale: Locale | string = "en"): string {
  if (isNaN(amount) || !isFinite(amount)) {
    return locale === "hi" ? "₹०" : "₹0";
  }

  const tag = locale === "hi" ? "hi-IN" : "en-IN";
  try {
    return new Intl.NumberFormat(tag, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    // Fallback if Intl fails
    const formatted = Math.round(amount).toLocaleString("en-IN");
    return `₹${formatted}`;
  }
}

/**
 * Formats a date using Indian date formatting conventions (e.g. 18 Nov 2026 / 18 नवंबर 2026).
 * Preserves underlying instant / UTC timestamp.
 */
export function formatIndianDate(
  dateInput: Date | string | number,
  locale: Locale | string = "en",
  options?: Intl.DateTimeFormatOptions
): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  if (isNaN(date.getTime())) {
    return "";
  }

  const tag = locale === "hi" ? "hi-IN" : "en-IN";
  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  try {
    return new Intl.DateTimeFormat(tag, defaultOptions).format(date);
  } catch {
    return date.toLocaleDateString("en-IN", defaultOptions);
  }
}

/**
 * Formats a number using Indian grouping (e.g. 1,00,000).
 */
export function formatIndianNumber(num: number, locale: Locale | string = "en"): string {
  if (isNaN(num) || !isFinite(num)) {
    return "0";
  }

  const tag = locale === "hi" ? "hi-IN" : "en-IN";
  try {
    return new Intl.NumberFormat(tag).format(num);
  } catch {
    return num.toLocaleString("en-IN");
  }
}
