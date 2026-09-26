import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type PlanType = "FREE" | "PREMIUM";
export type BillingCycle = "MONTHLY" | "ANNUAL" | "ONETIME";
export type SubscriptionStatus = "INACTIVE" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
export type BillingProvider = "SANDBOX" | "RAZORPAY" | "STRIPE";

export interface IWeddingSubscription extends Document {
  weddingId: Types.ObjectId;
  billingOwnerId: Types.ObjectId;
  planId: PlanType;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  provider: BillingProvider;
  providerSubscriptionId?: string | null;
  providerCustomerId?: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd?: Date | null;
  gracePeriodEnd?: Date | null;
  canceledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const WeddingSubscriptionSchema = new Schema<IWeddingSubscription>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      unique: true,
      index: true,
    },
    billingOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: {
      type: String,
      enum: ["FREE", "PREMIUM"],
      default: "FREE",
      required: true,
      index: true,
    },
    billingCycle: {
      type: String,
      enum: ["MONTHLY", "ANNUAL", "ONETIME"],
      default: "ONETIME",
      required: true,
    },
    status: {
      type: String,
      enum: ["INACTIVE", "ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"],
      default: "ACTIVE",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["SANDBOX", "RAZORPAY", "STRIPE"],
      default: "SANDBOX",
      required: true,
    },
    providerSubscriptionId: {
      type: String,
      default: null,
      index: true,
    },
    providerCustomerId: {
      type: String,
      default: null,
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
    gracePeriodEnd: {
      type: Date,
      default: null,
    },
    canceledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const WeddingSubscription: Model<IWeddingSubscription> =
  mongoose.models.WeddingSubscription ||
  mongoose.model<IWeddingSubscription>("WeddingSubscription", WeddingSubscriptionSchema);
