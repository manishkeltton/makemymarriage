import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type AlbumVisibility = "GUESTS" | "PUBLIC" | "PRIVATE";

export interface IAlbum extends Document {
  weddingId: Types.ObjectId;
  eventId?: Types.ObjectId;
  name: string;
  description?: string;
  visibility: AlbumVisibility;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AlbumSchema = new Schema<IAlbum>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    visibility: {
      type: String,
      enum: ["GUESTS", "PUBLIC", "PRIVATE"],
      default: "GUESTS",
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes matching Database Design #26
AlbumSchema.index({ weddingId: 1, eventId: 1 });
AlbumSchema.index({ weddingId: 1, visibility: 1 });

export const AlbumModel: Model<IAlbum> =
  mongoose.models.Album || mongoose.model<IAlbum>("Album", AlbumSchema);
