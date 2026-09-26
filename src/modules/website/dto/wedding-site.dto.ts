import { IWeddingSite } from "../models/wedding-site.model";
import {
  WEBSITE_STATUSES,
  WEBSITE_THEMES,
  SECTION_TYPES,
  WebsiteStatus,
  WebsiteTheme,
  SectionType,
} from "../constants/wedding-site.constants";
import { EventDTO } from "@/modules/events/dto/event.dto";

export { WEBSITE_STATUSES, WEBSITE_THEMES, SECTION_TYPES };
export type { WebsiteStatus, WebsiteTheme, SectionType };

export interface WebsiteSectionDTO {
  id: string;
  type: SectionType;
  enabled: boolean;
  order: number;
  config: Record<string, unknown>;
}

export interface WeddingSiteDTO {
  id: string;
  weddingId: string;
  slug: string;
  status: WebsiteStatus;
  theme: WebsiteTheme;
  locale: "en" | "hi";
  seo: {
    title?: string;
    description?: string;
    noIndex: boolean;
  };
  style: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  sections: WebsiteSectionDTO[];
  publishedAt?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicWeddingSiteDTO {
  slug: string;
  theme: WebsiteTheme;
  locale: "en" | "hi";
  seo: {
    title?: string;
    description?: string;
    noIndex: boolean;
  };
  style: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  sections: WebsiteSectionDTO[];
  publishedAt?: string;
  wedding: {
    title: string;
    brideName?: string;
    groomName?: string;
    primaryWeddingDate?: string;
    generalLocation?: {
      name?: string;
      city?: string;
      state?: string;
    };
  };
  events?: EventDTO[];
}

export function toWeddingSiteDTO(doc: IWeddingSite): WeddingSiteDTO {
  return {
    id: doc._id.toString(),
    weddingId: doc.weddingId.toString(),
    slug: doc.slug,
    status: doc.status,
    theme: doc.theme,
    locale: doc.locale || "en",
    seo: {
      title: doc.seo?.title || undefined,
      description: doc.seo?.description || undefined,
      noIndex: Boolean(doc.seo?.noIndex),
    },
    style: {
      primaryColor: doc.style?.primaryColor || undefined,
      secondaryColor: doc.style?.secondaryColor || undefined,
      fontFamily: doc.style?.fontFamily || undefined,
    },
    sections: (doc.sections || []).map((s) => ({
      id: s.id,
      type: s.type,
      enabled: Boolean(s.enabled),
      order: s.order,
      config: s.config || {},
    })),
    publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : undefined,
    createdBy: doc.createdBy ? doc.createdBy.toString() : "",
    updatedBy: doc.updatedBy ? doc.updatedBy.toString() : undefined,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toPublicWeddingSiteDTO(
  siteDoc: IWeddingSite,
  weddingMeta: {
    title: string;
    brideName?: string;
    groomName?: string;
    primaryWeddingDate?: Date;
    generalLocation?: {
      name?: string;
      city?: string;
      state?: string;
    };
  },
  events?: EventDTO[]
): PublicWeddingSiteDTO {
  // Only include enabled sections sorted by order
  const enabledSections = (siteDoc.sections || [])
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      id: s.id,
      type: s.type,
      enabled: true,
      order: s.order,
      config: s.config || {},
    }));

  return {
    slug: siteDoc.slug,
    theme: siteDoc.theme,
    locale: siteDoc.locale || "en",
    seo: {
      title: siteDoc.seo?.title || `${weddingMeta.title} — Wedding Website`,
      description: siteDoc.seo?.description || `Join us in celebrating the wedding of ${weddingMeta.title}`,
      noIndex: Boolean(siteDoc.seo?.noIndex),
    },
    style: {
      primaryColor: siteDoc.style?.primaryColor || undefined,
      secondaryColor: siteDoc.style?.secondaryColor || undefined,
      fontFamily: siteDoc.style?.fontFamily || undefined,
    },
    sections: enabledSections,
    publishedAt: siteDoc.publishedAt ? siteDoc.publishedAt.toISOString() : undefined,
    wedding: {
      title: weddingMeta.title,
      brideName: weddingMeta.brideName,
      groomName: weddingMeta.groomName,
      primaryWeddingDate: weddingMeta.primaryWeddingDate ? weddingMeta.primaryWeddingDate.toISOString() : undefined,
      generalLocation: weddingMeta.generalLocation,
    },
    events: events || [],
  };
}
