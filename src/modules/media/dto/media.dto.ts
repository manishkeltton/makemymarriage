import { IMedia } from "../models/media.model";
import { IAlbum } from "../models/album.model";

export interface MediaDTO {
  id: string;
  weddingId: string;
  albumId?: string;
  objectKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  mediaType: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  visibility: "PUBLIC" | "RESTRICTED" | "PRIVATE";
  status: "PENDING_UPLOAD" | "UPLOADED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  uploadedByType: "MEMBER" | "GUEST";
  uploadedByUserId?: string;
  uploadedByHouseholdId?: string;
  createdAt: string;
  updatedAt: string;
  accessUrl?: string;
}

export interface PublicMediaDTO {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  mediaType: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  createdAt: string;
  accessUrl?: string;
}

export interface AlbumDTO {
  id: string;
  weddingId: string;
  eventId?: string;
  name: string;
  description?: string;
  visibility: "GUESTS" | "PUBLIC" | "PRIVATE";
  createdBy: string;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicAlbumDTO {
  id: string;
  name: string;
  description?: string;
  itemCount?: number;
}

export function toMediaDTO(media: IMedia, accessUrl?: string): MediaDTO {
  return {
    id: media._id.toString(),
    weddingId: media.weddingId.toString(),
    albumId: media.albumId ? media.albumId.toString() : undefined,
    objectKey: media.objectKey,
    originalFilename: media.originalFilename,
    mimeType: media.mimeType,
    sizeBytes: media.sizeBytes,
    mediaType: media.mediaType,
    visibility: media.visibility,
    status: media.status,
    uploadedByType: media.uploadedByType,
    uploadedByUserId: media.uploadedByUserId ? media.uploadedByUserId.toString() : undefined,
    uploadedByHouseholdId: media.uploadedByHouseholdId ? media.uploadedByHouseholdId.toString() : undefined,
    createdAt: media.createdAt.toISOString(),
    updatedAt: media.updatedAt.toISOString(),
    accessUrl,
  };
}

export function toPublicMediaDTO(media: IMedia, accessUrl?: string): PublicMediaDTO {
  return {
    id: media._id.toString(),
    originalFilename: media.originalFilename,
    mimeType: media.mimeType,
    sizeBytes: media.sizeBytes,
    mediaType: media.mediaType,
    createdAt: media.createdAt.toISOString(),
    accessUrl,
  };
}

export function toAlbumDTO(album: IAlbum, itemCount?: number): AlbumDTO {
  return {
    id: album._id.toString(),
    weddingId: album.weddingId.toString(),
    eventId: album.eventId ? album.eventId.toString() : undefined,
    name: album.name,
    description: album.description,
    visibility: album.visibility,
    createdBy: album.createdBy.toString(),
    itemCount,
    createdAt: album.createdAt.toISOString(),
    updatedAt: album.updatedAt.toISOString(),
  };
}

export function toPublicAlbumDTO(album: IAlbum, itemCount?: number): PublicAlbumDTO {
  return {
    id: album._id.toString(),
    name: album.name,
    description: album.description,
    itemCount,
  };
}
