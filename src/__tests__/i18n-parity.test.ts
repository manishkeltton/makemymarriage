import { describe, it, expect } from "vitest";
import en from "../i18n/messages/en.json";
import hi from "../i18n/messages/hi.json";

function extractPlaceholders(text: string): string[] {
  const matches = text.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1, -1).trim()).sort();
}

function checkDeepParity(
  objEn: Record<string, unknown>,
  objHi: Record<string, unknown>,
  path: string = ""
) {
  const enKeys = Object.keys(objEn).sort();
  const hiKeys = Object.keys(objHi).sort();

  expect(hiKeys, `Key mismatch at path: "${path}"`).toEqual(enKeys);

  for (const key of enKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const valEn = objEn[key];
    const valHi = objHi[key];

    expect(typeof valHi, `Type mismatch at path "${currentPath}"`).toBe(typeof valEn);

    if (typeof valEn === "object" && valEn !== null && typeof valHi === "object" && valHi !== null) {
      checkDeepParity(valEn as Record<string, unknown>, valHi as Record<string, unknown>, currentPath);
    } else if (typeof valEn === "string" && typeof valHi === "string") {
      expect(valEn.trim().length, `Empty English value at "${currentPath}"`).toBeGreaterThan(0);
      expect(valHi.trim().length, `Empty Hindi value at "${currentPath}"`).toBeGreaterThan(0);

      const paramsEn = extractPlaceholders(valEn);
      const paramsHi = extractPlaceholders(valHi);
      expect(paramsHi, `Interpolation placeholder mismatch at "${currentPath}"`).toEqual(paramsEn);
    }
  }
}

describe("i18n Dictionary Recursive Parity Tests", () => {
  it("en.json and hi.json should have 1:1 key parity, non-empty strings, and identical interpolation placeholders", () => {
    checkDeepParity(
      en as unknown as Record<string, unknown>,
      hi as unknown as Record<string, unknown>
    );
  });
});
