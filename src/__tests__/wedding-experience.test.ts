import { describe, it, expect, vi } from "vitest";
import { parseYouTubeVideoId, buildYouTubeEmbedUrl } from "@/modules/website/utils/livestream";
import { createAlbumSchema, uploadIntentSchema, guestUploadIntentSchema, completeUploadSchema } from "@/modules/media/validation/media.validation";
import { submitGuestbookSchema, moderateGuestbookSchema } from "@/modules/guestbook/validation/guestbook.validation";
import { createEmergencyContactSchema } from "@/modules/emergency/validation/emergency.validation";
import { toPublicEmergencyContactDTO } from "@/modules/emergency/dto/emergency.dto";
import { IEmergencyContact } from "@/modules/emergency/models/emergency-contact.model";
import { toPublicMediaDTO } from "@/modules/media/dto/media.dto";
import { IMedia } from "@/modules/media/models/media.model";
import { Types } from "mongoose";

vi.mock("server-only", () => ({}));

vi.mock("@/modules/documents/services/storage.service", () => ({
  StorageService: {
    uploadUrl: vi.fn().mockResolvedValue("https://r2.storage.example.com/upload-intent-url"),
    verifyAndSeal: vi.fn().mockResolvedValue(true),
    accessUrl: vi.fn().mockResolvedValue("https://r2.storage.example.com/signed-access-url"),
    remove: vi.fn().mockResolvedValue(true),
  },
}));

