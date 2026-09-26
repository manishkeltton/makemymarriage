import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type GuestbookType = "TEXT" | "AUDIO" | "VIDEO";
export type GuestbookStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface IGuestbookEntry extends Document {
  weddingId: Types.ObjectId;
  householdId?: Types.ObjectId;
  guestName: string;
  type: GuestbookType;
  text?: string;
  mediaId?: Types.ObjectId;
  status: GuestbookStatus;
  createdAt: Date;
  moderatedAt?: Date;
  moderatedBy?: Types.ObjectId;
}

const GuestbookEntrySchema = new Schema<IGuestbookEntry>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      index: true,
    },
    householdId: {
      type: Schema.Types.ObjectId,
      ref: "GuestHousehold",
      index: true,
    },
    guestName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["TEXT", "AUDIO", "VIDEO"],
      required: true,
      default: "TEXT",
    },
    text: {
      type: String,
      trim: true,
    },
    mediaId: {
      type: Schema.Types.ObjectId,
      ref: "Media",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    moderatedAt: {
      type: Date,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes matching Database Design #28
GuestbookEntrySchema.index({ weddingId: 1, status: 1, createdAt: -1 });
GuestbookEntrySchema.index({ weddingId: 1, householdId: 1 });

export const GuestbookEntryModel: Model<IGuestbookEntry> =
  mongoose.models.GuestbookEntry || mongoose.model<IGuestbookEntry>("GuestbookEntry", GuestbookEntrySchema);
