import { describe, it, expect } from "vitest";
import en from "@/i18n/messages/en.json";
import hi from "@/i18n/messages/hi.json";
import { formatINR } from "@/lib/utils/money";
import { formatIndianDate } from "@/lib/formatters";

describe("P0 Onboarding and Dashboard Localization", () => {
  it("has exact 1:1 key parity between en and hi for Onboarding namespace", () => {
    const enKeys = Object.keys(en.Onboarding).sort();
    const hiKeys = Object.keys(hi.Onboarding).sort();
    expect(enKeys).toEqual(hiKeys);
  });

  it("has exact 1:1 key parity between en and hi for Dashboard namespace", () => {
    const enKeys = Object.keys(en.Dashboard).sort();
    const hiKeys = Object.keys(hi.Dashboard).sort();
    expect(enKeys).toEqual(hiKeys);
  });

  it("formats integer paise into INR string correctly based on locale in money utility", () => {
    const paise = 1500050; // 15,000.50 Rupees
    const formattedEn = formatINR(paise, "en");
    const formattedHi = formatINR(paise, "hi");

    expect(formattedEn).toContain("15,000.50");
    expect(formattedHi).toMatch(/₹\s*(15,000\.50|१५,०००\.५०)/);
  });

  it("handles zero paise correctly across locales", () => {
    expect(formatINR(0, "en")).toContain("0");
    expect(formatINR(0, "hi")).toMatch(/₹\s*(0|०)/);
  });

  it("formats dates using Indian date conventions for English and Hindi", () => {
    const date = new Date("2026-11-18T00:00:00.000Z");
    const formattedEn = formatIndianDate(date, "en");
    const formattedHi = formatIndianDate(date, "hi");

    expect(formattedEn).toContain("2026");
    expect(formattedHi).toContain("2026");
  });

  it("supports auto-generated wedding title templates in Onboarding namespace", () => {
    const groom = "Aarav";
    const bride = "Meera";

    const enTitle = en.Onboarding.titlePatternCouple
      .replace("{groom}", groom)
      .replace("{bride}", bride);
    const hiTitle = hi.Onboarding.titlePatternCouple
      .replace("{groom}", groom)
      .replace("{bride}", bride);

    expect(enTitle).toBe("Aarav & Meera's Wedding");
    expect(hiTitle).toBe("Aarav और Meera की शादी");
  });
});
