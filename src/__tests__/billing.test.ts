import { describe, it, expect, vi, beforeEach } from "vitest";
import { PLAN_DEFINITIONS } from "@/modules/billing/config/plans.config";
import { EntitlementService } from "@/modules/billing/services/entitlement.service";
import { BillingService } from "@/modules/billing/services/billing.service";
import { PlatformAdminService } from "@/modules/admin/services/platform-admin.service";
import { SubscriptionRepository } from "@/modules/billing/repositories/subscription.repository";
import { BillingEventLog } from "@/modules/billing/models/billing-event-log.model";
import { User } from "@/lib/db/models/User";
import { WeddingSubscription, IWeddingSubscription } from "@/modules/billing/models/subscription.model";
import { SubscriptionAuditLog } from "@/modules/billing/models/subscription-audit-log.model";
import { Types } from "mongoose";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

describe("SaaS Commercialization — Plan Matrix & Configuration", () => {
  it("should define Free and Premium plan quotas correctly", () => {
    const free = PLAN_DEFINITIONS.FREE;
    const premium = PLAN_DEFINITIONS.PREMIUM;

    expect(free.limits.maxEvents).toBe(3);
    expect(free.limits.maxTeamMembers).toBe(3);
    expect(free.limits.maxGuestHouseholds).toBe(50);
    expect(free.limits.maxTasks).toBe(50);
    expect(free.limits.maxStorageBytes).toBe(500 * 1024 * 1024);
    expect(free.limits.allowVideoMedia).toBe(false);

    expect(premium.limits.maxEvents).toBe(100);
    expect(premium.limits.maxTeamMembers).toBe(50);
    expect(premium.limits.maxGuestHouseholds).toBe(1000);
    expect(premium.limits.maxTasks).toBe(1000);
    expect(premium.limits.maxStorageBytes).toBe(10 * 1024 * 1024 * 1024);
    expect(premium.limits.allowVideoMedia).toBe(true);
  });
});

describe("SaaS Commercialization — Entitlement Engine Guardrails", () => {
  const weddingId = "64b8f0000000000000000002";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should enforce event limit when quota is reached on Free plan", async () => {
    vi.spyOn(EntitlementService, "getEntitlements").mockResolvedValue({
      planId: "FREE",
      planName: "Free Starter",
      status: "ACTIVE",
      limits: PLAN_DEFINITIONS.FREE.limits,
      usage: {
        eventsCount: 3,
        teamMembersCount: 2,
        guestHouseholdsCount: 10,
        tasksCount: 15,
        storageBytes: 100 * 1024 * 1024,
      },
      quotaUsagePercent: { events: 100, teamMembers: 67, guestHouseholds: 20, tasks: 30, storage: 20 },
    });

    await expect(EntitlementService.assertCanCreateEvent(weddingId)).rejects.toThrow(
      "maximum allowed events limit"
    );
  });

  it("should enforce video upload lock on Free plan", async () => {
    vi.spyOn(EntitlementService, "getEntitlements").mockResolvedValue({
      planId: "FREE",
      planName: "Free Starter",
      status: "ACTIVE",
      limits: PLAN_DEFINITIONS.FREE.limits,
      usage: {
        eventsCount: 1,
        teamMembersCount: 1,
        guestHouseholdsCount: 5,
        tasksCount: 5,
        storageBytes: 10 * 1024 * 1024,
      },
      quotaUsagePercent: { events: 33, teamMembers: 33, guestHouseholds: 10, tasks: 10, storage: 2 },
    });

    await expect(
      EntitlementService.assertCanUploadMedia(weddingId, 50 * 1024 * 1024, "VIDEO")
    ).rejects.toThrow("Video and Audio uploads are exclusively available on the Premium plan");
  });

  it("should enforce cumulative storage quota limit", async () => {
    vi.spyOn(EntitlementService, "getEntitlements").mockResolvedValue({
      planId: "FREE",
      planName: "Free Starter",
      status: "ACTIVE",
      limits: PLAN_DEFINITIONS.FREE.limits,
      usage: {
        eventsCount: 1,
        teamMembersCount: 1,
        guestHouseholdsCount: 5,
        tasksCount: 5,
        storageBytes: 490 * 1024 * 1024, // 490 MB used
      },
      quotaUsagePercent: { events: 33, teamMembers: 33, guestHouseholds: 10, tasks: 10, storage: 98 },
    });

    // Request 20 MB upload -> 490 + 20 = 510 MB > 500 MB limit
    await expect(
      EntitlementService.assertCanUploadMedia(weddingId, 20 * 1024 * 1024, "IMAGE")
    ).rejects.toThrow("exceed your storage quota limit");
  });

  it("should lock premium website themes on Free plan", async () => {
    vi.spyOn(EntitlementService, "getEntitlements").mockResolvedValue({
      planId: "FREE",
      planName: "Free Starter",
      status: "ACTIVE",
      limits: PLAN_DEFINITIONS.FREE.limits,
      usage: {
        eventsCount: 1,
        teamMembersCount: 1,
        guestHouseholdsCount: 5,
        tasksCount: 5,
        storageBytes: 10 * 1024 * 1024,
      },
      quotaUsagePercent: { events: 33, teamMembers: 33, guestHouseholds: 10, tasks: 10, storage: 2 },
    });

    await expect(
      EntitlementService.assertCanSelectWebsiteTheme(weddingId, "ROYAL_GOLD")
    ).rejects.toThrow("is an exclusive Premium theme");
  });
});

