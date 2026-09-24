import { Types, ClientSession } from "mongoose";
import { WeddingMember, IWeddingMember } from "@/modules/weddings/models/wedding-member.model";
import { IUser } from "@/lib/db/models/User";

export interface UpdateTeamMemberParams {
  role?: "ADMIN" | "MANAGER" | "ORGANISER";
  permissions?: {
    guests: boolean;
    vendors: boolean;
    finance: boolean;
    gallery: boolean;
    website: boolean;
    guestbook: boolean;
    emergency: boolean;
  };
  eventScope?: {
    allEvents: boolean;
    eventIds: Types.ObjectId[];
  };
  status?: "ACTIVE" | "REMOVED";
}

export class TeamMemberRepository {
  /**
   * Returns all active members for a wedding with populated user info.
   */
  static async findActiveMembersByWeddingId(
    weddingId: string | Types.ObjectId
  ): Promise<Array<{ member: IWeddingMember; user: Partial<IUser> }>> {
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;

    const docs = await WeddingMember.find({
      weddingId: wId,
      status: "ACTIVE",
    })
      .populate<{ userId: IUser }>("userId", "name email")
      .exec();

    return docs.map((doc) => ({
      member: doc as unknown as IWeddingMember,
      user: (doc.userId as unknown as IUser) || { name: "Member", email: "" },
    }));
  }

  /**
   * Finds a member strictly by weddingId and memberId.
   */
  static async findByIdAndWeddingId({
    weddingId,
    memberId,
  }: {
    weddingId: string | Types.ObjectId;
    memberId: string | Types.ObjectId;
  }): Promise<IWeddingMember | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(memberId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const mId = typeof memberId === "string" ? new Types.ObjectId(memberId) : memberId;

    return await WeddingMember.findOne({ _id: mId, weddingId: wId }).exec();
  }

  /**
   * Finds a member by userId and weddingId.
   */
  static async findByUserIdAndWeddingId({
    weddingId,
    userId,
  }: {
    weddingId: string | Types.ObjectId;
    userId: string | Types.ObjectId;
  }): Promise<IWeddingMember | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(userId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const uId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

    return await WeddingMember.findOne({ weddingId: wId, userId: uId }).exec();
  }

  /**
   * Counts active ADMIN members for a wedding.
   */
  static async countActiveAdmins(weddingId: string | Types.ObjectId): Promise<number> {
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    return await WeddingMember.countDocuments({
      weddingId: wId,
      role: "ADMIN",
      status: "ACTIVE",
    });
  }

  /**
   * Updates a member record.
   */
  static async updateMemberByIdAndWeddingId({
    weddingId,
    memberId,
    updateData,
    session,
  }: {
    weddingId: string | Types.ObjectId;
    memberId: string | Types.ObjectId;
    updateData: UpdateTeamMemberParams;
    session?: ClientSession;
  }): Promise<IWeddingMember | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(memberId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const mId = typeof memberId === "string" ? new Types.ObjectId(memberId) : memberId;

    return await WeddingMember.findOneAndUpdate(
      { _id: mId, weddingId: wId },
      { $set: updateData },
      { new: true, runValidators: true, session }
    ).exec();
  }

  /**
   * Soft-deletes a member by setting status to REMOVED.
   */
  static async softDeleteMemberByIdAndWeddingId({
    weddingId,
    memberId,
    session,
  }: {
    weddingId: string | Types.ObjectId;
    memberId: string | Types.ObjectId;
    session?: ClientSession;
  }): Promise<boolean> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(memberId)) {
      return false;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const mId = typeof memberId === "string" ? new Types.ObjectId(memberId) : memberId;

    const res = await WeddingMember.findOneAndUpdate(
      { _id: mId, weddingId: wId, status: "ACTIVE" },
      { $set: { status: "REMOVED" } },
      { new: true, session }
    ).exec();

    return Boolean(res);
  }

  /**
   * Creates a member document (e.g. during invitation acceptance).
   */
  static async createMember(
    params: {
      weddingId: Types.ObjectId;
      userId: Types.ObjectId;
      role: "ADMIN" | "MANAGER" | "ORGANISER";
      permissions: {
        guests: boolean;
        vendors: boolean;
        finance: boolean;
        gallery: boolean;
        website: boolean;
        guestbook: boolean;
        emergency: boolean;
      };
      eventScope: {
        allEvents: boolean;
        eventIds: Types.ObjectId[];
      };
      status?: "ACTIVE" | "REMOVED";
      joinedAt?: Date;
    },
    session?: ClientSession
  ): Promise<IWeddingMember> {
    const doc = new WeddingMember({
      weddingId: params.weddingId,
      userId: params.userId,
      role: params.role,
      permissions: params.permissions,
      eventScope: params.eventScope,
      status: params.status || "ACTIVE",
      joinedAt: params.joinedAt || new Date(),
    });

    return await doc.save({ session });
  }
}
