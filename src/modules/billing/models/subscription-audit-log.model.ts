import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISubscriptionAuditLog extends Document {
  subscriptionId: Types.ObjectId;
  weddingId: Types.ObjectId;
  performedBy: Types.ObjectId;
  previousPlan: string;
  newPlan: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
  createdAt: Date;
}

const SubscriptionAuditLogSchema = new Schema<ISubscriptionAuditLog>(
  {
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "WeddingSubscription",
      required: true,
      index: true,
    },
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    previousPlan: {
      type: String,
      required: true,
    },
    newPlan: {
      type: String,
      required: true,
    },
    previousStatus: {
      type: String,
      required: true,
    },
    newStatus: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SubscriptionAuditLog: Model<ISubscriptionAuditLog> =
  mongoose.models.SubscriptionAuditLog ||
  mongoose.model<ISubscriptionAuditLog>("SubscriptionAuditLog", SubscriptionAuditLogSchema);