describe("SaaS Commercialization — Sandbox Provider & Billing Lifecycle", () => {
  const weddingId = "64b8f0000000000000000002";
  const userId = "64b8f0000000000000000001";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should create sandbox checkout session and upgrade subscription to Premium", async () => {
    vi.spyOn(EntitlementService, "getOrCreateSubscription").mockResolvedValue({
      weddingId: new Types.ObjectId(weddingId),
      billingOwnerId: new Types.ObjectId(userId),
      planId: "FREE",
      status: "ACTIVE",
    } as unknown as IWeddingSubscription);

    const spyUpdate = vi.spyOn(SubscriptionRepository, "updateSubscription").mockResolvedValue(null);

    const session = await BillingService.createCheckoutSession(weddingId, userId, {
      planId: "PREMIUM",
      billingCycle: "ONETIME",
      provider: "SANDBOX",
    });

    expect(session.provider).toBe("SANDBOX");
    expect(session.planId).toBe("PREMIUM");
    expect(session.amountINR).toBe(2999);
    expect(spyUpdate).toHaveBeenCalledWith(
      weddingId,
      expect.objectContaining({ planId: "PREMIUM", status: "ACTIVE", provider: "SANDBOX" })
    );
  });

  it("should verify webhook signature and handle duplicate event idempotency", async () => {
    vi.spyOn(BillingEventLog, "findOne").mockResolvedValueOnce({
      providerEventId: "evt_duplicate_123",
      status: "PROCESSED",
    } as unknown as InstanceType<typeof BillingEventLog>);

    const resDuplicate = await BillingService.processWebhookEvent(
      "SANDBOX",
      "sandbox_sig_test",
      JSON.stringify({ id: "evt_duplicate_123", event: "order.paid" }),
      { id: "evt_duplicate_123", event: "order.paid" }
    );

    expect(resDuplicate.duplicate).toBe(true);
    expect(resDuplicate.message).toBe("Event already processed");
  });
});

describe("SaaS Commercialization — Platform Admin Authorization & Overrides", () => {
  const adminUserId = "64b8f0000000000000000099";
  const regularUserId = "64b8f0000000000000000088";
  const subscriptionId = "64b8f0000000000000000077";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should reject non-platform admin users with 403 Forbidden", async () => {
    vi.spyOn(User, "findById").mockResolvedValue({
      _id: new Types.ObjectId(regularUserId),
      isPlatformAdmin: false,
    } as unknown as InstanceType<typeof User>);

    await expect(PlatformAdminService.assertPlatformAdmin(regularUserId)).rejects.toThrow(
      "Platform Admin privilege required"
    );
  });

  it("should permit platform admin and write audit log on subscription override", async () => {
    vi.spyOn(User, "findById").mockResolvedValue({
      _id: new Types.ObjectId(adminUserId),
      isPlatformAdmin: true,
    } as unknown as InstanceType<typeof User>);

    const mockSub = {
      _id: new Types.ObjectId(subscriptionId),
      weddingId: new Types.ObjectId("64b8f0000000000000000002"),
      planId: "FREE",
      status: "ACTIVE",
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(WeddingSubscription, "findById").mockResolvedValue(mockSub as unknown as InstanceType<typeof WeddingSubscription>);
    vi.spyOn(SubscriptionAuditLog, "create").mockResolvedValue({} as never);

    const result = await PlatformAdminService.overrideSubscription(adminUserId, subscriptionId, {
      planId: "PREMIUM",
      status: "ACTIVE",
      reason: "Comped VIP trial account for wedding venue manager",
    });

    expect(result.success).toBe(true);
    expect(mockSub.planId).toBe("PREMIUM");
    expect(SubscriptionAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        previousPlan: "FREE",
        newPlan: "PREMIUM",
        reason: "Comped VIP trial account for wedding venue manager",
      })
    );
  });
});
