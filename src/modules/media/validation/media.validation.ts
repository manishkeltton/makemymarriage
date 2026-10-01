import { z } from "zod";
import { uploadPolicy } from "@/shared/storage/upload-policy";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createAlbumSchema = z.object({
  name: z.string().min(1, "Album name is required").max(100, "Album name is too long").trim(),
  description: z.string().max(500, "Description is too long").optional(),
  eventId: z.string().regex(objectIdRegex, "Invalid event ID").optional().or(z.literal("")),
  visibility: z.enum(["GUESTS", "PUBLIC", "PRIVATE"]).default("GUESTS"),
});

export const updateAlbumSchema = createAlbumSchema.partial();

function validateUploadIntent(
  value: { mimeType: string; sizeBytes: number; mediaType: string },
  context: z.RefinementCtx
) {
  try {
    uploadPolicy(value.mimeType, value.sizeBytes);
  } catch (error) {
    context.addIssue({
      code: "custom",
      path: ["mimeType"],
      message: error instanceof Error ? error.message : "Invalid upload",
    });
  }
  const expected = value.mimeType.startsWith("image/")
    ? "IMAGE"
    : value.mimeType.startsWith("video/")
      ? "VIDEO"
      : value.mimeType.startsWith("audio/")
        ? "AUDIO"
        : value.mimeType === "application/pdf"
          ? "DOCUMENT"
          : null;
  if (expected !== value.mediaType) {
    context.addIssue({ code: "custom", path: ["mediaType"], message: "Media type does not match the file" });
  }
}

export const uploadIntentSchema = z.object({
  originalFilename: z.string().trim().min(1, "Original filename is required").max(255),
  mimeType: z.string().min(1, "MIME type is required").trim(),
  sizeBytes: z.number().int().positive("File size must be greater than 0"),
  mediaType: z.enum(["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"]),
  albumId: z.string().regex(objectIdRegex, "Invalid album ID").optional().or(z.literal("")),
  visibility: z.enum(["PUBLIC", "RESTRICTED", "PRIVATE"]).optional(),
}).superRefine(validateUploadIntent);

export const guestUploadIntentSchema = z.object({
  originalFilename: z.string().trim().min(1, "Original filename is required").max(255),
  mimeType: z.string().min(1, "MIME type is required").trim(),
  sizeBytes: z.number().int().positive("File size must be greater than 0"),
  mediaType: z.enum(["IMAGE", "VIDEO", "AUDIO"]),
  albumId: z.string().regex(objectIdRegex, "Invalid album ID").optional().or(z.literal("")),
}).superRefine(validateUploadIntent);

export const completeUploadSchema = z.object({
  uploadKey: z.string().min(1, "Upload key is required"),
  objectKey: z.string().min(1, "Object key is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  sizeBytes: z.number().int().positive("File size must be positive"),
});

export const mediaModerationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
export type UploadIntentInput = z.infer<typeof uploadIntentSchema>;
export type GuestUploadIntentInput = z.infer<typeof guestUploadIntentSchema>;
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;
export type MediaModerationInput = z.infer<typeof mediaModerationSchema>;
