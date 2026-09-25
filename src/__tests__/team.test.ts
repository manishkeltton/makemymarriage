import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import { TeamService } from "../modules/team/services/team.service";
import { TeamMemberRepository } from "../modules/team/repositories/team-member.repository";
import { TeamInviteRepository } from "../modules/team/repositories/team-invite.repository";
import { EventRepository } from "../modules/events/repositories/event.repository";
import { User, IUser } from "../lib/db/models/User";
import { WeddingRepository } from "../modules/weddings/repositories/wedding.repository";
import { EmailService } from "../lib/services/email.service";
import { createInviteSchema, updateMemberSchema } from "../modules/team/validation/team.schemas";
import { connectToDatabase } from "../lib/db/connect";
import { IWeddingMember } from "../modules/weddings/models/wedding-member.model";
import { IWeddingMemberInvite } from "../modules/team/models/wedding-member-invite.model";

vi.mock("../lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("../lib/db/models/User", () => ({
  User: {
    findById: vi.fn(),
    findOne: vi.fn(),
    exists: vi.fn().mockResolvedValue(false),
  },
}));

vi.mock("../modules/weddings/repositories/wedding.repository", () => ({
  WeddingRepository: {
    findById: vi.fn(),
  },
}));

vi.mock("../modules/events/repositories/event.repository", () => ({
  EventRepository: {
    findByIdAndWeddingId: vi.fn(),
  },
}));

