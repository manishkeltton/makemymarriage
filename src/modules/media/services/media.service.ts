import { Types } from "mongoose";
import { randomUUID } from "crypto";
import { MediaRepository, AlbumRepository, ListMediaFilters } from "../repositories/media.repository";
export type { ListMediaFilters };
import { IMedia, MediaStatus, MediaVisibility, UploadedByType } from "../models/media.model";
import { MediaDTO, PublicMediaDTO, toMediaDTO, toPublicMediaDTO } from "../dto/media.dto";
import { UploadIntentInput, GuestUploadIntentInput, CompleteUploadInput } from "../validation/media.validation";
import { StorageService } from "@/modules/documents/services/storage.service";
import { AppError } from "@/shared/errors/app-error";

export class MediaService {
  static async createUploadIntent(
    weddingId: string,
    uploader: { type: UploadedByType; userId?: string; householdId?: string },
    input: UploadIntentInput | GuestUploadIntentInput
  ): Promise<{ media: MediaDTO; uploadUrl: string; uploadKey: string }> {
    const wId = new Types.ObjectId(weddingId);

    if (input.albumId) {
      const album = await AlbumRepository.findById(input.albumId);
      if (!album || album.weddingId.toString() !== weddingId) {
        throw new AppError("RESOURCE_NOT_FOUND", "Album not found in this wedding", 404);
      }
    }

    const uuid = randomUUID();
    const cleanFilename = input.originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uploadKey = `uploads/temp/${weddingId}/${uuid}-${cleanFilename}`;
    const objectKey = `weddings/${weddingId}/media/${uuid}-${cleanFilename}`;

    // Get presigned upload URL from R2
    const uploadUrl = await StorageService.uploadUrl(uploadKey, input.mimeType, input.sizeBytes);

    const isMember = uploader.type === "MEMBER";
    const initialStatus: MediaStatus = "PENDING_UPLOAD";
    const visibility: MediaVisibility = (input as UploadIntentInput).visibility || (isMember ? "PUBLIC" : "PUBLIC");

    const media = await MediaRepository.create({
      weddingId: wId,
      albumId: input.albumId ? new Types.ObjectId(input.albumId) : undefined,
      objectKey,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      mediaType: input.mediaType,
      visibility,
      status: initialStatus,
      uploadedByType: uploader.type,
      uploadedByUserId: uploader.userId ? new Types.ObjectId(uploader.userId) : undefined,
      uploadedByHouseholdId: uploader.householdId ? new Types.ObjectId(uploader.householdId) : undefined,
    });

    return {
      media: toMediaDTO(media),
      uploadUrl,
      uploadKey,
    };
  }

  static async completeUpload(
    weddingId: string,
    mediaId: string,
    input: CompleteUploadInput
  ): Promise<MediaDTO> {
    const media = await MediaRepository.findById(mediaId);
    if (!media || media.weddingId.toString() !== weddingId) {
      throw new AppError("RESOURCE_NOT_FOUND", "Media item not found", 404);
    }

    if (media.status !== "PENDING_UPLOAD") {
      throw new AppError("CONFLICT", "Upload is not in PENDING_UPLOAD state", 409);
    }

    const expectedPrefix = `uploads/temp/${weddingId}/`;
    if (!input.uploadKey.startsWith(expectedPrefix)) {
      throw new AppError("FORBIDDEN", "Invalid or cross-wedding upload key provided", 403);
    }

    // Verify file content in R2 and seal to immutable objectKey
    await StorageService.verifyAndSeal(
      input.uploadKey,
      media.objectKey,
      input.mimeType,
      input.sizeBytes
    );

    // Guest uploads go to PENDING_APPROVAL; Member uploads go to APPROVED
    const newStatus: MediaStatus = media.uploadedByType === "GUEST" ? "PENDING_APPROVAL" : "APPROVED";

    const updated = await MediaRepository.update(mediaId, {
      status: newStatus,
    });

    if (!updated) {
      throw new AppError("INTERNAL_ERROR", "Failed to update media status", 500);
    }

    let accessUrl: string | undefined;
    try {
      accessUrl = await StorageService.accessUrl(updated.objectKey);
    } catch {
      // Ignore signed URL error if storage unavailable
    }

    return toMediaDTO(updated, accessUrl);
  }

