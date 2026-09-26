import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import { WeddingSiteService } from "../modules/website/services/wedding-site.service";
import { WeddingSiteRepository } from "../modules/website/repositories/wedding-site.repository";
import { TeamAuthorization } from "../modules/team/authorization/team.auth";
import { WeddingRepository } from "../modules/weddings/repositories/wedding.repository";
import { EventRepository } from "../modules/events/repositories/event.repository";
import { updateSiteSchema, isReservedSlug } from "../modules/website/validation/wedding-site.schemas";
import { connectToDatabase } from "../lib/db/connect";
import { IWeddingSite } from "../modules/website/models/wedding-site.model";
import { IWedding } from "../modules/weddings/models/wedding.model";
import { IEvent } from "../modules/events/models/event.model";

vi.mock("../lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("../modules/team/authorization/team.auth", () => ({
  TeamAuthorization: {
    requireWeddingPermission: vi.fn(),
    requireWeddingMembership: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe("Wedding Website & Builder Module Tests", () => {
  const fakeAdminUserId = new Types.ObjectId().toString();
  const fakeWeddingId = new Types.ObjectId().toString();
  const fakeSiteId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validation Schemas & Reserved Slug Checks", () => {
    it("should identify reserved platform slugs", () => {
      expect(isReservedSlug("login")).toBe(true);
      expect(isReservedSlug("signup")).toBe(true);
      expect(isReservedSlug("workspace")).toBe(true);
      expect(isReservedSlug("api")).toBe(true);
      expect(isReservedSlug("w")).toBe(true);
      expect(isReservedSlug("admin")).toBe(true);

      expect(isReservedSlug("rahul-and-neha")).toBe(false);
      expect(isReservedSlug("royal-jaipur-wedding")).toBe(false);
    });

    it("should validate update website schema payload", () => {
      const payload = {
        slug: "rahul-neha-2027",
        theme: "ROYAL_GOLD",
        locale: "en",
        seo: {
          title: "Rahul & Neha Wedding Website",
          description: "Join our wedding celebrations in Jaipur!",
          noIndex: false,
        },
        style: {
          primaryColor: "#D4AF37",
          secondaryColor: "#8B0000",
          fontFamily: "Playfair Display",
        },
        sections: [
          {
            id: "sec-hero",
            type: "HERO",
            enabled: true,
            order: 0,
            config: { title: "Rahul & Neha" },
          },
        ],
      };

      const result = updateSiteSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject invalid slug format in update schema", () => {
      const payload = {
        slug: "Rahul & Neha!", // Contains spaces & invalid characters
      };

      const result = updateSiteSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("Website Service & Permission Controls", () => {
    it("should initialize default website draft when website permission is granted", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(WeddingSiteRepository, "findByWeddingId").mockResolvedValue(null);

      vi.spyOn(WeddingRepository, "findById").mockResolvedValue({
        _id: new Types.ObjectId(fakeWeddingId),
        title: "Rahul & Neha",
        bride: { name: "Neha" },
        groom: { name: "Rahul" },
      } as unknown as IWedding);

      vi.spyOn(WeddingSiteRepository, "isSlugAvailable").mockResolvedValue(true);

      const mockSiteDoc = {
        _id: new Types.ObjectId(fakeSiteId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        slug: "neha-and-rahul",
        status: "DRAFT",
        theme: "ROYAL_GOLD",
        locale: "en",
        seo: { title: "Rahul & Neha — Wedding Website" },
        style: { primaryColor: "#D4AF37", secondaryColor: "#8B0000", fontFamily: "Playfair Display" },
        sections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(WeddingSiteRepository, "create").mockResolvedValue(mockSiteDoc as unknown as IWeddingSite);

      const result = await WeddingSiteService.getOrCreateSite(fakeWeddingId, fakeAdminUserId);

      expect(connectToDatabase).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data?.slug).toBe("neha-and-rahul");
      expect(result.data?.status).toBe("DRAFT");
    });

    it("should deny website initialization when user lacks website permission", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(false);
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(null);

      const result = await WeddingSiteService.getOrCreateSite(fakeWeddingId, fakeAdminUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe("FORBIDDEN");
    });

    it("should update site settings and reject reserved slug updates", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(WeddingSiteRepository, "findByWeddingId").mockResolvedValue({
        _id: new Types.ObjectId(fakeSiteId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        slug: "rahul-neha",
        status: "DRAFT",
      } as unknown as IWeddingSite);

      const result = await WeddingSiteService.updateSite(fakeWeddingId, fakeAdminUserId, {
        slug: "login", // Reserved slug!
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("INVALID_SLUG");
    });

    it("should publish and unpublish wedding site cleanly and invalidate cache", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);

      const mockSite = {
        _id: new Types.ObjectId(fakeSiteId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        slug: "rahul-neha-2027",
        status: "DRAFT",
        theme: "ROYAL_GOLD",
        sections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(WeddingSiteRepository, "findByWeddingId").mockResolvedValue(mockSite as unknown as IWeddingSite);

      const publishedDoc = { ...mockSite, status: "PUBLISHED", publishedAt: new Date() };
      vi.spyOn(WeddingSiteRepository, "updateByWeddingId").mockResolvedValue(publishedDoc as unknown as IWeddingSite);

      const pubResult = await WeddingSiteService.publishSite(fakeWeddingId, fakeAdminUserId);
      expect(pubResult.success).toBe(true);
      expect(pubResult.data?.status).toBe("PUBLISHED");

      const draftDoc = { ...mockSite, status: "DRAFT" };
      vi.spyOn(WeddingSiteRepository, "updateByWeddingId").mockResolvedValue(draftDoc as unknown as IWeddingSite);

      const unpubResult = await WeddingSiteService.unpublishSite(fakeWeddingId, fakeAdminUserId);
      expect(unpubResult.success).toBe(true);
      expect(unpubResult.data?.status).toBe("DRAFT");

      const { revalidatePath, revalidateTag } = await import("next/cache");
      expect(revalidateTag).toHaveBeenCalledWith("wedding-site-rahul-neha-2027", "default");
      expect(revalidatePath).toHaveBeenCalledWith("/w/rahul-neha-2027");
      expect(revalidatePath).toHaveBeenCalledWith("/api/v1/public/weddings/rahul-neha-2027");
    });
  });

  describe("Public Rendering & Data Exposure Isolation", () => {
    it("should fetch public site by slug when status is PUBLISHED", async () => {
      const mockSiteDoc = {
        _id: new Types.ObjectId(fakeSiteId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        slug: "rahul-and-neha-jaipur",
        status: "PUBLISHED",
        theme: "ROYAL_GOLD",
        locale: "en",
        seo: { title: "Rahul & Neha Jaipur Wedding" },
        style: { primaryColor: "#D4AF37" },
        sections: [
          { id: "s1", type: "HERO", enabled: true, order: 0, config: { title: "Rahul & Neha" } },
        ],
      };

      vi.spyOn(WeddingSiteRepository, "findBySlug").mockResolvedValue(mockSiteDoc as unknown as IWeddingSite);
      vi.spyOn(WeddingRepository, "findById").mockResolvedValue({
        _id: new Types.ObjectId(fakeWeddingId),
        title: "Rahul & Neha",
        bride: { name: "Neha" },
        groom: { name: "Rahul" },
        primaryWeddingDate: new Date("2027-12-10"),
        generalLocation: { city: "Jaipur" },
      } as unknown as IWedding);

      vi.spyOn(EventRepository, "findEventsByWeddingId").mockResolvedValue([
        {
          _id: new Types.ObjectId(),
          weddingId: new Types.ObjectId(fakeWeddingId),
          name: "Sangeet Night",
          startAt: new Date("2027-12-09T18:00:00Z"),
          venue: { name: "Royal Palace", city: "Jaipur" },
          status: "PUBLISHED",
          createdBy: new Types.ObjectId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as IEvent,
      ]);

      const result = await WeddingSiteService.getPublicSiteBySlug("rahul-and-neha-jaipur");

      expect(result.success).toBe(true);
      expect(result.data?.wedding.title).toBe("Rahul & Neha");
      expect(result.data?.events?.length).toBe(1);
      expect(result.data?.events?.[0].name).toBe("Sangeet Night");

      // Verify explicit public DTO excludes any private or sensitive fields
      const publicData = result.data as unknown as Record<string, unknown>;
      expect(publicData.createdBy).toBeUndefined();
      expect(publicData.updatedBy).toBeUndefined();
      expect(publicData.householdTokens).toBeUndefined();
      expect(publicData.privateNotes).toBeUndefined();
    });

    it("should reject public fetch when site is in DRAFT mode", async () => {
      const mockSiteDoc = {
        _id: new Types.ObjectId(fakeSiteId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        slug: "draft-wedding-site",
        status: "DRAFT",
      };

      vi.spyOn(WeddingSiteRepository, "findBySlug").mockResolvedValue(mockSiteDoc as unknown as IWeddingSite);

      const result = await WeddingSiteService.getPublicSiteBySlug("draft-wedding-site");

      expect(result.success).toBe(false);
      expect(result.code).toBe("SITE_UNPUBLISHED");
    });
  });
});
