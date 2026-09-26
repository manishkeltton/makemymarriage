import { Types } from "mongoose";
import { GuestHouseholdModel, IGuestHousehold, GuestSide, InvitationStatus, RsvpStatus } from "../models/guest-household.model";

export interface GuestHouseholdFilterParams {
  weddingId: string;
  side?: GuestSide;
  rsvpStatus?: RsvpStatus;
  invitationStatus?: InvitationStatus;
  q?: string;
  limit?: number;
  cursor?: string;
  sort?: "householdName" | "totalInvited" | "createdAt";
  order?: "asc" | "desc";
}

export interface CreateGuestHouseholdParams {
  weddingId: Types.ObjectId;
  householdName: string;
  primaryContact: {
    name: string;
    email?: string;
    phone?: string;
  };
  side: GuestSide;
  members: Array<{ name: string }>;
  totalInvited: number;
  invitationStatus?: InvitationStatus;
  invitationSentAt?: Date;
  rsvp?: {
    status: RsvpStatus;
    attendingCount?: number;
    respondedAt?: Date;
  };
  galleryAccess?: boolean;
  notes?: string;
  createdBy: Types.ObjectId;
}

export interface UpdateGuestHouseholdParams {
  householdName?: string;
  primaryContact?: {
    name?: string;
    email?: string | null;
    phone?: string | null;
  };
  side?: GuestSide;
  members?: Array<{ name: string }>;
  totalInvited?: number;
  invitationStatus?: InvitationStatus;
  invitationSentAt?: Date | null;
  rsvp?: {
    status: RsvpStatus;
    attendingCount?: number;
    respondedAt?: Date | null;
  };
  galleryAccess?: boolean;
  notes?: string | null;
  updatedBy?: Types.ObjectId;
}

export class GuestHouseholdRepository {
  static async create(params: CreateGuestHouseholdParams): Promise<IGuestHousehold> {
    const household = new GuestHouseholdModel({
      weddingId: params.weddingId,
      householdName: params.householdName,
      primaryContact: params.primaryContact,
      side: params.side,
      members: params.members || [],
      totalInvited: params.totalInvited,
      invitationStatus: params.invitationStatus || "NOT_SENT",
      invitationSentAt: params.invitationSentAt,
      rsvp: params.rsvp || { status: "AWAITING", attendingCount: 0 },
      galleryAccess: params.galleryAccess !== undefined ? params.galleryAccess : true,
      notes: params.notes,
      createdBy: params.createdBy,
    });
    return await household.save();
  }

