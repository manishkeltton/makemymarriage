import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AppError } from "@/shared/errors/app-error";
vi.mock("server-only", () => ({}));
import { withRequest } from "./with-request";
import { success } from "./responses";
import { log, requestId } from "@/shared/logging/logger";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("request correlation and safe logging", () => {
  it.each([
    [
      new AppError("FORBIDDEN", "Access denied", 403),
      "FORBIDDEN",
      "application",
    ],
    [z.string().safeParse(42).error, "VALIDATION_ERROR", "validation"],
    [new TypeError("password=secret"), "INTERNAL_ERROR", "type"],
    [{ password: "secret" }, "INTERNAL_ERROR", "non-error"],
  ])(
    "uses matching response/log codes and safe diagnostics",
    async (failure, code, kind) => {
      vi.stubEnv("LOG_LEVEL", "info");
      const info = vi.spyOn(console, "log").mockImplementation(() => {});
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const response = await withRequest(
        new Request("https://example.com"),
        "/example",
        async () => {
          throw failure;
        },
      );
      const body = await response.json();
      const entries = [...info.mock.calls, ...error.mock.calls];
      expect(entries).toHaveLength(1);
      const record = JSON.parse(entries[0][0]);
      expect(body.error.code).toBe(code);
      expect(record.errorCode).toBe(body.error.code);
      expect(record.errorKind).toBe(kind);
      expect(record.requestId).toBe(body.error.requestId);
      expect(JSON.stringify(entries)).not.toContain("secret");
    },
  );
  it("rejects an invalid logging setting rather than silently defaulting", () => {
    vi.stubEnv("LOG_LEVEL", "invalid-secret");
    const output = vi.spyOn(console, "log").mockImplementation(() => {});
    expect(() => log("info", "test")).toThrow(
      "Invalid environment variables: LOG_LEVEL",
    );
    expect(output).not.toHaveBeenCalled();
  });
  it("respects the validated minimum log level", () => {
    vi.stubEnv("LOG_LEVEL", "error");
    const output = vi.spyOn(console, "log").mockImplementation(() => {});
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    log("info", "hidden");
    log("error", "visible");
    expect(output).not.toHaveBeenCalled();
    expect(errors).toHaveBeenCalledOnce();
  });
  it("rejects oversized and unsafe caller IDs", () => {
    expect(requestId("req_good-1")).toBe("req_good-1");
    for (const value of [null, "x".repeat(65), "bad\nheader", ""]) {
      expect(requestId(value)).toMatch(/^[a-f0-9-]{36}$/);
    }
  });
  it("echoes IDs and logs route templates without raw tokens", async () => {
    vi.stubEnv("LOG_LEVEL", "info");
    const output = vi.spyOn(console, "log").mockImplementation(() => {});
    const request = new Request(
      "https://example.com/guest-access/secret-token",
      { headers: { "X-Request-Id": "req_test" } },
    );
    const response = await withRequest(
      request,
      "/guest-access/:token",
      async (context) => success({ id: context.requestId }),
    );
    expect(response.headers.get("X-Request-Id")).toBe("req_test");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(output).toHaveBeenCalledOnce();
    expect(output.mock.calls[0][0]).not.toContain("secret-token");
  });
  it("returns correlated sanitized errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await withRequest(
      new Request("https://example.com"),
      "/example",
      async () => {
        throw new Error("password=secret");
      },
    );
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.requestId).toBe(response.headers.get("X-Request-Id"));
    expect(JSON.stringify(body)).not.toContain("secret");
  });
  it("drops unknown runtime log properties", () => {
    vi.stubEnv("LOG_LEVEL", "info");
    const output = vi.spyOn(console, "log").mockImplementation(() => {});
    const fields = { requestId: "req_1", password: "secret", cookie: "secret" };
    log("info", "test", fields);
    expect(output.mock.calls[0][0]).not.toContain("secret");
  });
});