  static async getMediaAccessUrl(
    weddingId: string,
    mediaId: string,
    options?: { allowPrivate?: boolean }
  ): Promise<string> {
    const media = await MediaRepository.findById(mediaId);
    if (!media || media.weddingId.toString() !== weddingId) {
      throw new AppError("RESOURCE_NOT_FOUND", "Media item not found", 404);
    }

    if (media.status !== "APPROVED" && media.status !== "UPLOADED") {
      throw new AppError("FORBIDDEN", "Media item is not approved for access", 403);
    }

    if (media.visibility === "PRIVATE" && options?.allowPrivate === false) {
      throw new AppError("FORBIDDEN", "Private media items cannot be accessed by guests", 403);
    }

    return StorageService.accessUrl(media.objectKey);
  }

  static async listMedia(weddingId: string, filters?: ListMediaFilters): Promise<MediaDTO[]> {
    const items = await MediaRepository.findByWedding(weddingId, filters);

    return Promise.all(
      items.map(async (item) => {
        let accessUrl: string | undefined;
        if (item.status === "APPROVED" || item.status === "UPLOADED") {
          try {
            accessUrl = await StorageService.accessUrl(item.objectKey);
          } catch {
            // ignore signed URL failure in list
          }
        }
        return toMediaDTO(item, accessUrl);
      })
    );
  }

  static async listPublicGalleryMedia(weddingId: string, albumId?: string): Promise<PublicMediaDTO[]> {
    const items = await MediaRepository.findByWedding(weddingId, {
      albumId,
      status: "APPROVED",
      visibility: "PUBLIC",
    });

    return Promise.all(
      items.map(async (item) => {
        let accessUrl: string | undefined;
        try {
          accessUrl = await StorageService.accessUrl(item.objectKey);
        } catch {
          // ignore signed URL error
        }
        return toPublicMediaDTO(item, accessUrl);
      })
    );
  }

  static async listGuestGalleryMedia(
    weddingId: string,
    householdId?: string,
    albumId?: string
  ): Promise<PublicMediaDTO[]> {
    // Guest gallery displays APPROVED public/guest media, PLUS any pending items uploaded by this specific household
    const approvedItems = await MediaRepository.findByWedding(weddingId, {
      albumId,
      status: "APPROVED",
      visibility: ["PUBLIC", "RESTRICTED"],
    });

    let householdItems: IMedia[] = [];
    if (householdId) {
      householdItems = await MediaRepository.findByWedding(weddingId, {
        albumId,
        uploadedByHouseholdId: householdId,
        status: "PENDING_APPROVAL",
      });
    }

    const allItems = [...approvedItems, ...householdItems];
    // Deduplicate by _id
    const seen = new Set<string>();
    const uniqueItems: IMedia[] = [];
    for (const item of allItems) {
      const idStr = item._id.toString();
      if (!seen.has(idStr)) {
        seen.add(idStr);
        uniqueItems.push(item);
      }
    }

    return Promise.all(
      uniqueItems.map(async (item) => {
        let accessUrl: string | undefined;
        try {
          accessUrl = await StorageService.accessUrl(item.objectKey);
        } catch {
          // ignore
        }
        return toPublicMediaDTO(item, accessUrl);
      })
    );
  }

  static async moderateMedia(weddingId: string, mediaId: string, status: "APPROVED" | "REJECTED"): Promise<MediaDTO> {
    const media = await MediaRepository.findById(mediaId);
    if (!media || media.weddingId.toString() !== weddingId) {
      throw new AppError("RESOURCE_NOT_FOUND", "Media item not found", 404);
    }

    const updated = await MediaRepository.update(mediaId, { status });
    if (!updated) {
      throw new AppError("INTERNAL_ERROR", "Failed to update media status", 500);
    }

    let accessUrl: string | undefined;
    if (status === "APPROVED") {
      try {
        accessUrl = await StorageService.accessUrl(updated.objectKey);
      } catch {
        // ignore
      }
    }

    return toMediaDTO(updated, accessUrl);
  }

  static async deleteMedia(weddingId: string, mediaId: string): Promise<boolean> {
    const media = await MediaRepository.findById(mediaId);
    if (!media || media.weddingId.toString() !== weddingId) {
      throw new AppError("RESOURCE_NOT_FOUND", "Media item not found", 404);
    }

    // Try deleting object from Cloudflare R2
    try {
      await StorageService.remove(media.objectKey);
    } catch {
      // Continue metadata deletion even if object cleanup fails
    }

    return MediaRepository.delete(mediaId);
  }
}