  static async findByIdAndWeddingId({
    weddingId,
    householdId,
  }: {
    weddingId: string;
    householdId: string;
  }): Promise<IGuestHousehold | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(householdId)) {
      return null;
    }
    return await GuestHouseholdModel.findOne({
      _id: new Types.ObjectId(householdId),
      weddingId: new Types.ObjectId(weddingId),
    }).exec();
  }

  static async findHouseholdsByFilters({
    weddingId,
    side,
    rsvpStatus,
    invitationStatus,
    q,
    limit = 25,
    cursor,
    sort = "householdName",
    order = "asc",
  }: GuestHouseholdFilterParams): Promise<{
    households: IGuestHousehold[];
    nextCursor?: string;
    hasMore: boolean;
    totalCount: number;
  }> {
    const query: Record<string, unknown> = {
      weddingId: new Types.ObjectId(weddingId),
    };

    if (side) query.side = side;
    if (rsvpStatus) query["rsvp.status"] = rsvpStatus;
    if (invitationStatus) query.invitationStatus = invitationStatus;

    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), "i");
      query.$or = [
        { householdName: searchRegex },
        { "primaryContact.name": searchRegex },
        { "primaryContact.email": searchRegex },
        { "primaryContact.phone": searchRegex },
        { "members.name": searchRegex },
      ];
    }

    if (cursor && Types.ObjectId.isValid(cursor)) {
      query._id = order === "asc" ? { $gt: new Types.ObjectId(cursor) } : { $lt: new Types.ObjectId(cursor) };
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const sortOption: Record<string, 1 | -1> = { [sort]: sortOrder, _id: sortOrder };

    const safeLimit = Math.min(Math.max(1, limit), 100);

    const countQuery = { ...query };
    delete countQuery._id;

    const [households, totalCount] = await Promise.all([
      GuestHouseholdModel.find(query)
        .sort(sortOption)
        .limit(safeLimit + 1)
        .exec(),
      GuestHouseholdModel.countDocuments(countQuery).exec(),
    ]);

    const hasMore = households.length > safeLimit;
    const items = hasMore ? households.slice(0, safeLimit) : households;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]._id.toString() : undefined;

    return { households: items, nextCursor, hasMore, totalCount };
  }

  static async updateByIdAndWeddingId({
    weddingId,
    householdId,
    updateData,
  }: {
    weddingId: string;
    householdId: string;
    updateData: UpdateGuestHouseholdParams;
  }): Promise<IGuestHousehold | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(householdId)) {
      return null;
    }

    const setPayload: Record<string, unknown> = {};

    if (updateData.householdName !== undefined) setPayload.householdName = updateData.householdName;
    if (updateData.primaryContact !== undefined) {
      if (updateData.primaryContact.name !== undefined) setPayload["primaryContact.name"] = updateData.primaryContact.name;
      if (updateData.primaryContact.email !== undefined) setPayload["primaryContact.email"] = updateData.primaryContact.email;
      if (updateData.primaryContact.phone !== undefined) setPayload["primaryContact.phone"] = updateData.primaryContact.phone;
    }
    if (updateData.side !== undefined) setPayload.side = updateData.side;
    if (updateData.members !== undefined) setPayload.members = updateData.members;
    if (updateData.totalInvited !== undefined) setPayload.totalInvited = updateData.totalInvited;
    if (updateData.invitationStatus !== undefined) setPayload.invitationStatus = updateData.invitationStatus;
    if (updateData.invitationSentAt !== undefined) setPayload.invitationSentAt = updateData.invitationSentAt;
    if (updateData.rsvp !== undefined) {
      if (updateData.rsvp.status !== undefined) setPayload["rsvp.status"] = updateData.rsvp.status;
      if (updateData.rsvp.attendingCount !== undefined) setPayload["rsvp.attendingCount"] = updateData.rsvp.attendingCount;
      if (updateData.rsvp.respondedAt !== undefined) setPayload["rsvp.respondedAt"] = updateData.rsvp.respondedAt;
    }
    if (updateData.galleryAccess !== undefined) setPayload.galleryAccess = updateData.galleryAccess;
    if (updateData.notes !== undefined) setPayload.notes = updateData.notes;
    if (updateData.updatedBy !== undefined) setPayload.updatedBy = updateData.updatedBy;

    return await GuestHouseholdModel.findOneAndUpdate(
      { _id: new Types.ObjectId(householdId), weddingId: new Types.ObjectId(weddingId) },
      { $set: setPayload },
      { new: true, runValidators: true }
    ).exec();
  }

  static async deleteByIdAndWeddingId({
    weddingId,
    householdId,
  }: {
    weddingId: string;
    householdId: string;
  }): Promise<boolean> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(householdId)) {
      return false;
    }
    const result = await GuestHouseholdModel.deleteOne({
      _id: new Types.ObjectId(householdId),
      weddingId: new Types.ObjectId(weddingId),
    }).exec();
    return result.deletedCount > 0;
  }

  static async aggregateGuestStats(weddingId: string): Promise<{
    totalHouseholds: number;
    totalInvited: number;
    totalAttending: number;
    totalDeclined: number;
    totalAwaiting: number;
    totalSent: number;
    sideBreakdown: { bride: number; groom: number; both: number };
  }> {
    if (!Types.ObjectId.isValid(weddingId)) {
      return {
        totalHouseholds: 0,
        totalInvited: 0,
        totalAttending: 0,
        totalDeclined: 0,
        totalAwaiting: 0,
        totalSent: 0,
        sideBreakdown: { bride: 0, groom: 0, both: 0 },
      };
    }

    const households = await GuestHouseholdModel.find({ weddingId: new Types.ObjectId(weddingId) }).exec();

    let totalInvited = 0;
    let totalAttending = 0;
    let totalDeclined = 0;
    let totalAwaiting = 0;
    let totalSent = 0;
    let brideSide = 0;
    let groomSide = 0;
    let bothSide = 0;

    for (const h of households) {
      totalInvited += h.totalInvited || 0;
      if (h.invitationStatus === "SENT") totalSent++;

      if (h.side === "BRIDE") brideSide += h.totalInvited || 0;
      else if (h.side === "GROOM") groomSide += h.totalInvited || 0;
      else bothSide += h.totalInvited || 0;

      if (h.rsvp.status === "ATTENDING") {
        totalAttending += h.rsvp.attendingCount ?? h.totalInvited ?? 1;
      } else if (h.rsvp.status === "NOT_ATTENDING") {
        totalDeclined += h.totalInvited || 0;
      } else {
        totalAwaiting += h.totalInvited || 0;
      }
    }

    return {
      totalHouseholds: households.length,
      totalInvited,
      totalAttending,
      totalDeclined,
      totalAwaiting,
      totalSent,
      sideBreakdown: {
        bride: brideSide,
        groom: groomSide,
        both: bothSide,
      },
    };
  }
}
