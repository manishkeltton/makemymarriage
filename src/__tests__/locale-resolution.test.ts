if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/MakeMyMarriageDB";
}
import { describe, it, expect, vi } from "vitest";
import { formatINR, formatIndianDate, formatIndianNumber } from "../lib/formatters";
import { getLocalizedErrorMessage } from "../lib/i18n/locale-resolver";

describe("Locale Resolution, Error Mapping & Indian Formatters Tests", () => {
  it("formatINR should format Indian currency with Indian numbering system", () => {
    const enFormatted = formatINR(150000, "en");
    expect(enFormatted).toContain("1,50,000");

    const zeroFormatted = formatINR(0, "en");
    expect(zeroFormatted).toContain("0");

    const invalidFormatted = formatINR(NaN, "en");
    expect(invalidFormatted).toBe("₹0");
  });

  it("formatIndianDate should format dates in English and Hindi locale conventions", () => {
    const testDate = new Date(2026, 10, 18); // 18 Nov 2026
    const enDate = formatIndianDate(testDate, "en");
    expect(enDate).toContain("Nov");
    expect(enDate).toContain("2026");

    const hiDate = formatIndianDate(testDate, "hi");
    expect(hiDate).toBeTruthy();
    expect(hiDate).toContain("2026");
  });

  it("formatIndianNumber should format numbers with Indian grouping", () => {
    const enNum = formatIndianNumber(100000, "en");
    expect(enNum).toContain("1,00,000");
  });

  it("getLocalizedErrorMessage should map machine-readable codes to translation keys", () => {
    const mockT = vi.fn((key: string) => `Localized: ${key}`);

    expect(getLocalizedErrorMessage("INVALID_CREDENTIALS", mockT)).toBe("Localized: Errors.invalidCredentials");
    expect(getLocalizedErrorMessage("AUTH_REQUIRED", mockT)).toBe("Localized: Errors.authRequired");
    expect(getLocalizedErrorMessage("ACCOUNT_SUSPENDED", mockT)).toBe("Localized: Errors.accountSuspended");
    expect(getLocalizedErrorMessage("FORBIDDEN_FIELD_UPDATE", mockT)).toBe("Localized: Errors.forbiddenFieldUpdate");
    expect(getLocalizedErrorMessage("UNKNOWN_CODE", mockT, "Fallback")).toBe("Fallback");
  });
});
