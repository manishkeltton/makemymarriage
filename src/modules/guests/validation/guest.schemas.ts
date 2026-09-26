import { z } from "zod";
import { GUEST_SIDES, INVITATION_STATUSES, RSVP_STATUSES } from "../models/guest-household.model";

export const createGuestHouseholdSchema = z.object({
  householdName: z.string().trim().min(1, "Household name is required").max(200, "Household name is too long"),
  primaryContact: z.object({
    name: z.string().trim().min(1, "Primary contact name is required").max(200, "Name is too long"),
    email: z.string().trim().email("Invalid email format").max(254, "Email is too long").optional().or(z.literal("")),
    phone: z.string().trim().max(50, "Phone number is too long").optional().or(z.literal("")),
  }),
  side: z.enum(GUEST_SIDES, { message: "Invalid side selection" }).default("BOTH"),
  members: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Member name is required").max(200, "Member name is too long"),
      })
    )
    .optional()
    .default([]),
  totalInvited: z.number().int().min(1, "totalInvited must be at least 1").default(1),
  galleryAccess: z.boolean().optional().default(true),
  notes: z.string().trim().max(2000, "Notes are too long").optional(),
});

export const updateGuestHouseholdSchema = z
  .object({
    householdName: z.string().trim().min(1, "Household name cannot be empty").max(200, "Household name is too long").optional(),
    primaryContact: z
      .object({
        name: z.string().trim().min(1, "Primary contact name cannot be empty").max(200).optional(),
        email: z.string().trim().email("Invalid email format").max(254).optional().nullable().or(z.literal("")),
        phone: z.string().trim().max(50).optional().nullable().or(z.literal("")),
      })
      .optional(),
    side: z.enum(GUEST_SIDES).optional(),
    members: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(200),
        })
      )
      .optional(),
    totalInvited: z.number().int().min(1, "totalInvited must be at least 1").optional(),
    invitationStatus: z.enum(INVITATION_STATUSES).optional(),
    rsvp: z
      .object({
        status: z.enum(RSVP_STATUSES),
        attendingCount: z.number().int().min(0).optional(),
      })
      .optional(),
    galleryAccess: z.boolean().optional(),
    notes: z.string().trim().max(2000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.rsvp) {
        if (data.rsvp.status === "ATTENDING") {
          const count = data.rsvp.attendingCount ?? 1;
          const max = data.totalInvited ?? 1000;
          return count >= 1 && count <= max;
        }
        if (data.rsvp.status === "NOT_ATTENDING") {
          const count = data.rsvp.attendingCount ?? 0;
          return count === 0;
        }
      }
      return true;
    },
    { message: "attendingCount must be valid for the selected RSVP status", path: ["rsvp", "attendingCount"] }
  );

export const publicRsvpSchema = z
  .object({
    status: z.enum(["ATTENDING", "NOT_ATTENDING"], { message: "Status must be ATTENDING or NOT_ATTENDING" }),
    attendingCount: z.number().int().min(0, "attendingCount cannot be negative").optional(),
  })
  .refine(
    (data) => {
      if (data.status === "ATTENDING") {
        return data.attendingCount === undefined || data.attendingCount >= 1;
      }
      if (data.status === "NOT_ATTENDING") {
        return data.attendingCount === undefined || data.attendingCount === 0;
      }
      return true;
    },
    { message: "attendingCount must be at least 1 when ATTENDING, or 0 when NOT_ATTENDING", path: ["attendingCount"] }
  );

export type CreateGuestHouseholdInput = z.input<typeof createGuestHouseholdSchema>;
export type UpdateGuestHouseholdInput = z.input<typeof updateGuestHouseholdSchema>;
export type PublicRsvpInput = z.infer<typeof publicRsvpSchema>;
