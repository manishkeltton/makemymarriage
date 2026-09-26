import { z } from "zod";
import { WEBSITE_THEMES, SECTION_TYPES } from "../constants/wedding-site.constants";

export const RESERVED_SLUGS = [
  "login",
  "signup",
  "workspace",
  "api",
  "invite",
  "invitation",
  "admin",
  "settings",
  "public",
  "w",
  "app",
  "home",
  "about",
  "contact",
  "dashboard",
  "events",
  "tasks",
  "guests",
  "vendors",
  "expenses",
  "documents",
  "gallery",
  "guestbook",
  "emergency",
  "terms",
  "privacy",
  "help",
  "support",
];

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.trim().toLowerCase());
}

export const sectionSchema = z.object({
  id: z.string().trim().min(1, "Section ID is required"),
  type: z.enum(SECTION_TYPES, { message: "Invalid section type" }),
  enabled: z.boolean().default(true),
  order: z.number().int().min(0, "Order must be a non-negative integer"),
  config: z.record(z.string(), z.unknown()).default({}),
});

export const updateSiteSchema = z.object({
  slug: z
    .string()
    .trim()
    .lowercase()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug cannot exceed 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .refine((val) => !isReservedSlug(val), { message: "This slug is reserved and cannot be used" })
    .optional(),
  theme: z.enum(WEBSITE_THEMES).optional(),
  locale: z.enum(["en", "hi"]).optional(),
  seo: z
    .object({
      title: z.string().trim().max(200, "SEO title is too long").optional(),
      description: z.string().trim().max(500, "SEO description is too long").optional(),
      noIndex: z.boolean().optional(),
    })
    .optional(),
  style: z
    .object({
      primaryColor: z
        .string()
        .trim()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Primary color must be a valid hex color code (e.g. #D4AF37)")
        .optional()
        .or(z.literal("")),
      secondaryColor: z
        .string()
        .trim()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Secondary color must be a valid hex color code (e.g. #8B0000)")
        .optional()
        .or(z.literal("")),
      fontFamily: z.string().trim().max(100, "Font family name is too long").optional().or(z.literal("")),
    })
    .optional(),
  sections: z.array(sectionSchema).optional(),
});

export type UpdateSiteInput = z.input<typeof updateSiteSchema>;
