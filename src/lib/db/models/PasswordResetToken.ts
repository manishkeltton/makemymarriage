import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPasswordResetToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
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
      index: { expires: "0s" }, // Automatically delete expired tokens
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const PasswordResetToken: Model<IPasswordResetToken> =
  mongoose.models.PasswordResetToken || mongoose.model<IPasswordResetToken>("PasswordResetToken", PasswordResetTokenSchema);
