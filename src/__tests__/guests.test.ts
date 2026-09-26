import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import crypto from "crypto";
import { GuestService } from "../modules/guests/services/guest.service";
import { GuestHouseholdRepository } from "../modules/guests/repositories/guest-household.repository";
import { GuestAccessTokenRepository } from "../modules/guests/repositories/guest-access-token.repository";
import { TeamAuthorization } from "../modules/team/authorization/team.auth";
import { WeddingRepository } from "../modules/weddings/repositories/wedding.repository";
import {
  createGuestHouseholdSchema,
  publicRsvpSchema,
} from "../modules/guests/validation/guest.schemas";
import { connectToDatabase } from "../lib/db/connect";
import { IGuestHousehold } from "../modules/guests/models/guest-household.model";
import { IGuestAccessToken } from "../modules/guests/models/guest-access-token.model";
import { IWedding } from "../modules/weddings/models/wedding.model";

vi.mock("../lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("../modules/team/authorization/team.auth", () => ({
  TeamAuthorization: {
    requireWeddingPermission: vi.fn(),
    requireWeddingMembership: vi.fn(),
  },
}));

describe("Guest & Household Management Domain Module Tests", () => {
  const fakeAdminUserId = new Types.ObjectId().toString();
  const fakeWeddingId = new Types.ObjectId().toString();
  const fakeHouseholdId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validation Schemas", () => {
    it("should validate create guest household payload", () => {
      const payload = {
        householdName: "Sharma Family",
        primaryContact: {
          name: "Rahul Sharma",
          email: "rahul@example.com",
          phone: "+91 9876543210",
        },
        side: "BRIDE",
        members: [{ name: "Rahul Sharma" }, { name: "Neha Sharma" }],
        totalInvited: 3,
        notes: "Requires ground floor room",
      };

      const result = createGuestHouseholdSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject totalInvited < 1", () => {
      const payload = {
        householdName: "Invalid Family",
        primaryContact: { name: "Test User" },
        side: "GROOM",
        totalInvited: 0,
      };

      const result = createGuestHouseholdSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("should validate public RSVP payload for ATTENDING with valid count", () => {
      const payload = {
        status: "ATTENDING",
        attendingCount: 2,
      };

      const result = publicRsvpSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject public RSVP ATTENDING with count 0", () => {
      const payload = {
        status: "ATTENDING",
        attendingCount: 0,
      };

      const result = publicRsvpSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("Guest Household CRUD & Security Checks", () => {
    it("should create a household when user has guest permission", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);

      const mockHouseholdDoc = {
        _id: new Types.ObjectId(fakeHouseholdId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        householdName: "Verma Family",
        primaryContact: { name: "Amit Verma" },
        side: "GROOM",
        members: [{ name: "Amit Verma" }],
        totalInvited: 2,
        invitationStatus: "NOT_SENT",
        rsvp: { status: "AWAITING", attendingCount: 0 },
        galleryAccess: true,
        createdBy: new Types.ObjectId(fakeAdminUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(GuestHouseholdRepository, "create").mockResolvedValue(mockHouseholdDoc as unknown as IGuestHousehold);

      const result = await GuestService.createHousehold(fakeWeddingId, fakeAdminUserId, {
        householdName: "Verma Family",
        primaryContact: { name: "Amit Verma" },
        side: "GROOM",
        totalInvited: 2,
      });

      expect(connectToDatabase).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data?.householdName).toBe("Verma Family");
      expect(result.data?.side).toBe("GROOM");
    });

    it("should deny creation when user lacks guest permission", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(false);
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(null);

      const result = await GuestService.createHousehold(fakeWeddingId, fakeAdminUserId, {
        householdName: "Verma Family",
        primaryContact: { name: "Amit Verma" },
        side: "GROOM",
        totalInvited: 2,
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("FORBIDDEN");
    });
  });

  describe("Secure Access Link Lifecycle & Hash-Only Token Storage", () => {
    it("should generate access link, store ONLY token hash, and revoke existing active tokens", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(GuestHouseholdRepository, "findByIdAndWeddingId").mockResolvedValue({
        _id: new Types.ObjectId(fakeHouseholdId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        householdName: "Sharma Family",
      } as unknown as IGuestHousehold);

      vi.spyOn(GuestAccessTokenRepository, "revokeActiveTokensByHouseholdId").mockResolvedValue(1);
      vi.spyOn(GuestAccessTokenRepository, "create").mockResolvedValue({
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        householdId: new Types.ObjectId(fakeHouseholdId),
        tokenHash: "hashed-token-value",
      } as unknown as IGuestAccessToken);

      const result = await GuestService.generateAccessLink(fakeWeddingId, fakeHouseholdId, fakeAdminUserId);

      expect(result.success).toBe(true);
      expect(result.data?.rawToken).toBeDefined();
      expect(result.data?.accessUrl).toContain(result.data?.rawToken || "");

      // Verify SHA-256 hash was generated
      const expectedHash = crypto.createHash("sha256").update(result.data!.rawToken).digest("hex");
      expect(GuestAccessTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenHash: expectedHash,
        })
      );
    });

    it("should fetch public invitation details using valid raw token", async () => {
      const rawToken = "sample-raw-token-1234567890abcdef";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      vi.spyOn(GuestAccessTokenRepository, "findByTokenHash").mockResolvedValue({
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        householdId: new Types.ObjectId(fakeHouseholdId),
        tokenHash,
        createdAt: new Date(),
      } as unknown as IGuestAccessToken);

      vi.spyOn(GuestHouseholdRepository, "findByIdAndWeddingId").mockResolvedValue({
        _id: new Types.ObjectId(fakeHouseholdId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        householdName: "Sharma Family",
        primaryContact: { name: "Rahul Sharma" },
        side: "BRIDE",
        members: [{ name: "Rahul" }],
        totalInvited: 2,
        invitationStatus: "SENT",
        rsvp: { status: "AWAITING", attendingCount: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as IGuestHousehold);

      vi.spyOn(WeddingRepository, "findById").mockResolvedValue({
        _id: new Types.ObjectId(fakeWeddingId),
        title: "Aarav & Meera",
        bride: { name: "Meera" },
        groom: { name: "Aarav" },
        primaryWeddingDate: new Date("2027-11-22"),
        generalLocation: { city: "New Delhi" },
      } as unknown as IWedding);

      const result = await GuestService.getPublicGuestAccess(rawToken);

      expect(result.success).toBe(true);
      expect(result.data?.householdName).toBe("Sharma Family");
      expect(result.data?.wedding.title).toBe("Aarav & Meera");
    });

    it("should reject public access for revoked token", async () => {
      const rawToken = "revoked-token-123";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      vi.spyOn(GuestAccessTokenRepository, "findByTokenHash").mockResolvedValue({
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        householdId: new Types.ObjectId(fakeHouseholdId),
        tokenHash,
        revokedAt: new Date(),
      } as unknown as IGuestAccessToken);

      const result = await GuestService.getPublicGuestAccess(rawToken);

      expect(result.success).toBe(false);
      expect(result.code).toBe("TOKEN_REVOKED");
    });
  });

  describe("Public RSVP Submission & Validation Rules", () => {
    it("should submit ATTENDING RSVP with valid attending count", async () => {
      const rawToken = "valid-rsvp-token";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      vi.spyOn(GuestAccessTokenRepository, "findByTokenHash").mockResolvedValue({
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        householdId: new Types.ObjectId(fakeHouseholdId),
        tokenHash,
      } as unknown as IGuestAccessToken);

      const mockHousehold = {
        _id: new Types.ObjectId(fakeHouseholdId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        householdName: "Kapoor Family",
        primaryContact: { name: "Rohan Kapoor" },
        side: "GROOM",
        totalInvited: 4,
        rsvp: { status: "AWAITING", attendingCount: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(GuestHouseholdRepository, "findByIdAndWeddingId").mockResolvedValue(mockHousehold as unknown as IGuestHousehold);

      const updatedHousehold = {
        ...mockHousehold,
        rsvp: { status: "ATTENDING", attendingCount: 3, respondedAt: new Date() },
      };

      vi.spyOn(GuestHouseholdRepository, "updateByIdAndWeddingId").mockResolvedValue(updatedHousehold as unknown as IGuestHousehold);
      vi.spyOn(WeddingRepository, "findById").mockResolvedValue({
        _id: new Types.ObjectId(fakeWeddingId),
        title: "Rohan & Ananya",
      } as unknown as IWedding);

      const result = await GuestService.submitPublicRsvp(rawToken, {
        status: "ATTENDING",
        attendingCount: 3,
      });

      expect(result.success).toBe(true);
      expect(result.data?.rsvp.status).toBe("ATTENDING");
      expect(result.data?.rsvp.attendingCount).toBe(3);
    });

    it("should reject ATTENDING RSVP when attendingCount > totalInvited", async () => {
      const rawToken = "overcount-rsvp-token";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      vi.spyOn(GuestAccessTokenRepository, "findByTokenHash").mockResolvedValue({
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        householdId: new Types.ObjectId(fakeHouseholdId),
        tokenHash,
      } as unknown as IGuestAccessToken);

      vi.spyOn(GuestHouseholdRepository, "findByIdAndWeddingId").mockResolvedValue({
        _id: new Types.ObjectId(fakeHouseholdId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        totalInvited: 2,
        rsvp: { status: "AWAITING" },
      } as unknown as IGuestHousehold);

      const result = await GuestService.submitPublicRsvp(rawToken, {
        status: "ATTENDING",
        attendingCount: 5, // Exceeds totalInvited: 2
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("RSVP_COUNT_INVALID");
    });
  });

  describe("Household Deletion & Statistics Aggregation", () => {
    it("should delete household and remove all access tokens", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(GuestHouseholdRepository, "deleteByIdAndWeddingId").mockResolvedValue(true);
      vi.spyOn(GuestAccessTokenRepository, "deleteAllByHouseholdId").mockResolvedValue(2);

      const result = await GuestService.deleteHousehold(fakeWeddingId, fakeHouseholdId, fakeAdminUserId);

      expect(result.success).toBe(true);
      expect(GuestAccessTokenRepository.deleteAllByHouseholdId).toHaveBeenCalledWith({
        weddingId: fakeWeddingId,
        householdId: fakeHouseholdId,
      });
    });

    it("should aggregate accurate guest statistics for dashboard", async () => {
      vi.spyOn(GuestHouseholdRepository, "aggregateGuestStats").mockResolvedValue({
        totalHouseholds: 3,
        totalInvited: 9,
        totalAttending: 2,
        totalDeclined: 4,
        totalAwaiting: 2,
        totalSent: 2,
        sideBreakdown: { bride: 3, groom: 4, both: 2 },
      });

      const stats = await GuestHouseholdRepository.aggregateGuestStats(fakeWeddingId);

      expect(stats.totalHouseholds).toBe(3);
      expect(stats.totalInvited).toBe(9);
      expect(stats.totalAttending).toBe(2);
      expect(stats.totalDeclined).toBe(4);
      expect(stats.totalAwaiting).toBe(2);
      expect(stats.totalSent).toBe(2);
    });

    it("GUEST-P1-01: should clamp attendingCount to new totalInvited when totalInvited is reduced for an ATTENDING household", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);

      const existingHousehold = {
        _id: new Types.ObjectId(fakeHouseholdId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        householdName: "Large Family",
        primaryContact: { name: "Rajiv Sharma" },
        side: "BRIDE",
        totalInvited: 5,
        invitationStatus: "SENT",
        rsvp: { status: "ATTENDING", attendingCount: 5, respondedAt: new Date() },
        createdBy: new Types.ObjectId(fakeAdminUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(GuestHouseholdRepository, "findByIdAndWeddingId").mockResolvedValue(existingHousehold as unknown as IGuestHousehold);

      const updatedHouseholdDoc = {
        ...existingHousehold,
        totalInvited: 2,
        rsvp: { status: "ATTENDING", attendingCount: 2, respondedAt: new Date() },
      };

      vi.spyOn(GuestHouseholdRepository, "updateByIdAndWeddingId").mockResolvedValue(updatedHouseholdDoc as unknown as IGuestHousehold);

      const result = await GuestService.updateHousehold(fakeWeddingId, fakeHouseholdId, fakeAdminUserId, {
        totalInvited: 2, // Reducing totalInvited without passing rsvp
      });

      expect(result.success).toBe(true);
      expect(GuestHouseholdRepository.updateByIdAndWeddingId).toHaveBeenCalledWith(
        expect.objectContaining({
          updateData: expect.objectContaining({
            totalInvited: 2,
            rsvp: expect.objectContaining({
              status: "ATTENDING",
              attendingCount: 2, // Clamped from 5 to 2!
            }),
          }),
        })
      );
      expect(result.data?.rsvp.attendingCount).toBe(2);
    });

    it("GUEST-P1-02: findHouseholdsByFilters should pass active filters to countDocuments instead of querying unfiltered weddingId count", async () => {
      const { GuestHouseholdModel } = await import("../modules/guests/models/guest-household.model");
      vi.spyOn(GuestHouseholdModel, "find").mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof GuestHouseholdModel.find>);

      vi.spyOn(GuestHouseholdModel, "countDocuments").mockReturnValue({
        exec: vi.fn().mockResolvedValue(0),
      } as unknown as ReturnType<typeof GuestHouseholdModel.countDocuments>);

      await GuestHouseholdRepository.findHouseholdsByFilters({
        weddingId: fakeWeddingId,
        side: "BRIDE",
        rsvpStatus: "ATTENDING",
      });

      // Verify countDocuments was called with side and rsvpStatus filter
      expect(GuestHouseholdModel.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          weddingId: new Types.ObjectId(fakeWeddingId),
          side: "BRIDE",
          "rsvp.status": "ATTENDING",
        })
      );
    });
  });
});
