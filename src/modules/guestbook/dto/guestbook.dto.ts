import { IGuestbookEntry } from "../models/guestbook.model";

export interface GuestbookEntryDTO {
  id: string;
  weddingId: string;
  householdId?: string;
  guestName: string;
  type: "TEXT" | "AUDIO" | "VIDEO";
  text?: string;
  mediaId?: string;
  mediaAccessUrl?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  moderatedAt?: string;
  moderatedBy?: string;
}

export interface PublicGuestbookEntryDTO {
  id: string;
  guestName: string;
  type: "TEXT" | "AUDIO" | "VIDEO";
  text?: string;
  mediaAccessUrl?: string;
  createdAt: string;
}

export function toGuestbookEntryDTO(entry: IGuestbookEntry, mediaAccessUrl?: string): GuestbookEntryDTO {
  return {
    id: entry._id.toString(),
    weddingId: entry.weddingId.toString(),
    householdId: entry.householdId ? entry.householdId.toString() : undefined,
    guestName: entry.guestName,
    type: entry.type,
    text: entry.text,
    mediaId: entry.mediaId ? entry.mediaId.toString() : undefined,
    mediaAccessUrl,
    status: entry.status,
    createdAt: entry.createdAt.toISOString(),
    moderatedAt: entry.moderatedAt ? entry.moderatedAt.toISOString() : undefined,
    moderatedBy: entry.moderatedBy ? entry.moderatedBy.toString() : undefined,
  };
}

export function toPublicGuestbookEntryDTO(entry: IGuestbookEntry, mediaAccessUrl?: string): PublicGuestbookEntryDTO {
  return {
    id: entry._id.toString(),
    guestName: entry.guestName,
    type: entry.type,
    text: entry.text,
    mediaAccessUrl,
    createdAt: entry.createdAt.toISOString(),
  };
}
