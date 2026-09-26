import { Types } from "mongoose";
import { GuestbookRepository } from "../repositories/guestbook.repository";
import { GuestbookEntryDTO, PublicGuestbookEntryDTO, toGuestbookEntryDTO, toPublicGuestbookEntryDTO } from "../dto/guestbook.dto";
import { SubmitGuestbookInput } from "../validation/guestbook.validation";
import { MediaRepository } from "@/modules/media/repositories/media.repository";
import { StorageService } from "@/modules/documents/services/storage.service";
import { AppError } from "@/shared/errors/app-error";

export class GuestbookService {
  static async submitEntry(
    weddingId: string,
    householdId: string | undefined,
    input: SubmitGuestbookInput
  ): Promise<GuestbookEntryDTO> {
    const wId = new Types.ObjectId(weddingId);
    let hId: Types.ObjectId | undefined;
    if (householdId && Types.ObjectId.isValid(householdId)) {
      hId = new Types.ObjectId(householdId);
    }

    let mediaId: Types.ObjectId | undefined;
    if (input.mediaId && Types.ObjectId.isValid(input.mediaId)) {
      const media = await MediaRepository.findById(input.mediaId);
      if (!media || media.weddingId.toString() !== weddingId) {
        throw new AppError("RESOURCE_NOT_FOUND", "Attached media not found in this wedding", 404);
      }
      mediaId = media._id;
    }

    const entry = await GuestbookRepository.create({
      weddingId: wId,
      householdId: hId,
      guestName: input.guestName,
      type: input.type,
      text: input.text,
      mediaId,
      status: "PENDING",
    });

    let mediaAccessUrl: string | undefined;
    if (entry.mediaId) {
      const media = await MediaRepository.findById(entry.mediaId);
      if (media) {
        try {
          mediaAccessUrl = await StorageService.accessUrl(media.objectKey);
        } catch {
          // ignore
        }
      }
    }

    return toGuestbookEntryDTO(entry, mediaAccessUrl);
  }

  static async listEntries(
    weddingId: string,
    filters?: { status?: "PENDING" | "APPROVED" | "REJECTED"; householdId?: string }
  ): Promise<GuestbookEntryDTO[]> {
    const entries = await GuestbookRepository.findByWedding(weddingId, filters);

    return Promise.all(
      entries.map(async (entry) => {
        let mediaAccessUrl: string | undefined;
        if (entry.mediaId) {
          const media = await MediaRepository.findById(entry.mediaId);
          if (media) {
            try {
              mediaAccessUrl = await StorageService.accessUrl(media.objectKey);
            } catch {
              // ignore
            }
          }
        }
        return toGuestbookEntryDTO(entry, mediaAccessUrl);
      })
    );
  }

  static async listPublicEntries(weddingId: string): Promise<PublicGuestbookEntryDTO[]> {
    const entries = await GuestbookRepository.findByWedding(weddingId, { status: "APPROVED" });

    return Promise.all(
      entries.map(async (entry) => {
        let mediaAccessUrl: string | undefined;
        if (entry.mediaId) {
          const media = await MediaRepository.findById(entry.mediaId);
          if (media) {
            try {
              mediaAccessUrl = await StorageService.accessUrl(media.objectKey);
            } catch {
              // ignore
            }
          }
        }
        return toPublicGuestbookEntryDTO(entry, mediaAccessUrl);
      })
    );
  }

  static async moderateEntry(
    weddingId: string,
    entryId: string,
    status: "APPROVED" | "REJECTED",
    moderatedBy?: string
  ): Promise<GuestbookEntryDTO> {
    const entry = await GuestbookRepository.findById(entryId);
    if (!entry || entry.weddingId.toString() !== weddingId) {
      throw new AppError("RESOURCE_NOT_FOUND", "Guestbook entry not found in this wedding", 404);
    }

    const updated = await GuestbookRepository.moderate(
      entryId,
      status,
      moderatedBy ? new Types.ObjectId(moderatedBy) : undefined
    );

    if (!updated) {
      throw new AppError("INTERNAL_ERROR", "Failed to update guestbook entry status", 500);
    }

    let mediaAccessUrl: string | undefined;
    if (updated.mediaId) {
      const media = await MediaRepository.findById(updated.mediaId);
      if (media) {
        try {
          mediaAccessUrl = await StorageService.accessUrl(media.objectKey);
        } catch {
          // ignore
        }
      }
    }

    return toGuestbookEntryDTO(updated, mediaAccessUrl);
  }

  static async deleteEntry(weddingId: string, entryId: string): Promise<boolean> {
    const entry = await GuestbookRepository.findById(entryId);
    if (!entry || entry.weddingId.toString() !== weddingId) {
      throw new AppError("RESOURCE_NOT_FOUND", "Guestbook entry not found", 404);
    }

    return GuestbookRepository.delete(entryId);
  }
}
