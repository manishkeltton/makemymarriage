import { IVendor } from "../models/vendor.model";

export const VENDOR_CATEGORIES = [
  "VENUE",
  "CATERER",
  "PHOTOGRAPHER",
  "VIDEOGRAPHER",
  "DECORATOR",
  "DJ",
  "CHOREOGRAPHER",
  "MAKEUP_ARTIST",
  "MEHENDI_ARTIST",
  "PANDIT",
  "INVITATION_DESIGNER",
  "ENTERTAINMENT",
  "OTHER",
] as const;

export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

export interface VendorDTO {
  id: string;
  weddingId: string;
  name: string;
  category: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  socialUrl?: string;
  eventIds: string[];
  agreedAmountPaise?: number;
  currency: "INR";
  notes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  // Optional enriched field maps
  events?: Array<{ id: string; name: string }>;
  financials?: {
    agreedAmountPaise: number;
    totalExpensesPaise: number;
    totalPaidPaise: number;
    totalOutstandingPaise: number;
  };
}

export function toVendorDTO(
  vendor: IVendor,
  extra?: {
    events?: Array<{ id: string; name: string }>;
    financials?: {
      agreedAmountPaise: number;
      totalExpensesPaise: number;
      totalPaidPaise: number;
      totalOutstandingPaise: number;
    };
  }
): VendorDTO {
  return {
    id: vendor._id.toString(),
    weddingId: vendor.weddingId.toString(),
    name: vendor.name,
    category: vendor.category,
    contactPerson: vendor.contactPerson || undefined,
    phone: vendor.phone || undefined,
    email: vendor.email || undefined,
    address: vendor.address || undefined,
    website: vendor.website || undefined,
    socialUrl: vendor.socialUrl || undefined,
    eventIds: (vendor.eventIds || []).map((id) => id.toString()),
    agreedAmountPaise: vendor.agreedAmountPaise,
    currency: vendor.currency || "INR",
    notes: vendor.notes || undefined,
    createdBy: vendor.createdBy.toString(),
    updatedBy: vendor.updatedBy ? vendor.updatedBy.toString() : undefined,
    createdAt: vendor.createdAt.toISOString(),
    updatedAt: vendor.updatedAt.toISOString(),
    events: extra?.events,
    financials: extra?.financials,
  };
}
