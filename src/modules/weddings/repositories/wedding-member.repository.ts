import { WeddingMember, IWeddingMember } from "../models/wedding-member.model";
import { IWedding } from "../models/wedding.model";
import { Types, ClientSession } from "mongoose";

export interface CreateWeddingMemberParams {
  weddingId: Types.ObjectId;
  userId: Types.ObjectId;
  role: "ADMIN" | "MANAGER" | "ORGANISER";
  status?: "ACTIVE" | "REMOVED";
}

export class WeddingMemberRepository {
  static async create(params: CreateWeddingMemberParams, session?: ClientSession): Promise<IWeddingMember> {
    const docs = await WeddingMember.create(
      [
        {
          weddingId: params.weddingId,
          userId: params.userId,
          role: params.role,
          permissions: {
            guests: true,
            vendors: true,
            finance: true,
            gallery: true,
            website: true,
            guestbook: true,
            emergency: true,
          },
          eventScope: {
            allEvents: true,
            eventIds: [],
          },
          status: params.status || "ACTIVE",
          joinedAt: new Date(),
        },
      ],
      { session }
    );
    return docs[0];
  }

  static async findMember(weddingId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<IWeddingMember | null> {
    return WeddingMember.findOne({
      weddingId: new Types.ObjectId(weddingId.toString()),
      userId: new Types.ObjectId(userId.toString()),
      status: "ACTIVE",
    });
  }

  static async findActiveUserMemberships(userId: string | Types.ObjectId): Promise<Array<{ member: IWeddingMember; wedding: IWedding }>> {
    const members = await WeddingMember.find({
      userId: new Types.ObjectId(userId.toString()),
      status: "ACTIVE",
    }).populate<{ weddingId: IWedding }>("weddingId");

    return members
      .filter((m) => m.weddingId != null)
      .map((m) => ({
        member: m as unknown as IWeddingMember,
        wedding: m.weddingId as unknown as IWedding,
      }));
  }

  static async countActiveMembers(weddingId: string | Types.ObjectId): Promise<number> {
    return WeddingMember.countDocuments({
      weddingId: new Types.ObjectId(weddingId.toString()),
      status: "ACTIVE",
    });
  }
}
