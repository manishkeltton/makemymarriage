import { describe, expect, it } from "vitest";
import { moneyPaiseSchema, objectIdSchema } from "./common.schemas";

describe("shared boundary schemas", () => {
  it("accepts only 24-character hexadecimal IDs", () => {
    expect(objectIdSchema.safeParse("507f1f77bcf86cd799439011").success).toBe(
      true,
    );
    expect(objectIdSchema.safeParse("not-an-id").success).toBe(false);
  });
  it("rejects fractional, negative and unsafe paise amounts", () => {
    expect(moneyPaiseSchema.parse(2500000)).toBe(2500000);
    for (const amount of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, Infinity]) {
      expect(moneyPaiseSchema.safeParse(amount).success).toBe(false);
    }
  });
});
