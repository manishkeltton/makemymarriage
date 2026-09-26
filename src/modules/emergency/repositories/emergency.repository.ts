import { Types } from "mongoose";
import { EmergencyContactModel, IEmergencyContact } from "../models/emergency-contact.model";

export class EmergencyContactRepository {
  static async create(data: {
    weddingId: Types.ObjectId;
    eventId?: Types.ObjectId;
    name: string;
    role: string;
    phone?: string;
    email?: string;
    priority?: number;
    notes?: string;
    createdBy: Types.ObjectId;
  }): Promise<IEmergencyContact> {
    return EmergencyContactModel.create(data);
  }

  static async findById(id: string | Types.ObjectId): Promise<IEmergencyContact | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return EmergencyContactModel.findById(id).exec();
  }

  static async findByWedding(
    weddingId: string | Types.ObjectId,
    filters?: { eventId?: string }
  ): Promise<IEmergencyContact[]> {
    const query: Record<string, unknown> = {
      weddingId: typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId,
    };

    if (filters?.eventId && Types.ObjectId.isValid(filters.eventId)) {
      query.eventId = new Types.ObjectId(filters.eventId);
    }

    return EmergencyContactModel.find(query).sort({ priority: 1, createdAt: -1 }).exec();
  }

  static async update(
    id: string | Types.ObjectId,
    data: Partial<{
      eventId?: Types.ObjectId | null;
      name: string;
      role: string;
      phone?: string;
      email?: string;
      priority?: number;
      notes?: string;
    }>
  ): Promise<IEmergencyContact | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return EmergencyContactModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  static async delete(id: string | Types.ObjectId): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const res = await EmergencyContactModel.findByIdAndDelete(id).exec();
    return !!res;
  }
}
