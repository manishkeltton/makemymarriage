import { User } from "@/lib/db/models/User";
import { Wedding } from "@/modules/weddings/models/wedding.model";
import { WeddingSubscription } from "@/modules/billing/models/subscription.model";
import { SubscriptionAuditLog } from "@/modules/billing/models/subscription-audit-log.model";
import { MediaModel } from "@/modules/media/models/media.model";
import { PlatformAdminOverrideInput } from "@/modules/billing/validation/billing.validation";
import { connectToDatabase } from "@/lib/db/connect";
import { AppError } from "@/shared/errors/app-error";
import { Types } from "mongoose";

export class PlatformAdminService {
  static async assertPlatformAdmin(userId: string): Promise<void> {
    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user || !user.isPlatformAdmin) {
      throw new AppError(
        "FORBIDDEN",
        "Platform Admin privilege required to access this resource",
        403
      );
    }
  }

  static async getPlatformMetrics(adminUserId: string) {
    await this.assertPlatformAdmin(adminUserId);

    const [totalUsers, totalWeddings, subscriptionsBreakdown, totalStorageAggregation] =
      await Promise.all([
        User.countDocuments({}),
        Wedding.countDocuments({ status: { $ne: "ARCHIVED" } }),
        WeddingSubscription.aggregate([
          { $group: { _id: { planId: "$planId", status: "$status" }, count: { $sum: 1 } } },
        ]),
        MediaModel.aggregate([
          { $match: { status: { $in: ["APPROVED", "UPLOADED"] } } },
          { $group: { _id: null, totalBytes: { $sum: "$sizeBytes" } } },
        ]),
      ]);

    const totalStorageBytes = totalStorageAggregation[0]?.totalBytes || 0;

    return {
      totalUsers,
      totalWeddings,
      totalStorageBytes,
      totalStorageMB: Math.round(totalStorageBytes / (1024 * 1024)),
      subscriptionsBreakdown: subscriptionsBreakdown.map((item) => ({
        planId: item._id.planId,
        status: item._id.status,
        count: item.count,
      })),
    };
  }

  static async searchWeddings(adminUserId: string, search?: string) {
    await this.assertPlatformAdmin(adminUserId);

    const query: Record<string, unknown> = {};
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ title: regex }, { "bride.name": regex }, { "groom.name": regex }];
    }

    const weddings = await Wedding.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const weddingIds = weddings.map((w) => w._id);
    const subscriptions = await WeddingSubscription.find({ weddingId: { $in: weddingIds } }).lean();

    const subMap = new Map(subscriptions.map((s) => [s.weddingId.toString(), s]));

    return weddings.map((w) => {
      const sub = subMap.get(w._id.toString());
      return {
        id: w._id.toString(),
        title: w.title,
        brideName: w.bride.name,
        groomName: w.groom.name,
        primaryWeddingDate: w.primaryWeddingDate.toISOString(),
        createdAt: w.createdAt.toISOString(),
        subscription: sub
          ? {
              id: sub._id.toString(),
              planId: sub.planId,
              status: sub.status,
              provider: sub.provider,
              currentPeriodStart: sub.currentPeriodStart.toISOString(),
            }
          : {
              planId: "FREE",
              status: "ACTIVE",
              provider: "SANDBOX",
            },
      };
    });
  }

  static async overrideSubscription(
    adminUserId: string,
    subscriptionId: string,
    input: PlatformAdminOverrideInput
  ) {
    await this.assertPlatformAdmin(adminUserId);

    const sub = await WeddingSubscription.findById(subscriptionId);
    if (!sub) {
      throw new AppError("RESOURCE_NOT_FOUND", "Subscription record not found", 404);
    }

    const previousPlan = sub.planId;
    const previousStatus = sub.status;

    sub.planId = input.planId;
    sub.status = input.status;
    await sub.save();

    // Record Audit Log
    await SubscriptionAuditLog.create({
      subscriptionId: sub._id,
      weddingId: sub.weddingId,
      performedBy: new Types.ObjectId(adminUserId),
      previousPlan,
      newPlan: input.planId,
      previousStatus,
      newStatus: input.status,
      reason: input.reason,
    });

    return {
      success: true,
      subscription: {
        id: sub._id.toString(),
        weddingId: sub.weddingId.toString(),
        planId: sub.planId,
        status: sub.status,
      },
    };
  }
}
