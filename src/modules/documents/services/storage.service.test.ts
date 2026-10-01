import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { StorageService } from "./storage.service";

describe("Cloudinary StorageService signing", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
    process.env.CLOUDINARY_API_KEY = "test-key";
    process.env.CLOUDINARY_API_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env = { ...original };
    vi.restoreAllMocks();
  });

  it("creates an authenticated, non-overwritable signed browser upload", async () => {
    const key = StorageService.objectKey("weddings/abc/media/photo.jpg", "image/jpeg");
    const intent = await StorageService.uploadUrl(key, "image/jpeg", 1024);

    expect(intent.uploadUrl).toBe("https://api.cloudinary.com/v1_1/test-cloud/image/upload");
    expect(intent.uploadMethod).toBe("POST");
    expect(intent.uploadFields).toMatchObject({
      api_key: "test-key",
      type: "authenticated",
      overwrite: "false",
    });
    expect(intent.uploadFields.signature).toMatch(/^[a-f0-9]{40}$/);
  });

  it("creates a short-lived signed inline access URL", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_800_000_000_000);
    const key = StorageService.objectKey("weddings/abc/media/video.mp4", "video/mp4");
    const accessUrl = new URL(await StorageService.accessUrl(key));

    expect(accessUrl.pathname).toBe("/v1_1/test-cloud/video/download");
    expect(accessUrl.searchParams.get("type")).toBe("authenticated");
    expect(accessUrl.searchParams.get("attachment")).toBe("false");
    expect(accessUrl.searchParams.get("timestamp")).toBe("1800000000");
    expect(accessUrl.searchParams.get("expires_at")).toBe("1800000060");
    expect(accessUrl.searchParams.get("signature")).toMatch(/^[a-f0-9]{40}$/);
  });
});
