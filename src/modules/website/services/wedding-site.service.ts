import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { WeddingSiteRepository, UpdateWeddingSiteParams } from "../repositories/wedding-site.repository";
import { WeddingSiteDTO, PublicWeddingSiteDTO, toWeddingSiteDTO, toPublicWeddingSiteDTO } from "../dto/wedding-site.dto";
import { UpdateSiteInput, isReservedSlug } from "../validation/wedding-site.schemas";
import { IWebsiteSection } from "../models/wedding-site.model";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { WeddingRepository } from "@/modules/weddings/repositories/wedding.repository";
import { EventRepository } from "@/modules/events/repositories/event.repository";
import { toEventDTO } from "@/modules/events/dto/event.dto";
import { revalidatePath, revalidateTag } from "next/cache";

function generateDefaultSlug(brideName?: string, groomName?: string, weddingId?: string): string {
  if (brideName && groomName) {
    const cleanBride = brideName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanGroom = groomName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanBride && cleanGroom) {
      return `${cleanBride}-and-${cleanGroom}`;
    }
  }
  return `wedding-${(weddingId || Date.now().toString()).slice(-6)}`;
}

export function getDefaultWebsiteSections(brideName = "Bride", groomName = "Groom"): IWebsiteSection[] {
  return [
    {
      id: "sec-hero",
      type: "HERO",
      enabled: true,
      order: 0,
      config: {
        title: `${brideName} & ${groomName}`,
        subtitle: "We Are Getting Married!",
        tagline: "Join us in celebrating our wedding ceremony and love story.",
        coverImageUrl: "",
        showCountdown: true,
      },
    },
    {
      id: "sec-story",
      type: "OUR_STORY",
      enabled: true,
      order: 1,
      config: {
        title: "Our Love Story",
        storyText: "From our first meeting to our engagement, every step has been a beautiful journey.",
        brideBio: `Meet ${brideName}, the bride.`,
        groomBio: `Meet ${groomName}, the groom.`,
      },
    },
    {
      id: "sec-schedule",
      type: "SCHEDULE",
      enabled: true,
      order: 2,
      config: {
        title: "Wedding Ceremonies & Events",
        subtitle: "Key events and timings for our celebrations.",
      },
    },
    {
      id: "sec-venue",
      type: "VENUE",
      enabled: true,
      order: 3,
      config: {
        title: "Venue & Location",
        description: "General location and venue directions for our wedding.",
      },
    },
    {
      id: "sec-couple",
      type: "COUPLE",
      enabled: true,
      order: 4,
      config: {
        brideName,
        groomName,
        brideTitle: "The Bride",
        groomTitle: "The Groom",
      },
    },
    {
      id: "sec-dresscode",
      type: "DRESS_CODE",
      enabled: true,
      order: 5,
      config: {
        title: "Dress Code & Attire",
        description: "Traditional Indian Ethnic / Formal Attire.",
      },
    },
    {
      id: "sec-rsvp",
      type: "RSVP_CTA",
      enabled: true,
      order: 6,
      config: {
        title: "RSVP & Attendance",
        description: "Please confirm your attendance using your digital invitation link or contact the hosts.",
        buttonText: "RSVP Now",
      },
    },
  ];
}

export class WeddingSiteService {
  /**
   * Helper to check website access permission (`website` permission or ADMIN).
   */
  private static async checkWebsiteAccess(weddingId: string, userId: string): Promise<boolean> {
    const hasPermission = await TeamAuthorization.requireWeddingPermission(weddingId, userId, "website");
    if (hasPermission) return true;

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    return Boolean(member && member.status === "ACTIVE" && member.role === "ADMIN");
  }

  /**
   * Fetches existing website configuration or initializes a default draft configuration.
   */
  static async getOrCreateSite(
    weddingId: string,
    userId: string
  ): Promise<{ success: boolean; data?: WeddingSiteDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await WeddingSiteService.checkWebsiteAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires website permission", code: "FORBIDDEN" };
    }

