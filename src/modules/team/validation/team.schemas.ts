import { z } from "zod";
import { Types } from "mongoose";

const objectIdString = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId string",
});

export const memberPermissionsSchema = z.object({
  guests: z.boolean().default(true),
  vendors: z.boolean().default(true),
  finance: z.boolean().default(true),
  gallery: z.boolean().default(true),
  website: z.boolean().default(true),
  guestbook: z.boolean().default(true),
  emergency: z.boolean().default(true),
});

export const memberEventScopeSchema = z.object({
  allEvents: z.boolean().default(true),
  eventIds: z.array(objectIdString).default([]),
});

export const createInviteSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  role: z.enum(["ADMIN", "MANAGER", "ORGANISER"]),
  permissions: memberPermissionsSchema.optional().default({
    guests: true,
    vendors: true,
    finance: true,
    gallery: true,
    website: true,
    guestbook: true,
    emergency: true,
  }),
  eventScope: memberEventScopeSchema.optional().default({
    allEvents: true,
    eventIds: [],
  }),
});

export const updateMemberSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "ORGANISER"]).optional(),
  permissions: memberPermissionsSchema.optional(),
  eventScope: memberEventScopeSchema.optional(),
});

export interface CreateInviteInput {
  email: string;
  role: "ADMIN" | "MANAGER" | "ORGANISER";
  permissions?: {
    guests?: boolean;
    vendors?: boolean;
    finance?: boolean;
    gallery?: boolean;
    website?: boolean;
    guestbook?: boolean;
    emergency?: boolean;
  };
  eventScope?: {
    allEvents?: boolean;
    eventIds?: string[];
  };
}

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
