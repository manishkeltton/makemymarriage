import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date;
  revokedAt?: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: "0s" }, // Automatically delete expired sessions
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
