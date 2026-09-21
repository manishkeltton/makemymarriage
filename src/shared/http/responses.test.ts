import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError } from "@/shared/errors/app-error";
import { errorResponse, normalizeError, noContent, success } from "./responses";

describe("REST envelopes", () => {
  it("preserves collection metadata and creation status", async () => {
    const response = success([{ id: "1" }], 201, {
      nextCursor: null,
      hasMore: false,
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      success: true,
      data: [{ id: "1" }],
      meta: { nextCursor: null, hasMore: false },
    });
  });
  it("returns a truly empty 204 response", async () => {
    expect(noContent().status).toBe(204);
    expect(await noContent().text()).toBe("");
  });
  it("exposes only intentional application errors", async () => {
    const response = errorResponse(
      new AppError("FORBIDDEN", "Access denied", 403),
      "req_1",
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Access denied",
        details: null,
        requestId: "req_1",
      },
    });
  });
  it("redacts unexpected exception details", async () => {
    const response = errorResponse(
      normalizeError(new Error("mongodb://admin:secret@host")),
      "req_2",
    );
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("secret");
  });
  it("maps validation errors to fields without including input", async () => {
    const result = z
      .object({ name: z.string().min(2) })
      .safeParse({ name: "" });
    if (result.success) throw new Error("Expected invalid fixture");
    const response = errorResponse(normalizeError(result.error), "req_3");
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details.fields.name).toHaveLength(1);
  });
});
