import { describe, expect, it } from "vitest";
import {
  CLOUDINARY_IMAGE_MAX_BYTES,
  CLOUDINARY_VIDEO_MAX_BYTES,
  uploadPolicy,
} from "./upload-policy";

describe("Cloudinary upload policy", () => {
  it("maps supported image, video, audio, and PDF MIME types to Cloudinary resources", () => {
    expect(uploadPolicy("image/jpeg", 1)).toMatchObject({ resourceType: "image", format: "jpg" });
    expect(uploadPolicy("video/mp4", 1)).toMatchObject({ resourceType: "video", format: "mp4" });
    expect(uploadPolicy("audio/mpeg", 1)).toMatchObject({ resourceType: "video", format: "mp3" });
    expect(uploadPolicy("application/pdf", 1)).toMatchObject({ resourceType: "raw", format: "pdf" });
  });

  it("rejects unsupported types and files over the provider limits", () => {
    expect(() => uploadPolicy("image/svg+xml", 100)).toThrow("Unsupported file type");
    expect(() => uploadPolicy("image/jpeg", CLOUDINARY_IMAGE_MAX_BYTES + 1)).toThrow("10 MB");
    expect(() => uploadPolicy("video/mp4", CLOUDINARY_VIDEO_MAX_BYTES + 1)).toThrow("100 MB");
  });
});

