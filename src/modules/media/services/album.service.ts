import { Types } from "mongoose";
import { AlbumRepository, MediaRepository } from "../repositories/media.repository";
import { AlbumDTO, PublicAlbumDTO, toAlbumDTO, toPublicAlbumDTO } from "../dto/media.dto";
import { CreateAlbumInput, UpdateAlbumInput } from "../validation/media.validation";
import { AlbumVisibility } from "../models/album.model";
import { AppError } from "@/shared/errors/app-error";

export class AlbumService {
  static async createAlbum(
    weddingId: string,
    createdBy: string,
    input: CreateAlbumInput
  ): Promise<AlbumDTO> {
    const album = await AlbumRepository.create({
      weddingId: new Types.ObjectId(weddingId),
      eventId: input.eventId ? new Types.ObjectId(input.eventId) : undefined,
      name: input.name,
      description: input.description,
      visibility: input.visibility as AlbumVisibility,
      createdBy: new Types.ObjectId(createdBy),
    });

    return toAlbumDTO(album, 0);
  }

  static async getAlbums(weddingId: string): Promise<AlbumDTO[]> {
    const albums = await AlbumRepository.findByWedding(weddingId);
    return Promise.all(
      albums.map(async (album) => {
        const itemCount = await MediaRepository.countByAlbum(album._id);
        return toAlbumDTO(album, itemCount);
      })
    );
  }

  static async getPublicAlbums(weddingId: string): Promise<PublicAlbumDTO[]> {
    const albums = await AlbumRepository.findByWedding(weddingId, {
      visibility: ["PUBLIC", "GUESTS"],
    });

    return Promise.all(
      albums.map(async (album) => {
        const itemCount = await MediaRepository.countByAlbum(album._id, "APPROVED");
        return toPublicAlbumDTO(album, itemCount);
      })
    );
  }

  static async updateAlbum(
    weddingId: string,
    albumId: string,
    input: UpdateAlbumInput
  ): Promise<AlbumDTO> {
    const album = await AlbumRepository.findById(albumId);
    if (!album || album.weddingId.toString() !== weddingId) {
      throw new AppError("RESOURCE_NOT_FOUND", "Album not found in this wedding", 404);
    }

    const updated = await AlbumRepository.update(albumId, {
      name: input.name,
      description: input.description,
      eventId: input.eventId ? new Types.ObjectId(input.eventId) : input.eventId === "" ? null : undefined,
      visibility: input.visibility as AlbumVisibility | undefined,
    });

    if (!updated) {
      throw new AppError("INTERNAL_ERROR", "Failed to update album", 500);
    }

    const itemCount = await MediaRepository.countByAlbum(updated._id);
    return toAlbumDTO(updated, itemCount);
  }

  static async deleteAlbum(weddingId: string, albumId: string): Promise<boolean> {
    const album = await AlbumRepository.findById(albumId);
    if (!album || album.weddingId.toString() !== weddingId) {
      throw new AppError("RESOURCE_NOT_FOUND", "Album not found in this wedding", 404);
    }

    return AlbumRepository.delete(albumId);
  }
}
