import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IWeddingMemberPermissions {
  guests: boolean;
  vendors: boolean;
  finance: boolean;
  gallery: boolean;
  website: boolean;
  guestbook: boolean;
  emergency: boolean;
}

export interface IWeddingMemberEventScope {
  allEvents: boolean;
  eventIds: Types.ObjectId[];
}

export interface IWeddingMember extends Document {
  weddingId: Types.ObjectId;
  userId: Types.ObjectId;
  role: "ADMIN" | "MANAGER" | "ORGANISER";
  permissions: IWeddingMemberPermissions;
  eventScope: IWeddingMemberEventScope;
  status: "ACTIVE" | "REMOVED";
  joinedAt: Date;
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

const WeddingMemberSchema = new Schema<IWeddingMember>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "MANAGER", "ORGANISER"],
      default: "ADMIN",
    },
    permissions: {
      type: PermissionsSchema,
      default: () => ({
        guests: true,
        vendors: true,
        finance: true,
        gallery: true,
        website: true,
        guestbook: true,
        emergency: true,
      }),
    },
    eventScope: {
      type: EventScopeSchema,
      default: () => ({
        allEvents: true,
        eventIds: [],
      }),
    },
    status: {
      type: String,
      enum: ["ACTIVE", "REMOVED"],
      default: "ACTIVE",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

WeddingMemberSchema.index({ weddingId: 1, userId: 1 }, { unique: true });
WeddingMemberSchema.index({ userId: 1, status: 1 });
WeddingMemberSchema.index({ weddingId: 1, role: 1 });

export const WeddingMember: Model<IWeddingMember> =
  mongoose.models.WeddingMember ||
  mongoose.model<IWeddingMember>("WeddingMember", WeddingMemberSchema);
