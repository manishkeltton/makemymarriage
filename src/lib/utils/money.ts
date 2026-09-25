/**
 * Safe monetary utility functions for INR (Indian Rupee) parsing and formatting.
 * All monetary amounts are stored and calculated internally as integer paise (1 Rupee = 100 Paise).
 */

/**
 * Converts a rupee amount (number or string representation) into integer paise without floating-point precision loss.
 * Example: 25000.50 -> 2500050, "1500" -> 150000
 */
export function rupeesToPaise(rupees: number | string): number {
  if (rupees === undefined || rupees === null) return 0;
  const str = String(rupees).trim();
  if (!str || isNaN(Number(str))) return 0;

  // Handle negative sign if any
  const isNegative = str.startsWith("-");
  const cleanStr = isNegative ? str.slice(1) : str;

  const parts = cleanStr.split(".");
  const whole = parseInt(parts[0], 10) || 0;
  let fracStr = (parts[1] || "").slice(0, 2);
  while (fracStr.length < 2) {
    fracStr += "0";
  }
  const frac = parseInt(fracStr, 10) || 0;

  const totalPaise = whole * 100 + frac;
  return isNegative ? -totalPaise : totalPaise;
}

/**
 * Converts integer paise into rupee number representation.
 * Example: 2500050 -> 25000.5
 */
export function paiseToRupees(paise: number): number {
  if (!paise || isNaN(paise)) return 0;
  return Math.round(paise) / 100;
}

/**
 * Formats integer paise into a human-readable Indian Rupee string (en-IN locale).
 * Example: 2500050 -> "₹25,000.50"
 */
export function formatINR(paise: number): string {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(rupees);
}

/**
 * Validates whether a value is a valid non-negative integer paise.
 */
export function isValidPaiseAmount(paise: unknown): paise is number {
  return typeof paise === "number" && Number.isInteger(paise) && paise >= 0 && Number.isSafeInteger(paise);
}

/**
 * Validates whether a value is a valid positive integer paise (> 0).
 */
export function isPositivePaiseAmount(paise: unknown): paise is number {
  return typeof paise === "number" && Number.isInteger(paise) && paise > 0 && Number.isSafeInteger(paise);
}

/**
 * Helper to safely extract integer paise from optional rupees (number/string) or paise input.
 */
export function parseAmountToPaise(
  rupees?: number | string | null,
  paise?: number | null
): number {
  if (paise !== undefined && paise !== null) {
    return Math.round(Number(paise));
  }
  if (rupees !== undefined && rupees !== null && rupees !== "") {
    return rupeesToPaise(rupees);
  }
  return 0;
}
