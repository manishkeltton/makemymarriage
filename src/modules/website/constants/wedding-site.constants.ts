export const WEBSITE_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type WebsiteStatus = (typeof WEBSITE_STATUSES)[number];

export const WEBSITE_THEMES = [
  "ROYAL_GOLD",
  "BLUSH_ROMANCE",
  "MODERN_MINIMAL",
  "ELEGANT_TRADITIONAL",
  "FLORAL_PASTEL",
  "MIDNIGHT_ROMANCE",
  "VINTAGE_SEPIA",
  "MINIMAL_ELEGANCE",
] as const;
export type WebsiteTheme = (typeof WEBSITE_THEMES)[number];

export const SECTION_TYPES = [
  "HERO",
  "OUR_STORY",
  "SCHEDULE",
  "VENUE",
  "COUPLE",
  "DRESS_CODE",
  "RSVP_CTA",
  "TIMELINE",
  "GALLERY_TEASER",
  "CUSTOM",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];
