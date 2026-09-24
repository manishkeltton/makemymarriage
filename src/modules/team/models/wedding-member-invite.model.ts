import mongoose, { Schema, Document, Model, Types } from "mongoose";
import {
  IWeddingMemberPermissions,
  IWeddingMemberEventScope,
} from "@/modules/weddings/models/wedding-member.model";

export type InviteRole = "ADMIN" | "MANAGER" | "ORGANISER";
export type InviteStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export interface IWeddingMemberInvite extends Document {
  weddingId: Types.ObjectId;
  invitedEmail: string;
  normalizedEmail: string;
  role: InviteRole;
  permissions: IWeddingMemberPermissions;
  eventScope: IWeddingMemberEventScope;
  tokenHash: string;
  status: InviteStatus;
  expiresAt: Date;
  invitedBy: Types.ObjectId;
  acceptedBy?: Types.ObjectId;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionsSchema = new Schema<IWeddingMemberPermissions>(
  {
    guests: { type: Boolean, default: true },
    vendors: { type: Boolean, default: true },
    finance: { type: Boolean, default: true },
    gallery: { type: Boolean, default: true },
    website: { type: Boolean, default: true },
    guestbook: { type: Boolean, default: true },
    emergency: { type: Boolean, default: true },
  },
  { _id: false }
);

const EventScopeSchema = new Schema<IWeddingMemberEventScope>(
  {
    allEvents: { type: Boolean, default: true },
    eventIds: [{ type: Schema.Types.ObjectId, ref: "Event" }],
  },
  { _id: false }
);

const WeddingMemberInviteSchema = new Schema<IWeddingMemberInvite>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      index: true,
    },
    invitedEmail: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "MANAGER", "ORGANISER"],
      required: true,
    },
    permissions: {
      type: PermissionsSchema,
      required: true,
    },
    eventScope: {
      type: EventScopeSchema,
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"],
      default: "PENDING",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    acceptedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

WeddingMemberInviteSchema.index({ weddingId: 1, normalizedEmail: 1, status: 1 });

export const WeddingMemberInvite: Model<IWeddingMemberInvite> =
  mongoose.models.WeddingMemberInvite ||
  mongoose.model<IWeddingMemberInvite>("WeddingMemberInvite", WeddingMemberInviteSchema);
