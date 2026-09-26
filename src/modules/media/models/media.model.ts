import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
export type MediaVisibility = "PUBLIC" | "RESTRICTED" | "PRIVATE";
export type MediaStatus = "PENDING_UPLOAD" | "UPLOADED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
export type UploadedByType = "MEMBER" | "GUEST";

export interface IMedia extends Document {
  weddingId: Types.ObjectId;
  albumId?: Types.ObjectId;
  objectKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  mediaType: MediaType;
  visibility: MediaVisibility;
  status: MediaStatus;
  uploadedByType: UploadedByType;
  uploadedByUserId?: Types.ObjectId;
  uploadedByHouseholdId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      index: true,
    },
    albumId: {
      type: Schema.Types.ObjectId,
      ref: "Album",
      index: true,
    },
    objectKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"],
      required: true,
    },
    visibility: {
      type: String,
      enum: ["PUBLIC", "RESTRICTED", "PRIVATE"],
      default: "PUBLIC",
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING_UPLOAD", "UPLOADED", "PENDING_APPROVAL", "APPROVED", "REJECTED"],
      default: "PENDING_UPLOAD",
      index: true,
    },
    uploadedByType: {
      type: String,
      enum: ["MEMBER", "GUEST"],
      required: true,
    },
    uploadedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    uploadedByHouseholdId: {
      type: Schema.Types.ObjectId,
      ref: "GuestHousehold",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes matching Database Design #24
MediaSchema.index({ weddingId: 1, albumId: 1, createdAt: -1 });
MediaSchema.index({ weddingId: 1, status: 1, createdAt: -1 });
MediaSchema.index({ weddingId: 1, visibility: 1 });

export const MediaModel: Model<IMedia> =
  mongoose.models.Media || mongoose.model<IMedia>("Media", MediaSchema);
