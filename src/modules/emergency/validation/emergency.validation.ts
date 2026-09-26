import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createEmergencyContactSchema = z.object({
  name: z.string().min(1, "Contact name is required").max(100, "Name is too long").trim(),
  role: z.string().min(1, "Role is required").max(100, "Role is too long").trim(),
  phone: z.string().max(30, "Phone number is too long").trim().optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  eventId: z.string().regex(objectIdRegex, "Invalid event ID").optional().or(z.literal("")),
  priority: z.number().int().min(0).default(0),
  notes: z.string().max(1000, "Notes too long").optional(),
});

export const updateEmergencyContactSchema = createEmergencyContactSchema.partial();

export type CreateEmergencyContactInput = z.infer<typeof createEmergencyContactSchema>;
export type UpdateEmergencyContactInput = z.infer<typeof updateEmergencyContactSchema>;
