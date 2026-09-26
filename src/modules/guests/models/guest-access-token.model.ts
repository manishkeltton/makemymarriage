import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGuestAccessToken extends Document {
  _id: Types.ObjectId;
  weddingId: Types.ObjectId;
  householdId: Types.ObjectId;
  tokenHash: string;
  expiresAt?: Date;
  revokedAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
}

const GuestAccessTokenSchema = new Schema<IGuestAccessToken>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: [true, "weddingId is required"],
      index: true,
    },
    householdId: {
      type: Schema.Types.ObjectId,
      ref: "GuestHousehold",
      required: [true, "householdId is required"],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, "tokenHash is required"],
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    revokedAt: {
      type: Date,
    },
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes per Database Design document section 19
GuestAccessTokenSchema.index({ weddingId: 1, householdId: 1 });

export const GuestAccessTokenModel =
  mongoose.models.GuestAccessToken ||
  mongoose.model<IGuestAccessToken>("GuestAccessToken", GuestAccessTokenSchema, "guest_access_tokens");