    try {
      let site = await WeddingSiteRepository.findByWeddingId(weddingId);
      if (site) {
        return { success: true, data: toWeddingSiteDTO(site) };
      }

      // Initialize default draft website configuration
      const wedding = await WeddingRepository.findById(weddingId);
      if (!wedding) {
        return { success: false, error: "Wedding workspace not found", code: "NOT_FOUND" };
      }

      const brideName = wedding.bride?.name || "Bride";
      const groomName = wedding.groom?.name || "Groom";
      let baseSlug = generateDefaultSlug(brideName, groomName, weddingId);

      // Ensure slug availability
      const isAvailable = await WeddingSiteRepository.isSlugAvailable(baseSlug);
      if (!isAvailable || isReservedSlug(baseSlug)) {
        baseSlug = `${baseSlug}-${weddingId.slice(-4)}`;
      }

      const defaultSections = getDefaultWebsiteSections(brideName, groomName);
      const wId = new Types.ObjectId(weddingId);
      const uId = new Types.ObjectId(userId);

      site = await WeddingSiteRepository.create({
        weddingId: wId,
        slug: baseSlug,
        status: "DRAFT",
        theme: "ROYAL_GOLD",
        locale: "en",
        seo: {
          title: `${wedding.title} — Wedding Website`,
          description: `Join us in celebrating the wedding of ${wedding.title}`,
          noIndex: false,
        },
        style: {
          primaryColor: "#D4AF37",
          secondaryColor: "#8B0000",
          fontFamily: "Playfair Display",
        },
        sections: defaultSections,
        createdBy: uId,
      });

      return { success: true, data: toWeddingSiteDTO(site) };
    } catch (err: unknown) {
      console.error("Error fetching or initializing wedding site:", err);
      return { success: false, error: "Failed to load wedding site configuration", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Updates website configuration, slug, theme, styles, SEO, and section configurations.
   */
  static async updateSite(
    weddingId: string,
    userId: string,
    payload: UpdateSiteInput
  ): Promise<{ success: boolean; data?: WeddingSiteDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await WeddingSiteService.checkWebsiteAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires website permission", code: "FORBIDDEN" };
    }

    const existing = await WeddingSiteRepository.findByWeddingId(weddingId);
    if (!existing) {
      // Ensure site exists before update
      const initResult = await WeddingSiteService.getOrCreateSite(weddingId, userId);
      if (!initResult.success) {
        return { success: false, error: initResult.error, code: initResult.code };
      }
    }

    // Validate slug update if provided
    if (payload.slug !== undefined) {
      const cleanSlug = payload.slug.trim().toLowerCase();
      if (isReservedSlug(cleanSlug)) {
        return {
          success: false,
          error: `The URL slug "${cleanSlug}" is reserved by the platform and cannot be used`,
          code: "INVALID_SLUG",
        };
      }

      const available = await WeddingSiteRepository.isSlugAvailable(cleanSlug, weddingId);
      if (!available) {
        return {
          success: false,
          error: `The URL slug "${cleanSlug}" is already taken by another wedding website`,
          code: "SLUG_TAKEN",
        };
      }
    }

    const updateData: UpdateWeddingSiteParams = {
      updatedBy: new Types.ObjectId(userId),
    };

    if (payload.slug !== undefined) updateData.slug = payload.slug;
    if (payload.theme !== undefined) updateData.theme = payload.theme;
    if (payload.locale !== undefined) updateData.locale = payload.locale;
    if (payload.seo !== undefined) updateData.seo = payload.seo;
    if (payload.style !== undefined) updateData.style = payload.style;
    if (payload.sections !== undefined) {
      updateData.sections = payload.sections.map((s) => ({
        id: s.id,
        type: s.type,
        enabled: s.enabled !== undefined ? s.enabled : true,
        order: s.order,
        config: (s.config || {}) as Record<string, unknown>,
      }));
    }

    try {
      const updated = await WeddingSiteRepository.updateByWeddingId({
        weddingId,
        updateData,
      });

      if (updated?.slug) {
        WeddingSiteService.invalidateSiteCache(updated.slug);
        if (existing?.slug && existing.slug !== updated.slug) {
          WeddingSiteService.invalidateSiteCache(existing.slug);
        }
      }

      return { success: true, data: toWeddingSiteDTO(updated!) };
    } catch (err: unknown) {
      console.error("Error updating wedding site:", err);
      return { success: false, error: "Failed to update wedding site configuration", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Helper to invalidate public website caches when site status, slug, or content changes.
   */
  static invalidateSiteCache(slug?: string): void {
    if (!slug) return;
    try {
      revalidateTag(`wedding-site-${slug}`, "default");
      revalidatePath(`/w/${slug}`);
      revalidatePath(`/api/v1/public/weddings/${slug}`);
    } catch {
      // Non-Next.js environments (tests/CLI) fail silently when cache context is absent
    }
  }

  /**
   * Publishes the wedding site (setting status = PUBLISHED and publishedAt timestamp).
   */
  static async publishSite(
    weddingId: string,
    userId: string
  ): Promise<{ success: boolean; data?: WeddingSiteDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await WeddingSiteService.checkWebsiteAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires website permission", code: "FORBIDDEN" };
    }

    const site = await WeddingSiteRepository.findByWeddingId(weddingId);
    if (!site) {
      return { success: false, error: "Wedding site configuration not found", code: "NOT_FOUND" };
    }

    try {
      const updated = await WeddingSiteRepository.updateByWeddingId({
        weddingId,
        updateData: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          updatedBy: new Types.ObjectId(userId),
        },
      });

      if (updated?.slug) {
        WeddingSiteService.invalidateSiteCache(updated.slug);
      }

      return { success: true, data: toWeddingSiteDTO(updated!) };
    } catch (err: unknown) {
      console.error("Error publishing wedding site:", err);
      return { success: false, error: "Failed to publish wedding site", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Unpublishes the wedding site (setting status = DRAFT).
   */
  static async unpublishSite(
    weddingId: string,
    userId: string
  ): Promise<{ success: boolean; data?: WeddingSiteDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await WeddingSiteService.checkWebsiteAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires website permission", code: "FORBIDDEN" };
    }

    const site = await WeddingSiteRepository.findByWeddingId(weddingId);
    if (!site) {
      return { success: false, error: "Wedding site configuration not found", code: "NOT_FOUND" };
    }

    try {
      const updated = await WeddingSiteRepository.updateByWeddingId({
        weddingId,
        updateData: {
          status: "DRAFT",
          updatedBy: new Types.ObjectId(userId),
        },
      });

      if (updated?.slug) {
        WeddingSiteService.invalidateSiteCache(updated.slug);
      }

      return { success: true, data: toWeddingSiteDTO(updated!) };
    } catch (err: unknown) {
      console.error("Error unpublishing wedding site:", err);
      return { success: false, error: "Failed to unpublish wedding site", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Generates live preview DTO for authorised workspace members (includes draft changes).
   */
  static async getPreviewSite(
    weddingId: string,
    userId: string
  ): Promise<{ success: boolean; data?: PublicWeddingSiteDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await WeddingSiteService.checkWebsiteAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires website permission", code: "FORBIDDEN" };
    }

    try {
      let site = await WeddingSiteRepository.findByWeddingId(weddingId);
      if (!site) {
        const initResult = await WeddingSiteService.getOrCreateSite(weddingId, userId);
        if (!initResult.success) {
          return { success: false, error: initResult.error, code: initResult.code };
        }
        site = await WeddingSiteRepository.findByWeddingId(weddingId);
      }

      const wedding = await WeddingRepository.findById(weddingId);
      if (!wedding) {
        return { success: false, error: "Wedding workspace not found", code: "NOT_FOUND" };
      }

      const eventDocs = await EventRepository.findEventsByWeddingId({ weddingId });
      const events = eventDocs.map(toEventDTO);

      return {
        success: true,
        data: toPublicWeddingSiteDTO(site!, {
          title: wedding.title,
          brideName: wedding.bride?.name,
          groomName: wedding.groom?.name,
          primaryWeddingDate: wedding.primaryWeddingDate,
          generalLocation: wedding.generalLocation,
        }, events),
      };
    } catch (err: unknown) {
      console.error("Error fetching preview wedding site:", err);
      return { success: false, error: "Failed to load website preview", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Public Endpoint: Fetches published website configuration by public slug.
   */
  static async getPublicSiteBySlug(
    slug: string
  ): Promise<{ success: boolean; data?: PublicWeddingSiteDTO; error?: string; code?: string }> {
    await connectToDatabase();

    if (!slug || !slug.trim()) {
      return { success: false, error: "Slug parameter is required", code: "INVALID_SLUG" };
    }

    const cleanSlug = slug.trim().toLowerCase();
    const site = await WeddingSiteRepository.findBySlug(cleanSlug);

    if (!site) {
      return { success: false, error: "Wedding website not found", code: "SITE_NOT_FOUND" };
    }

    if (site.status !== "PUBLISHED") {
      return { success: false, error: "This wedding website is currently in draft mode and not published", code: "SITE_UNPUBLISHED" };
    }

    try {
      const wId = site.weddingId.toString();
      const wedding = await WeddingRepository.findById(wId);
      if (!wedding) {
        return { success: false, error: "Wedding workspace not found", code: "NOT_FOUND" };
      }

      const eventDocs = await EventRepository.findEventsByWeddingId({ weddingId: wId });
      const events = eventDocs.map(toEventDTO);

      return {
        success: true,
        data: toPublicWeddingSiteDTO(site, {
          title: wedding.title,
          brideName: wedding.bride?.name,
          groomName: wedding.groom?.name,
          primaryWeddingDate: wedding.primaryWeddingDate,
          generalLocation: wedding.generalLocation,
        }, events),
      };
    } catch (err: unknown) {
      console.error("Error fetching public wedding site by slug:", err);
      return { success: false, error: "Failed to load public wedding website", code: "INTERNAL_ERROR" };
    }
  }
}
