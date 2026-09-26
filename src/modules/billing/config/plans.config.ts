export type PlanId = "FREE" | "PREMIUM";

export interface PlanLimits {
  maxEvents: number;
  maxTeamMembers: number;
  maxGuestHouseholds: number;
  maxTasks: number;
  maxStorageBytes: number; // 500 MB for FREE, 10 GB for PREMIUM
  allowVideoMedia: boolean;
  allowCustomWebsiteThemes: boolean;
  allowedWebsiteThemes: string[];
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  priceINR: number;
  limits: PlanLimits;
}

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Free Starter",
    description: "Essential planning tools for intimate Hindu weddings",
    priceINR: 0,
    limits: {
      maxEvents: 3,
      maxTeamMembers: 3,
      maxGuestHouseholds: 50,
      maxTasks: 50,
      maxStorageBytes: 500 * 1024 * 1024, // 500 MB
      allowVideoMedia: false,
      allowCustomWebsiteThemes: false,
      allowedWebsiteThemes: ["FLORAL_PASTEL", "VINTAGE_SEPIA", "MINIMAL_ELEGANCE"],
    },
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium Celebration",
    description: "Complete unconstrained wedding workspace for large celebrations",
    priceINR: 2999,
    limits: {
      maxEvents: 100,
      maxTeamMembers: 50,
      maxGuestHouseholds: 1000,
      maxTasks: 1000,
      maxStorageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
      allowVideoMedia: true,
      allowCustomWebsiteThemes: true,
      allowedWebsiteThemes: [
        "ROYAL_GOLD",
        "FLORAL_PASTEL",
        "MIDNIGHT_ROMANCE",
        "VINTAGE_SEPIA",
        "MINIMAL_ELEGANCE",
      ],
    },
  },
};
