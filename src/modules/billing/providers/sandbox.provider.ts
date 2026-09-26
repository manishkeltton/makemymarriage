import { CheckoutSessionDTO } from "../dto/billing.dto";
import { PLAN_DEFINITIONS, PlanId } from "../config/plans.config";

export class SandboxProvider {
  static async createCheckoutSession(
    weddingId: string,
    userId: string,
    planId: PlanId
  ): Promise<CheckoutSessionDTO> {
    const plan = PLAN_DEFINITIONS[planId];
    const orderId = `sandbox_ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      provider: "SANDBOX",
      planId,
      amountINR: plan.priceINR,
      currency: "INR",
      orderId,
      sandboxInstantComplete: true,
      checkoutUrl: `/api/v1/weddings/${weddingId}/billing/checkout?sandboxOrderId=${orderId}&complete=true`,
    };
  }

  static verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    // Sandbox signature format: sandbox_sig_<sha256> or matching test signature
    return signature === secret || signature.startsWith("sandbox_sig_") || rawBody.includes("sandbox");
  }
}
