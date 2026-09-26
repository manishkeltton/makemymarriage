import { PlanId, PlanLimits } from "../config/plans.config";
import { SubscriptionStatus, BillingCycle, BillingProvider } from "../models/subscription.model";

export interface SubscriptionDTO {
  id: string;
  weddingId: string;
  billingOwnerId: string;
  planId: PlanId;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  provider: BillingProvider;
  providerSubscriptionId?: string | null;
  currentPeriodStart: string;
  currentPeriodEnd?: string | null;
  gracePeriodEnd?: string | null;
  canceledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceUsageMetrics {
  eventsCount: number;
  teamMembersCount: number;
  guestHouseholdsCount: number;
  tasksCount: number;
  storageBytes: number;
}

export interface EntitlementsDTO {
  planId: PlanId;
  planName: string;
  status: SubscriptionStatus;
  limits: PlanLimits;
  usage: WorkspaceUsageMetrics;
  quotaUsagePercent: {
    events: number;
    teamMembers: number;
    guestHouseholds: number;
    tasks: number;
    storage: number;
  };
}

export interface CheckoutSessionDTO {
  checkoutUrl?: string;
  orderId?: string;
  provider: BillingProvider;
  planId: PlanId;
  amountINR: number;
  currency: string;
  sandboxInstantComplete?: boolean;
}
