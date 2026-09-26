import { connectToDatabase } from "@/lib/db/connect";
import { WeddingSubscription, IWeddingSubscription, PlanType, SubscriptionStatus, BillingProvider, BillingCycle } from "../models/subscription.model";
import { Types } from "mongoose";

export class SubscriptionRepository {
  static async findByWeddingId(weddingId: string | Types.ObjectId): Promise<IWeddingSubscription | null> {
    await connectToDatabase();
    return WeddingSubscription.findOne({ weddingId: new Types.ObjectId(weddingId) });
  }

  static async findByProviderSubscriptionId(providerSubscriptionId: string): Promise<IWeddingSubscription | null> {
    await connectToDatabase();
    return WeddingSubscription.findOne({ providerSubscriptionId });
  }

  static async createDefaultFreeSubscription(
    weddingId: string | Types.ObjectId,
    billingOwnerId: string | Types.ObjectId
  ): Promise<IWeddingSubscription> {
    await connectToDatabase();
    return WeddingSubscription.create({
      weddingId: new Types.ObjectId(weddingId),
      billingOwnerId: new Types.ObjectId(billingOwnerId),
      planId: "FREE",
      billingCycle: "ONETIME",
      status: "ACTIVE",
      provider: "SANDBOX",
      currentPeriodStart: new Date(),
    });
  }

  static async updateSubscription(
    weddingId: string | Types.ObjectId,
    update: {
      planId?: PlanType;
      status?: SubscriptionStatus;
      billingCycle?: BillingCycle;
      provider?: BillingProvider;
      providerSubscriptionId?: string | null;
      providerCustomerId?: string | null;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date | null;
      gracePeriodEnd?: Date | null;
      canceledAt?: Date | null;
    }
  ): Promise<IWeddingSubscription | null> {
    await connectToDatabase();
    return WeddingSubscription.findOneAndUpdate(
      { weddingId: new Types.ObjectId(weddingId) },
      { $set: update },
      { new: true }
    );
  }
}
