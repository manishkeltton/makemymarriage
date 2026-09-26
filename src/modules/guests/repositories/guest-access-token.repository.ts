import { Types } from "mongoose";
import { GuestAccessTokenModel, IGuestAccessToken } from "../models/guest-access-token.model";

export class GuestAccessTokenRepository {
  static async create({
    weddingId,
    householdId,
    tokenHash,
    expiresAt,
  }: {
    weddingId: Types.ObjectId;
    householdId: Types.ObjectId;
    tokenHash: string;
    expiresAt?: Date;
  }): Promise<IGuestAccessToken> {
    const tokenDoc = new GuestAccessTokenModel({
      weddingId,
      householdId,
      tokenHash,
      expiresAt,
    });
    return await tokenDoc.save();
  }

  static async findByTokenHash(tokenHash: string): Promise<IGuestAccessToken | null> {
    return await GuestAccessTokenModel.findOne({ tokenHash }).exec();
  }

  static async revokeActiveTokensByHouseholdId({
    weddingId,
    householdId,
  }: {
    weddingId: string;
    householdId: string;
  }): Promise<number> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(householdId)) {
      return 0;
    }
    const result = await GuestAccessTokenModel.updateMany(
      {
        weddingId: new Types.ObjectId(weddingId),
        householdId: new Types.ObjectId(householdId),
        revokedAt: { $exists: false },
      },
      { $set: { revokedAt: new Date() } }
    ).exec();
    return result.modifiedCount;
  }

  static async deleteAllByHouseholdId({
    weddingId,
    householdId,
  }: {
    weddingId: string;
    householdId: string;
  }): Promise<number> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(householdId)) {
      return 0;
    }
    const result = await GuestAccessTokenModel.deleteMany({
      weddingId: new Types.ObjectId(weddingId),
      householdId: new Types.ObjectId(householdId),
    }).exec();
    return result.deletedCount;
  }

  static async updateLastUsedAt(tokenId: Types.ObjectId): Promise<void> {
    await GuestAccessTokenModel.updateOne({ _id: tokenId }, { $set: { lastUsedAt: new Date() } }).exec();
  }
}