describe("Wedding Experience — YouTube Livestream Helper", () => {
  it("should extract 11-character video ID from raw ID", () => {
    expect(parseYouTubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("should extract video ID from youtube.com/watch?v= link", () => {
    expect(parseYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("should extract video ID from youtu.be/ short link", () => {
    expect(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("should extract video ID from /embed/ link", () => {
    expect(parseYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("should extract video ID from /live/ link", () => {
    expect(parseYouTubeVideoId("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("should reject invalid inputs or arbitrary HTML/script injection attempts", () => {
    expect(parseYouTubeVideoId("<script>alert('xss')</script>")).toBeNull();
    expect(parseYouTubeVideoId("javascript:alert(1)")).toBeNull();
    expect(parseYouTubeVideoId("https://malicious.com/fake?v=123")).toBeNull();
    expect(parseYouTubeVideoId("short")).toBeNull();
  });

  it("should construct safe HTTPS embed URL", () => {
    expect(buildYouTubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0"
    );
  });
});

describe("Wedding Experience — DTO Privacy & Public Allowlist Rules", () => {
  it("should strip internal organiser notes from PublicEmergencyContactDTO", () => {
    const mockContact = {
      _id: new Types.ObjectId("64b8f0000000000000000001"),
      weddingId: new Types.ObjectId("64b8f0000000000000000002"),
      name: "Pandit Sharma",
      role: "Priest",
      phone: "+91 9876543210",
      email: "priest@example.com",
      priority: 1,
      notes: "PRIVATE ORGANISER NOTE: Requires cash payment on arrival",
      createdBy: new Types.ObjectId("64b8f0000000000000000003"),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IEmergencyContact;

    const dto = toPublicEmergencyContactDTO(mockContact);

    expect(dto.id).toBe("64b8f0000000000000000001");
    expect(dto.name).toBe("Pandit Sharma");
    expect(dto.role).toBe("Priest");
    expect(dto.phone).toBe("+91 9876543210");
    expect((dto as unknown as { notes?: string }).notes).toBeUndefined();
  });

  it("should omit objectKey and uploadedByUserId from PublicMediaDTO", () => {
    const mockMedia = {
      _id: new Types.ObjectId("64b8f0000000000000000010"),
      weddingId: new Types.ObjectId("64b8f0000000000000000002"),
      objectKey: "weddings/123/media/secret-key.jpg",
      originalFilename: "SangeetDance.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 2048000,
      mediaType: "IMAGE",
      visibility: "PUBLIC",
      status: "APPROVED",
      uploadedByType: "MEMBER",
      uploadedByUserId: new Types.ObjectId("64b8f0000000000000000003"),
      createdAt: new Date("2026-09-25T10:00:00Z"),
      updatedAt: new Date("2026-09-25T10:00:00Z"),
    } as unknown as IMedia;

    const dto = toPublicMediaDTO(mockMedia, "https://r2.storage.example.com/signed-url");

    expect(dto.id).toBe("64b8f0000000000000000010");
    expect(dto.originalFilename).toBe("SangeetDance.jpg");
    expect(dto.accessUrl).toBe("https://r2.storage.example.com/signed-url");
    expect((dto as unknown as { objectKey?: string }).objectKey).toBeUndefined();
    expect((dto as unknown as { uploadedByUserId?: string }).uploadedByUserId).toBeUndefined();
  });
});

describe("Wedding Experience — Zod Validation Schemas", () => {
  it("should validate Album creation schema", () => {
    const valid = createAlbumSchema.safeParse({
      name: "Sangeet Highlights",
      description: "Dance and music photos",
      visibility: "GUESTS",
    });
    expect(valid.success).toBe(true);

    const invalid = createAlbumSchema.safeParse({
      name: "",
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate Upload Intent schema", () => {
    const valid = uploadIntentSchema.safeParse({
      originalFilename: "photo.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 102400,
      mediaType: "IMAGE",
    });
    expect(valid.success).toBe(true);

    const invalid = uploadIntentSchema.safeParse({
      originalFilename: "photo.jpg",
      mimeType: "image/jpeg",
      sizeBytes: -100,
      mediaType: "INVALID",
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate Guest Upload Intent schema", () => {
    const valid = guestUploadIntentSchema.safeParse({
      originalFilename: "guest-video.mp4",
      mimeType: "video/mp4",
      sizeBytes: 5000000,
      mediaType: "VIDEO",
    });
    expect(valid.success).toBe(true);
  });

  it("should validate Complete Upload schema", () => {
    const valid = completeUploadSchema.safeParse({
      uploadKey: "uploads/temp/123/file.mp4",
      objectKey: "weddings/123/media/file.mp4",
      mimeType: "video/mp4",
      sizeBytes: 5000000,
    });
    expect(valid.success).toBe(true);
  });

  it("should validate Moderate Guestbook schema", () => {
    const valid = moderateGuestbookSchema.safeParse({
      status: "APPROVED",
    });
    expect(valid.success).toBe(true);
  });

  it("should enforce Guestbook wish submission rules (text for TEXT, mediaId for AUDIO/VIDEO)", () => {
    const validText = submitGuestbookSchema.safeParse({
      guestName: "Ramesh Sharma",
      type: "TEXT",
      text: "Wishing you a lifetime of love and happiness!",
    });
    expect(validText.success).toBe(true);

    const invalidText = submitGuestbookSchema.safeParse({
      guestName: "Ramesh Sharma",
      type: "TEXT",
      text: "",
    });
    expect(invalidText.success).toBe(false);

    const validVideo = submitGuestbookSchema.safeParse({
      guestName: "Priya Patel",
      type: "VIDEO",
      mediaId: "64b8f0000000000000000099",
    });
    expect(validVideo.success).toBe(true);

    const invalidVideo = submitGuestbookSchema.safeParse({
      guestName: "Priya Patel",
      type: "VIDEO",
    });
    expect(invalidVideo.success).toBe(false);
  });

  it("should validate Emergency Contact creation schema", () => {
    const valid = createEmergencyContactSchema.safeParse({
      name: "Dr. Vikram Seth",
      role: "Medical Lead / First Aid",
      phone: "+91 9998887770",
      priority: 2,
    });
    expect(valid.success).toBe(true);
  });
});

describe("Wedding Experience — P1 Security Regression Suite", () => {
  it("EXP-P1-01: should block guest access to PRIVATE media items", async () => {
    const { MediaService } = await import("@/modules/media/services/media.service");
    const { MediaRepository } = await import("@/modules/media/repositories/media.repository");
    const { vi } = await import("vitest");

    const mockPrivateMedia = {
      _id: new Types.ObjectId("64b8f0000000000000000050"),
      weddingId: new Types.ObjectId("64b8f0000000000000000002"),
      objectKey: "weddings/64b8f0000000000000000002/media/private-doc.pdf",
      originalFilename: "PrivateBudgetNotes.pdf",
      status: "APPROVED",
      visibility: "PRIVATE",
    } as unknown as IMedia;

    vi.spyOn(MediaRepository, "findById").mockResolvedValue(mockPrivateMedia);

    // Guest caller (allowPrivate: false) must be rejected with 403
    await expect(
      MediaService.getMediaAccessUrl("64b8f0000000000000000002", "64b8f0000000000000000050", { allowPrivate: false })
    ).rejects.toThrow("Private media items cannot be accessed by guests");

    // Member caller (default allowPrivate: true) is permitted
    const { StorageService } = await import("@/modules/documents/services/storage.service");
    vi.spyOn(StorageService, "accessUrl").mockResolvedValue("https://r2.storage.example.com/signed-private-url");

    const accessUrl = await MediaService.getMediaAccessUrl("64b8f0000000000000000002", "64b8f0000000000000000050");
    expect(accessUrl).toBe("https://r2.storage.example.com/signed-private-url");
  });

  it("EXP-P1-02: should reject cross-wedding upload key substitution in completeUpload", async () => {
    const { MediaService } = await import("@/modules/media/services/media.service");
    const { MediaRepository } = await import("@/modules/media/repositories/media.repository");
    const { vi } = await import("vitest");

    const mockPendingMedia = {
      _id: new Types.ObjectId("64b8f0000000000000000060"),
      weddingId: new Types.ObjectId("64b8f0000000000000000002"),
      objectKey: "weddings/64b8f0000000000000000002/media/photo.jpg",
      status: "PENDING_UPLOAD",
      uploadedByType: "GUEST",
    } as unknown as IMedia;

    vi.spyOn(MediaRepository, "findById").mockResolvedValue(mockPendingMedia);

    // Malicious caller attempting to supply uploadKey from a different wedding
    const invalidInput = {
      uploadKey: "uploads/temp/OTHER_WEDDING_ID/stolen-file.jpg",
      objectKey: "weddings/64b8f0000000000000000002/media/photo.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 102400,
    };

    await expect(
      MediaService.completeUpload("64b8f0000000000000000002", "64b8f0000000000000000060", invalidInput)
    ).rejects.toThrow("Invalid or cross-wedding upload key provided");
  });
});
