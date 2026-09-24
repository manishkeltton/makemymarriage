import { Types, ClientSession } from "mongoose";
import {
  WeddingMemberInvite,
  IWeddingMemberInvite,
  InviteRole,
  InviteStatus,
} from "../models/wedding-member-invite.model";
import {
  IWeddingMemberPermissions,
  IWeddingMemberEventScope,
} from "@/modules/weddings/models/wedding-member.model";

export interface CreateInviteRepoParams {
  weddingId: Types.ObjectId;
  invitedEmail: string;
  normalizedEmail: string;
  role: InviteRole;
  permissions: IWeddingMemberPermissions;
  eventScope: IWeddingMemberEventScope;
  tokenHash: string;
  expiresAt: Date;
  invitedBy: Types.ObjectId;
}

export class TeamInviteRepository {
  /**
   * Creates a new WeddingMemberInvite document.
   */
  static async createInvite(
    params: CreateInviteRepoParams,
    session?: ClientSession
  ): Promise<IWeddingMemberInvite> {
    const inviteDoc = new WeddingMemberInvite({
      weddingId: params.weddingId,
      invitedEmail: params.invitedEmail,
      normalizedEmail: params.normalizedEmail,
      role: params.role,
      permissions: params.permissions,
      eventScope: params.eventScope,
      tokenHash: params.tokenHash,
      status: "PENDING",
      expiresAt: params.expiresAt,
      invitedBy: params.invitedBy,
    });

    return await inviteDoc.save({ session });
  }

  /**
   * Finds all pending invitations for a wedding.
   */
  static async findPendingInvitesByWeddingId(
    weddingId: string | Types.ObjectId
  ): Promise<IWeddingMemberInvite[]> {
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    return await WeddingMemberInvite.find({
      weddingId: wId,
      status: "PENDING",
    })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Finds a pending invite by normalized email and weddingId.
   */
  static async findPendingInviteByEmail({
    weddingId,
    normalizedEmail,
  }: {
    weddingId: string | Types.ObjectId;
    normalizedEmail: string;
  }): Promise<IWeddingMemberInvite | null> {
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    return await WeddingMemberInvite.findOne({
      weddingId: wId,
      normalizedEmail,
      status: "PENDING",
    }).exec();
  }

  /**
   * Finds an invitation strictly by tokenHash.
   */
  static async findInviteByTokenHash(tokenHash: string): Promise<IWeddingMemberInvite | null> {
    return await WeddingMemberInvite.findOne({ tokenHash }).exec();
  }

  /**
   * Finds an invite by ID and weddingId.
   */
  static async findByIdAndWeddingId({
    weddingId,
    inviteId,
  }: {
    weddingId: string | Types.ObjectId;
    inviteId: string | Types.ObjectId;
  }): Promise<IWeddingMemberInvite | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(inviteId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const iId = typeof inviteId === "string" ? new Types.ObjectId(inviteId) : inviteId;

    return await WeddingMemberInvite.findOne({ _id: iId, weddingId: wId }).exec();
  }

  /**
   * Updates invite status (e.g., ACCEPTED, REVOKED, EXPIRED).
   */
  static async updateInviteStatus({
    inviteId,
    status,
    acceptedBy,
    acceptedAt,
    session,
  }: {
    inviteId: string | Types.ObjectId;
    status: InviteStatus;
    acceptedBy?: Types.ObjectId;
    acceptedAt?: Date;
    session?: ClientSession;
  }): Promise<IWeddingMemberInvite | null> {
    const iId = typeof inviteId === "string" ? new Types.ObjectId(inviteId) : inviteId;

    const updateFields: Record<string, unknown> = { status };
    if (acceptedBy) updateFields.acceptedBy = acceptedBy;
    if (acceptedAt) updateFields.acceptedAt = acceptedAt;

    return await WeddingMemberInvite.findOneAndUpdate(
      { _id: iId },
      { $set: updateFields },
      { new: true, session }
    ).exec();
  }

  /**
   * Refreshes invitation token and expiration for resending.
   */
  static async refreshInviteForResend({
    inviteId,
    weddingId,
    newTokenHash,
    expiresAt,
  }: {
    inviteId: string | Types.ObjectId;
    weddingId: string | Types.ObjectId;
    newTokenHash: string;
    expiresAt: Date;
  }): Promise<IWeddingMemberInvite | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(inviteId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const iId = typeof inviteId === "string" ? new Types.ObjectId(inviteId) : inviteId;

    return await WeddingMemberInvite.findOneAndUpdate(
      { _id: iId, weddingId: wId, status: "PENDING" },
      { $set: { tokenHash: newTokenHash, expiresAt, status: "PENDING" } },
      { new: true }
    ).exec();
  }
}
