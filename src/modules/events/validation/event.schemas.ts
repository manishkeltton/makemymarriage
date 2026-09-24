import { z } from "zod";
import { EventType } from "../models/event.model";

export const eventVenueSchema = z.object({
  name: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  locality: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional()
    .nullable(),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional()
    .nullable(),
  mapUrl: z.string().optional(),
  placeId: z.string().optional(),
});

export const createEventSchema = z
  .object({
    name: z.string().trim().min(1, "Event name is required").max(100),
    description: z.string().trim().optional().nullable(),
    type: z
      .enum([
        "ROKA",
        "ENGAGEMENT",
        "TILAK",
        "MEHENDI",
        "HALDI",
        "SANGEET",
        "WEDDING",
        "RECEPTION",
        "CUSTOM",
      ])
      .optional()
      .default("CUSTOM"),
    startAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid start date/time",
    }),
    endAt: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid end date/time",
      })
      .optional()
      .nullable(),
    venue: eventVenueSchema.optional().nullable(),
    dressCode: z.string().trim().optional().nullable(),
    coverMediaId: z.string().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.endAt) return true;
      const start = new Date(data.startAt).getTime();
      const end = new Date(data.endAt).getTime();
      return end >= start;
    },
    {
      message: "End time must be after or equal to start time",
      path: ["endAt"],
    }
  );

export const updateEventSchema = z
  .object({
    name: z.string().trim().min(1, "Event name is required").max(100).optional(),
    description: z.string().trim().optional().nullable(),
    type: z
      .enum([
        "ROKA",
        "ENGAGEMENT",
        "TILAK",
        "MEHENDI",
        "HALDI",
        "SANGEET",
        "WEDDING",
        "RECEPTION",
        "CUSTOM",
      ])
      .optional(),
    startAt: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid start date/time",
      })
      .optional(),
    endAt: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid end date/time",
      })
      .optional()
      .nullable(),
    venue: eventVenueSchema.optional().nullable(),
    dressCode: z.string().trim().optional().nullable(),
    coverMediaId: z.string().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startAt && data.endAt) {
        const start = new Date(data.startAt).getTime();
        const end = new Date(data.endAt).getTime();
        return end >= start;
      }
      return true;
    },
    {
      message: "End time must be after or equal to start time",
      path: ["endAt"],
    }
  );

export interface CreateEventInput {
  name: string;
  description?: string | null;
  type?: EventType;
  startAt: string;
  endAt?: string | null;
  venue?: {
    name?: string;
    addressLine1?: string;
    addressLine2?: string;
    locality?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    latitude?: number | null;
    longitude?: number | null;
    mapUrl?: string;
    placeId?: string;
  } | null;
  dressCode?: string | null;
  coverMediaId?: string | null;
  notes?: string | null;
}

export type UpdateEventInput = z.infer<typeof updateEventSchema>;
