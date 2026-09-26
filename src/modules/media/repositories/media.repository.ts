import { Types } from "mongoose";
import { MediaModel, IMedia, MediaStatus, MediaVisibility, MediaType, UploadedByType } from "../models/media.model";
import { AlbumModel, IAlbum, AlbumVisibility } from "../models/album.model";

export interface ListMediaFilters {
  albumId?: string;
  status?: MediaStatus | MediaStatus[];
  visibility?: MediaVisibility | MediaVisibility[];
  mediaType?: MediaType;
  uploadedByType?: UploadedByType;
  uploadedByHouseholdId?: string;
}

export class AlbumRepository {
  static async create(data: {
    weddingId: Types.ObjectId;
    eventId?: Types.ObjectId;
    name: string;
    description?: string;
    visibility: AlbumVisibility;
    createdBy: Types.ObjectId;
  }): Promise<IAlbum> {
    return AlbumModel.create(data);
  }

  static async findById(id: string | Types.ObjectId): Promise<IAlbum | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return AlbumModel.findById(id).exec();
  }

  static async findByWedding(
    weddingId: string | Types.ObjectId,
    filters?: { visibility?: AlbumVisibility | AlbumVisibility[]; eventId?: string }
  ): Promise<IAlbum[]> {
    const query: Record<string, unknown> = {
      weddingId: typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId,
    };

    if (filters?.visibility) {
      if (Array.isArray(filters.visibility)) {
        query.visibility = { $in: filters.visibility };
      } else {
        query.visibility = filters.visibility;
      }
    }

    if (filters?.eventId && Types.ObjectId.isValid(filters.eventId)) {
      query.eventId = new Types.ObjectId(filters.eventId);
    }

    return AlbumModel.find(query).sort({ createdAt: -1 }).exec();
  }

  static async update(
    id: string | Types.ObjectId,
    data: Partial<{
      name: string;
      description: string;
      eventId?: Types.ObjectId | null;
      visibility: AlbumVisibility;
    }>
  ): Promise<IAlbum | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return AlbumModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  static async delete(id: string | Types.ObjectId): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const res = await AlbumModel.findByIdAndDelete(id).exec();
    return !!res;
  }
}

export class MediaRepository {
  static async create(data: {
    weddingId: Types.ObjectId;
    albumId?: Types.ObjectId;
    objectKey: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    mediaType: MediaType;
    visibility: MediaVisibility;
    status: MediaStatus;
    uploadedByType: UploadedByType;
    uploadedByUserId?: Types.ObjectId;
    uploadedByHouseholdId?: Types.ObjectId;
  }): Promise<IMedia> {
    return MediaModel.create(data);
  }

  static async findById(id: string | Types.ObjectId): Promise<IMedia | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return MediaModel.findById(id).exec();
  }

  static async findByObjectKey(objectKey: string): Promise<IMedia | null> {
    return MediaModel.findOne({ objectKey }).exec();
  }

  static async findByWedding(
    weddingId: string | Types.ObjectId,
    filters?: ListMediaFilters
  ): Promise<IMedia[]> {
    const query: Record<string, unknown> = {
      weddingId: typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId,
    };

    if (filters?.albumId) {
      if (Types.ObjectId.isValid(filters.albumId)) {
        query.albumId = new Types.ObjectId(filters.albumId);
      }
    }

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query.status = { $in: filters.status };
      } else {
        query.status = filters.status;
      }
    }

    if (filters?.visibility) {
      if (Array.isArray(filters.visibility)) {
        query.visibility = { $in: filters.visibility };
      } else {
        query.visibility = filters.visibility;
      }
    }

    if (filters?.mediaType) {
      query.mediaType = filters.mediaType;
    }

    if (filters?.uploadedByType) {
      query.uploadedByType = filters.uploadedByType;
    }

    if (filters?.uploadedByHouseholdId && Types.ObjectId.isValid(filters.uploadedByHouseholdId)) {
      query.uploadedByHouseholdId = new Types.ObjectId(filters.uploadedByHouseholdId);
    }

    return MediaModel.find(query).sort({ createdAt: -1 }).exec();
  }

  static async update(
    id: string | Types.ObjectId,
    data: Partial<{
      albumId?: Types.ObjectId | null;
      objectKey: string;
      status: MediaStatus;
      visibility: MediaVisibility;
    }>
  ): Promise<IMedia | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return MediaModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  static async delete(id: string | Types.ObjectId): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const res = await MediaModel.findByIdAndDelete(id).exec();
    return !!res;
  }

  static async countByAlbum(albumId: string | Types.ObjectId, status?: MediaStatus): Promise<number> {
    if (!Types.ObjectId.isValid(albumId)) return 0;
    const query: Record<string, unknown> = {
      albumId: typeof albumId === "string" ? new Types.ObjectId(albumId) : albumId,
    };
    if (status) {
      query.status = status;
    }
    return MediaModel.countDocuments(query).exec();
  }
}
