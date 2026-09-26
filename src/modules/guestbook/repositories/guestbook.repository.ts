import { Types } from "mongoose";
import { GuestbookEntryModel, IGuestbookEntry, GuestbookStatus } from "../models/guestbook.model";

export class GuestbookRepository {
  static async create(data: {
    weddingId: Types.ObjectId;
    householdId?: Types.ObjectId;
    guestName: string;
    type: "TEXT" | "AUDIO" | "VIDEO";
    text?: string;
    mediaId?: Types.ObjectId;
    status: GuestbookStatus;
  }): Promise<IGuestbookEntry> {
    return GuestbookEntryModel.create(data);
  }

  static async findById(id: string | Types.ObjectId): Promise<IGuestbookEntry | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return GuestbookEntryModel.findById(id).exec();
  }

  static async findByWedding(
    weddingId: string | Types.ObjectId,
    filters?: { status?: GuestbookStatus | GuestbookStatus[]; householdId?: string }
  ): Promise<IGuestbookEntry[]> {
    const query: Record<string, unknown> = {
      weddingId: typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId,
    };

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query.status = { $in: filters.status };
      } else {
        query.status = filters.status;
      }
    }

    if (filters?.householdId && Types.ObjectId.isValid(filters.householdId)) {
      query.householdId = new Types.ObjectId(filters.householdId);
    }

    return GuestbookEntryModel.find(query).sort({ createdAt: -1 }).exec();
  }

  static async moderate(
    id: string | Types.ObjectId,
    status: GuestbookStatus,
    moderatedBy?: Types.ObjectId
  ): Promise<IGuestbookEntry | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return GuestbookEntryModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          moderatedAt: new Date(),
          moderatedBy,
        },
      },
      { new: true }
    ).exec();
  }

  static async delete(id: string | Types.ObjectId): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const res = await GuestbookEntryModel.findByIdAndDelete(id).exec();
    return !!res;
  }
}
