import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getAppEnv, getDatabaseEnv, getLoggingEnv } from "./env";

describe("environment validation", () => {
  it("requires an explicit production origin without requiring it for logging", () => {
    expect(() => getAppEnv({ NODE_ENV: "production" })).toThrow("APP_ORIGIN");
    expect(getLoggingEnv({ NODE_ENV: "production" }).LOG_LEVEL).toBe("info");
    expect(
      getAppEnv({ NODE_ENV: "production", APP_ORIGIN: "https://example.com/" })
        .APP_ORIGIN,
    ).toBe("https://example.com");
  });
  it.each([
    "ftp://example.com",
    "javascript:alert(1)",
    "https://user:secret@example.com",
    "https://example.com/path",
    "https://example.com?token=secret",
    "https://example.com/#secret",
    "",
  ])("rejects values that are not plain HTTP(S) origins", (origin) => {
    expect(() => getAppEnv({ APP_ORIGIN: origin })).toThrow("APP_ORIGIN");
  });
  it("allows the application shell without database credentials", () => {
    expect(getAppEnv({}).APP_ORIGIN).toBe("http://localhost:3000");
  });
  it("requires database settings only when requested", () => {
    expect(() => getDatabaseEnv({})).toThrow("MONGODB_URI");
    expect(
      getDatabaseEnv({
        MONGODB_URI: "mongodb://localhost:27017",
        MONGODB_DB_NAME: "test",
      }).MONGODB_DB_NAME,
    ).toBe("test");
  });
  it("does not expose invalid secret values in errors", () => {
    const secret = "private-password-in-invalid-uri";
    try {
      getDatabaseEnv({ MONGODB_URI: secret, MONGODB_DB_NAME: "test" });
      expect.fail("Expected validation failure");
    } catch (error) {
      expect(String(error)).toContain("MONGODB_URI");
      expect(String(error)).not.toContain(secret);
    }
  });
  it("rejects invalid log levels and origins", () => {
    expect(() =>
      getAppEnv({ LOG_LEVEL: "verbose", APP_ORIGIN: "invalid" }),
    ).toThrow();
  });
});
