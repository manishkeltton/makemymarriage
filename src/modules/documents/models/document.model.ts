import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type DocumentType =
  | "CONTRACT"
  | "INVOICE"
  | "RECEIPT"
  | "QUOTATION"
  | "MENU"
  | "OTHER";

export type DocumentRelatedType = "EVENT" | "TASK" | "VENDOR" | "EXPENSE";

export interface IDocument extends Document {
  weddingId: Types.ObjectId;
  type: DocumentType;
  relatedTo?: {
    type: DocumentRelatedType;
    id: Types.ObjectId;
  };
  mediaId?: Types.ObjectId;
  title: string;
  fileKey?: string;
  mimeType?: string;
  fileSize?: number;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["CONTRACT", "INVOICE", "RECEIPT", "QUOTATION", "MENU", "OTHER"],
      default: "OTHER",
    },
    relatedTo: {
      type: {
        type: String,
        enum: ["EVENT", "TASK", "VENDOR", "EXPENSE"],
      },
      id: {
        type: Schema.Types.ObjectId,
      },
    },
    mediaId: {
      type: Schema.Types.ObjectId,
      ref: "Media",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    fileKey: {
      type: String,
      trim: true,
    },
    mimeType: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes specified in Database Design #25
DocumentSchema.index({ weddingId: 1, "relatedTo.type": 1, "relatedTo.id": 1 });

export const DocumentModel: Model<IDocument> =
  mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);
