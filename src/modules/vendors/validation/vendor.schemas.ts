import { z } from "zod";
import { VENDOR_CATEGORIES } from "../models/vendor.model";
import { rupeesToPaise } from "@/lib/utils/money";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, "Invalid ObjectId format");

export const createVendorSchema = z.object({
  name: z.string().trim().min(1, "Vendor name is required").max(200, "Vendor name is too long"),
  category: z.enum(VENDOR_CATEGORIES, { message: "Invalid vendor category" }),
  contactPerson: z.string().trim().max(200, "Contact person name is too long").optional(),
  phone: z.string().trim().max(50, "Phone number is too long").optional(),
  email: z.string().trim().email("Invalid email format").max(254, "Email is too long").optional().or(z.literal("")),
  address: z.string().trim().max(1000, "Address is too long").optional(),
  website: z.string().trim().max(500, "Website URL is too long").optional().or(z.literal("")),
  socialUrl: z.string().trim().max(500, "Social profile URL is too long").optional().or(z.literal("")),
  eventIds: z.array(objectIdSchema).optional().default([]),
  agreedAmountRupees: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val !== undefined && val !== "" ? rupeesToPaise(val) : undefined)),
  agreedAmountPaise: z.number().int().min(0, "Agreed amount cannot be negative").optional(),
  notes: z.string().trim().max(2000, "Notes are too long").optional(),
});

export const updateVendorSchema = z.object({
  name: z.string().trim().min(1, "Vendor name cannot be empty").max(200, "Vendor name is too long").optional(),
  category: z.enum(VENDOR_CATEGORIES, { message: "Invalid vendor category" }).optional(),
  contactPerson: z.string().trim().max(200, "Contact person name is too long").optional().nullable(),
  phone: z.string().trim().max(50, "Phone number is too long").optional().nullable(),
  email: z.string().trim().email("Invalid email format").max(254, "Email is too long").optional().nullable().or(z.literal("")),
  address: z.string().trim().max(1000, "Address is too long").optional().nullable(),
  website: z.string().trim().max(500, "Website URL is too long").optional().nullable().or(z.literal("")),
  socialUrl: z.string().trim().max(500, "Social profile URL is too long").optional().nullable().or(z.literal("")),
  eventIds: z.array(objectIdSchema).optional(),
  agreedAmountRupees: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => (val !== undefined && val !== null && val !== "" ? rupeesToPaise(val) : val === null ? null : undefined)),
  agreedAmountPaise: z.number().int().min(0, "Agreed amount cannot be negative").optional().nullable(),
  notes: z.string().trim().max(2000, "Notes are too long").optional().nullable(),
});

export type CreateVendorInput = z.input<typeof createVendorSchema>;
export type UpdateVendorInput = z.input<typeof updateVendorSchema>;
