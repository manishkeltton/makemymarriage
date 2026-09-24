import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  normalizedEmail: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  status: "ACTIVE" | "SUSPENDED";
  preferredLanguage: "en" | "hi";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    normalizedEmail: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
    },
    preferredLanguage: {
      type: String,
      enum: ["en", "hi"],
      default: "en",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose from compiling the model multiple times during HMR
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
