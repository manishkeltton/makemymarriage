import { Wedding, IWedding, IGeneralLocation } from "../models/wedding.model";
import { Types, ClientSession } from "mongoose";

export interface CreateWeddingParams {
  title: string;
  bride: { name: string };
  groom: { name: string };
  primaryWeddingDate: Date;
  generalLocation?: IGeneralLocation;
  preferredLanguage: "en" | "hi";
  createdBy: Types.ObjectId;
}

export interface UpdateWeddingParams {
  title?: string;
  bride?: { name: string };
  groom?: { name: string };
  primaryWeddingDate?: Date;
  generalLocation?: IGeneralLocation;
  preferredLanguage?: "en" | "hi";
  status?: "PLANNING" | "COMPLETED" | "ARCHIVED";
}

export class WeddingRepository {
  static async create(params: CreateWeddingParams, session?: ClientSession): Promise<IWedding> {
    const docs = await Wedding.create(
      [
        {
          title: params.title.trim(),
          bride: { name: params.bride.name.trim() },
          groom: { name: params.groom.name.trim() },
          primaryWeddingDate: params.primaryWeddingDate,
          generalLocation: params.generalLocation,
          preferredLanguage: params.preferredLanguage || "en",
          createdBy: params.createdBy,
          status: "PLANNING",
        },
      ],
      { session }
    );
    return docs[0];
  }

  static async findById(id: string | Types.ObjectId): Promise<IWedding | null> {
    return Wedding.findById(id);
  }

  static async updateById(id: string | Types.ObjectId, updateData: UpdateWeddingParams): Promise<IWedding | null> {
    return Wedding.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
  }
}
