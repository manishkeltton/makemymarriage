import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmailJob extends Document {
  type: string;
  to: string;
  templateData: Record<string, unknown>;
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
  attempts: number;
  scheduledAt: Date;
  lockedAt?: Date;
  lockOwner?: string;
  lastAttemptAt?: Date;
  sentAt?: Date;
  providerMessageId?: string;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailJobSchema = new Schema<IEmailJob>(
  {
    type: {
      type: String,
      required: true,
      index: true,
    },
    to: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    templateData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SENT", "FAILED"],
      default: "PENDING",
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    scheduledAt: {
      type: Date,
      default: Date.now,
    },
    lockedAt: {
      type: Date,
    },
    lockOwner: {
      type: String,
    },
    lastAttemptAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    providerMessageId: {
      type: String,
    },
    lastError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

EmailJobSchema.index({ status: 1, scheduledAt: 1 });

export const EmailJob: Model<IEmailJob> =
  mongoose.models.EmailJob || mongoose.model<IEmailJob>("EmailJob", EmailJobSchema);
