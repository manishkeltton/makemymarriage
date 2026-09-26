import { z } from "zod";

export const checkoutSchema = z.object({
  planId: z.enum(["FREE", "PREMIUM"]),
  billingCycle: z.enum(["MONTHLY", "ANNUAL", "ONETIME"]).default("ONETIME"),
  provider: z.enum(["SANDBOX", "RAZORPAY", "STRIPE"]).default("SANDBOX"),
});

export const cancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
});

export const platformAdminOverrideSchema = z.object({
  planId: z.enum(["FREE", "PREMIUM"]),
  status: z.enum(["INACTIVE", "ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"]),
  reason: z.string().min(5, "Audit reason must be at least 5 characters"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type PlatformAdminOverrideInput = z.infer<typeof platformAdminOverrideSchema>;
