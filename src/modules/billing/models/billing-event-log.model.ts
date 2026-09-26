import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBillingEventLog extends Document {
  providerEventId: string;
  provider: string;
  eventType: string;
  payload: Record<string, unknown>;
  processedAt: Date;
  status: "PROCESSED" | "FAILED" | "IGNORED";
  createdAt: Date;
  updatedAt: Date;
}

const BillingEventLogSchema = new Schema<IBillingEventLog>(
  {
    providerEventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["PROCESSED", "FAILED", "IGNORED"],
      default: "PROCESSED",
    },
  },
  {
    timestamps: true,
  }
);

export const BillingEventLog: Model<IBillingEventLog> =
  mongoose.models.BillingEventLog ||
  mongoose.model<IBillingEventLog>("BillingEventLog", BillingEventLogSchema);