vi.mock("../lib/services/email.service", () => ({
  EmailService: {
    enqueueTeamInviteEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Team Management Unit & Integration Tests", () => {
  const fakeAdminUserId = new Types.ObjectId().toString();
  const fakeManagerUserId = new Types.ObjectId().toString();
  const fakeWeddingId = new Types.ObjectId().toString();
  const fakeEventId = new Types.ObjectId().toString();
  const fakeMemberId = new Types.ObjectId().toString();
  const fakeInviteId = new Types.ObjectId().toString();

  const fakeAdminMemberDoc = {
    _id: new Types.ObjectId(fakeMemberId),
    weddingId: new Types.ObjectId(fakeWeddingId),
    userId: new Types.ObjectId(fakeAdminUserId),
    role: "ADMIN",
    status: "ACTIVE",
    permissions: { guests: true, vendors: true, finance: true, gallery: true, website: true, guestbook: true, emergency: true },
    eventScope: { allEvents: true, eventIds: [] },
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const fakeManagerMemberDoc = {
    _id: new Types.ObjectId(),
    weddingId: new Types.ObjectId(fakeWeddingId),
    userId: new Types.ObjectId(fakeManagerUserId),
    role: "MANAGER",
    status: "ACTIVE",
    permissions: { guests: true, vendors: true, finance: true, gallery: true, website: true, guestbook: true, emergency: true },
    eventScope: { allEvents: true, eventIds: [] },
  };

  const fakeAdminUserDoc = {
    _id: new Types.ObjectId(fakeAdminUserId),
    name: "Admin User",
    email: "admin@example.com",
    normalizedEmail: "admin@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validation Schemas", () => {
    it("should validate create invite input correctly", () => {
      const validPayload = {
        email: "invitee@example.com",
        role: "ORGANISER",
        permissions: { guests: true, vendors: false, finance: false, gallery: true, website: false, guestbook: true, emergency: true },
        eventScope: { allEvents: true, eventIds: [] },
      };
      const result = createInviteSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email in invite creation", () => {
      const invalidPayload = {
        email: "invalid-email-format",
        role: "ORGANISER",
      };
      const result = createInviteSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("should reject invalid role in update member schema", () => {
      const invalidPayload = {
        role: "SUPER_GOD_ADMIN",
      };
      const result = updateMemberSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("Team Member Listing & Authorization", () => {
    it("should allow ADMIN to list active team members", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);
      vi.spyOn(TeamMemberRepository, "findActiveMembersByWeddingId").mockResolvedValue([
        { member: fakeAdminMemberDoc as unknown as IWeddingMember, user: fakeAdminUserDoc as unknown as IUser },
      ]);

      const result = await TeamService.getTeamMembers(fakeWeddingId, fakeAdminUserId);

      expect(connectToDatabase).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].userName).toBe("Admin User");
      expect(result.data?.[0].role).toBe("ADMIN");
    });

    it("should deny team members listing if user is MANAGER or non-admin", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeManagerMemberDoc as unknown as IWeddingMember);

      const result = await TeamService.getTeamMembers(fakeWeddingId, fakeManagerUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe("FORBIDDEN");
    });
  });

  describe("Invitation Creation & Security", () => {
    it("should create invite, hash token, and enqueue email job for ADMIN", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);
      (User.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null); // Not already user/member
      (User.findById as ReturnType<typeof vi.fn>).mockResolvedValue(fakeAdminUserDoc);
      (WeddingRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: fakeWeddingId, title: "Ananya & Rahul" });

      const mockInviteDoc = {
        _id: new Types.ObjectId(fakeInviteId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        invitedEmail: "guestlead@example.com",
        role: "ORGANISER",
        permissions: { guests: true, vendors: true, finance: false, gallery: true, website: true, guestbook: true, emergency: true },
        eventScope: { allEvents: true, eventIds: [] },
        status: "PENDING",
        expiresAt: new Date(Date.now() + 7 * 86400000),
        invitedBy: new Types.ObjectId(fakeAdminUserId),
        createdAt: new Date(),
      };

      vi.spyOn(TeamInviteRepository, "findPendingInviteByEmail").mockResolvedValue(null);
      vi.spyOn(TeamInviteRepository, "createInvite").mockResolvedValue(mockInviteDoc as unknown as IWeddingMemberInvite);

      const result = await TeamService.createInvite(fakeWeddingId, fakeAdminUserId, {
        email: "guestlead@example.com",
        role: "ORGANISER",
      });

      expect(result.success).toBe(true);
      expect(result.data?.invitedEmail).toBe("guestlead@example.com");
      expect(EmailService.enqueueTeamInviteEmail).toHaveBeenCalled();
    });

    it("should reject invite creation if target is already an active member", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId")
        .mockResolvedValueOnce(fakeAdminMemberDoc as unknown as IWeddingMember) // admin caller check
        .mockResolvedValueOnce(fakeAdminMemberDoc as unknown as IWeddingMember); // target user check

      (User.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(fakeAdminUserDoc);

      const result = await TeamService.createInvite(fakeWeddingId, fakeAdminUserId, {
        email: "admin@example.com",
        role: "MANAGER",
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("ALREADY_ACTIVE_MEMBER");
    });

    it("should reject invitation if specified eventId does not belong to current wedding", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);
      (User.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (EventRepository.findByIdAndWeddingId as ReturnType<typeof vi.fn>).mockResolvedValue(null); // Invalid event for wedding

      const result = await TeamService.createInvite(fakeWeddingId, fakeAdminUserId, {
        email: "planner@example.com",
        role: "ORGANISER",
        eventScope: {
          allEvents: false,
          eventIds: [fakeEventId],
        },
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("INVALID_EVENT_SCOPE");
    });
  });

  describe("Public Invite Preview & Acceptance", () => {
    it("should return public invite preview without sensitive tokenHash or internal fields", async () => {
      const mockInviteDoc = {
        _id: new Types.ObjectId(fakeInviteId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        invitedEmail: "guest@example.com",
        normalizedEmail: "guest@example.com",
        role: "ORGANISER",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 86400000),
        invitedBy: new Types.ObjectId(fakeAdminUserId),
      };

      vi.spyOn(TeamInviteRepository, "findInviteByTokenHash").mockResolvedValue(mockInviteDoc as unknown as IWeddingMemberInvite);
      (WeddingRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue({
        _id: fakeWeddingId,
        title: "Pooja & Karan",
        bride: { name: "Pooja" },
        groom: { name: "Karan" },
      });
      (User.findById as ReturnType<typeof vi.fn>).mockResolvedValue(fakeAdminUserDoc);

      const result = await TeamService.getPublicInvitePreview("raw_test_token_123");

      expect(result.success).toBe(true);
      expect(result.data?.invitedEmail).toBe("guest@example.com");
      expect(result.data?.wedding.title).toBe("Pooja & Karan");
      expect((result.data as unknown as { tokenHash?: string }).tokenHash).toBeUndefined();
    });

    it("should reject invite acceptance if authenticated email does not match invited email", async () => {
      const mockInviteDoc = {
        _id: new Types.ObjectId(fakeInviteId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        invitedEmail: "guest@example.com",
        normalizedEmail: "guest@example.com",
        role: "ORGANISER",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 86400000),
      };

      const mismatchedUserDoc = {
        _id: new Types.ObjectId(fakeManagerUserId),
        email: "different@example.com",
        normalizedEmail: "different@example.com",
      };

      vi.spyOn(TeamInviteRepository, "findInviteByTokenHash").mockResolvedValue(mockInviteDoc as unknown as IWeddingMemberInvite);
      (User.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mismatchedUserDoc);

      const result = await TeamService.acceptInvite("raw_test_token_123", fakeManagerUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe("EMAIL_MISMATCH");
    });
  });

  describe("Final Admin Protection", () => {
    it("should prevent demoting the only remaining Admin", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);
      vi.spyOn(TeamMemberRepository, "findByIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);
      vi.spyOn(TeamMemberRepository, "countActiveAdmins").mockResolvedValue(1); // Only 1 admin left

      const result = await TeamService.updateMember(fakeWeddingId, fakeMemberId, fakeAdminUserId, {
        role: "ORGANISER",
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("CANNOT_DEMOTE_FINAL_ADMIN");
    });

    it("should prevent removing the only remaining Admin", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);
      vi.spyOn(TeamMemberRepository, "findByIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);
      vi.spyOn(TeamMemberRepository, "countActiveAdmins").mockResolvedValue(1); // Only 1 admin left

      const result = await TeamService.removeMember(fakeWeddingId, fakeMemberId, fakeAdminUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe("CANNOT_REMOVE_FINAL_ADMIN");
    });

    it("should allow demoting an Admin if multiple Admins exist", async () => {
      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);
      vi.spyOn(TeamMemberRepository, "findByIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);
      vi.spyOn(TeamMemberRepository, "countActiveAdmins").mockResolvedValue(2); // 2 admins present

      const demotedDoc = { ...fakeAdminMemberDoc, role: "MANAGER" };
      vi.spyOn(TeamMemberRepository, "updateMemberByIdAndWeddingId").mockResolvedValue(demotedDoc as unknown as IWeddingMember);
      (User.findById as ReturnType<typeof vi.fn>).mockResolvedValue(fakeAdminUserDoc);

      const result = await TeamService.updateMember(fakeWeddingId, fakeMemberId, fakeAdminUserId, {
        role: "MANAGER",
      });

      expect(result.success).toBe(true);
      expect(result.data?.role).toBe("MANAGER");
    });
  });

  describe("Member Soft Removal", () => {
    it("should soft-delete member by marking status REMOVED without deleting user account", async () => {
      const nonAdminTargetMemberDoc = {
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        userId: new Types.ObjectId(fakeManagerUserId),
        role: "MANAGER",
        status: "ACTIVE",
      };

      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue(fakeAdminMemberDoc as unknown as IWeddingMember);
      vi.spyOn(TeamMemberRepository, "findByIdAndWeddingId").mockResolvedValue(nonAdminTargetMemberDoc as unknown as IWeddingMember);
      vi.spyOn(TeamMemberRepository, "softDeleteMemberByIdAndWeddingId").mockResolvedValue(true);

      const result = await TeamService.removeMember(fakeWeddingId, nonAdminTargetMemberDoc._id.toString(), fakeAdminUserId);

      expect(result.success).toBe(true);
      expect(TeamMemberRepository.softDeleteMemberByIdAndWeddingId).toHaveBeenCalledWith({
        weddingId: fakeWeddingId,
        memberId: nonAdminTargetMemberDoc._id.toString(),
      });
    });
  });
});


describe("Invitation URL configuration", () => {
  it("uses APP_ORIGIN for invitation links", () => {
    vi.stubEnv("APP_ORIGIN", "https://makemymarriage.vercel.app/");
    try {
      expect(TeamService.getInviteUrl("token")).toBe("https://makemymarriage.vercel.app/invite/token");
    } finally { vi.unstubAllEnvs(); }
  });
  it("rejects a local origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
    try { expect(() => TeamService.getInviteUrl("token")).toThrow("public HTTPS"); }
    finally { vi.unstubAllEnvs(); }
  });
});
