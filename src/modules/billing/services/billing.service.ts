import { SubscriptionRepository } from "../repositories/subscription.repository";
import { SandboxProvider } from "../providers/sandbox.provider";
import { CheckoutInput } from "../validation/billing.validation";
import { CheckoutSessionDTO, SubscriptionDTO } from "../dto/billing.dto";
import { EntitlementService, toSubscriptionDTO } from "./entitlement.service";
import { BillingEventLog } from "../models/billing-event-log.model";
import { SubscriptionAuditLog } from "../models/subscription-audit-log.model";
import { connectToDatabase } from "@/lib/db/connect";
import { AppError } from "@/shared/errors/app-error";
import crypto from "crypto";

export class BillingService {
  static async getSubscription(weddingId: string, userId?: string): Promise<SubscriptionDTO> {
    const sub = await EntitlementService.getOrCreateSubscription(weddingId, userId);
    return toSubscriptionDTO(sub);
  }

  static async createCheckoutSession(
    weddingId: string,
    userId: string,
    input: CheckoutInput
  ): Promise<CheckoutSessionDTO> {
    await EntitlementService.getOrCreateSubscription(weddingId, userId);

    if (input.planId === "FREE") {
      // Downgrade to FREE
      await SubscriptionRepository.updateSubscription(weddingId, {
        planId: "FREE",
        status: "ACTIVE",
        canceledAt: new Date(),
      });

      return {
        provider: input.provider,
        planId: "FREE",
        amountINR: 0,
        currency: "INR",
        sandboxInstantComplete: true,
      };
    }

    if (input.provider === "SANDBOX") {
      const session = await SandboxProvider.createCheckoutSession(weddingId, userId, input.planId);

      // Instantly upgrade subscription in SANDBOX mode
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      await SubscriptionRepository.updateSubscription(weddingId, {
        planId: "PREMIUM",
        status: "ACTIVE",
        provider: "SANDBOX",
        billingCycle: input.billingCycle,
        providerSubscriptionId: session.orderId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: oneYearLater,
        canceledAt: null,
      });

      return session;
    }

    // For Razorpay / Stripe sandbox fallback
    const session = await SandboxProvider.createCheckoutSession(weddingId, userId, input.planId);
    return session;
  }

  static async cancelSubscription(weddingId: string, userId: string): Promise<SubscriptionDTO> {
    const sub = await SubscriptionRepository.findByWeddingId(weddingId);
    if (!sub) {
      throw new AppError("RESOURCE_NOT_FOUND", "Subscription record not found", 404);
    }

    const updated = await SubscriptionRepository.updateSubscription(weddingId, {
      status: "CANCELED",
      canceledAt: new Date(),
    });

    if (!updated) {
      throw new AppError("INTERNAL_ERROR", "Failed to cancel subscription", 500);
    }

    await SubscriptionAuditLog.create({
      subscriptionId: sub._id,
      weddingId: sub.weddingId,
      performedBy: userId,
      previousPlan: sub.planId,
      newPlan: sub.planId,
      previousStatus: sub.status,
      newStatus: "CANCELED",
      reason: "User requested subscription cancellation",
    }).catch((err) => {
      console.warn("Failed to create cancellation audit log:", err);
    });

    return toSubscriptionDTO(updated);
  }

  static async processWebhookEvent(
    provider: string,
    signature: string,
    rawBody: string,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; message: string; duplicate?: boolean }> {
    await connectToDatabase();

    const providerEventId =
      (payload.id as string) ||
      (payload.event_id as string) ||
      `evt_${crypto.createHash("md5").update(rawBody).digest("hex")}`;

    // 1. Idempotency Check
    const existingLog = await BillingEventLog.findOne({ providerEventId });
    if (existingLog) {
      return { success: true, message: "Event already processed", duplicate: true };
    }

    // 2. Verify Signature
    const webhookSecret = process.env.BILLING_WEBHOOK_SECRET || "sandbox_secret_key_123";
    const isValidSignature = SandboxProvider.verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValidSignature && provider !== "SANDBOX") {
      throw new AppError("UNAUTHORIZED", "Invalid webhook signature", 401);
    }

    // 3. Process Event Payload
    const eventType = (payload.event as string) || (payload.type as string) || "order.paid";
    const eventData = (payload.data as Record<string, unknown>) || payload;
    const weddingId = (eventData.weddingId as string) || (payload.weddingId as string);

    if (weddingId) {
      if (eventType === "order.paid" || eventType === "subscription.charged") {
        const oneYearLater = new Date();
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

        await SubscriptionRepository.updateSubscription(weddingId, {
          planId: "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: oneYearLater,
        });
      } else if (eventType === "payment.failed" || eventType === "subscription.halted") {
        const graceEnd = new Date();
        graceEnd.setDate(graceEnd.getDate() + 7); // 7 day grace period

        await SubscriptionRepository.updateSubscription(weddingId, {
          status: "PAST_DUE",
          gracePeriodEnd: graceEnd,
        });
      } else if (eventType === "subscription.cancelled") {
        await SubscriptionRepository.updateSubscription(weddingId, {
          status: "CANCELED",
          canceledAt: new Date(),
        });
      }
    }

    // 4. Record Event Log
    await BillingEventLog.create({
      providerEventId,
      provider,
      eventType,
      payload,
      processedAt: new Date(),
      status: "PROCESSED",
    });

    return { success: true, message: "Webhook processed successfully" };
  }
}
