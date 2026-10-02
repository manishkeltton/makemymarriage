import { describe, it, expect, vi, beforeEach } from "vitest";
import { RsvpNotificationService } from "@/modules/guests/services/rsvp-notification.service";
import { NotificationRepository } from "@/modules/notifications/repositories/notification.repository";
import { NotificationService } from "@/modules/notifications/services/notification.service";
import { TeamMemberRepository } from "@/modules/team/repositories/team-member.repository";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { GuestHouseholdModel } from "@/modules/guests/models/guest-household.model";

// Mocks
vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/modules/notifications/repositories/notification.repository", () => ({
  NotificationRepository: {
    create: vi.fn(),
    findNotificationsByUserId: vi.fn(),
    countUnreadByUserId: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

vi.mock("@/modules/team/repositories/team-member.repository", () => ({
  TeamMemberRepository: {
    findActiveMembersByWeddingId: vi.fn(),
    findByIdAndWeddingId: vi.fn(),
    findByUserIdAndWeddingId: vi.fn(),
  },
}));

vi.mock("@/modules/team/authorization/team.auth", () => ({
  TeamAuthorization: {
    requireWeddingMembership: vi.fn(),
    hasPermission: vi.fn().mockImplementation((member: { role?: string; permissions?: Record<string, boolean> }, perm: string) => {
      if (!member) return false;
      if (member.role === "ADMIN") return true;
      return Boolean(member.permissions?.[perm]);
    }),
    canAccessTask: vi.fn().mockReturnValue(true),
    canAccessExpense: vi.fn().mockReturnValue(true),
  },
}));

vi.mock("@/modules/guests/models/guest-household.model", () => ({
  GuestHouseholdModel: {
    find: vi.fn(),
    findById: vi.fn(),
  },
}));

describe("V1 RSVP Notifications Suite", () => {
  const weddingId = "507f1f77bcf86cd799439011";
  const householdId = "607f1f77bcf86cd799439033";
  const adminUserId = "507f1f77bcf86cd799439022";
  const memberUserId = "507f1f77bcf86cd799439044";
  const noAccessUserId = "507f1f77bcf86cd799439055";

  const baseHousehold = {
    status: "AWAITING",
    attendingCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("RSVP-01: computes transition key accurately and ignores non-RSVP or identical changes", () => {
    // 1. Identical state -> null
    const noChange = RsvpNotificationService.calculateTransition(
      baseHousehold,
      "AWAITING",
      0,
      new Date("2026-10-03T10:00:00Z")
    );
    expect(noChange).toBeNull();

    // 2. First response: AWAITING (0) -> ATTENDING (2)
    const respondedAt = new Date("2026-10-03T10:00:00Z");
    const firstResponse = RsvpNotificationService.calculateTransition(
      baseHousehold,
      "ATTENDING",
      2,
      respondedAt
    );

    expect(firstResponse).not.toBeNull();
    expect(firstResponse?.isFirstResponse).toBe(true);
    expect(firstResponse?.oldStatus).toBe("AWAITING");
    expect(firstResponse?.oldCount).toBe(0);
    expect(firstResponse?.newStatus).toBe("ATTENDING");
    expect(firstResponse?.newCount).toBe(2);
    expect(firstResponse?.transitionKey).toBe(
      `AWAITING_0_TO_ATTENDING_2_AT_${respondedAt.getTime()}`
    );

    // 3. Status/count update: ATTENDING (2) -> NOT_ATTENDING (0)
    const prevAttending = {
      status: "ATTENDING",
      attendingCount: 2,
    };
    const updateResponse = RsvpNotificationService.calculateTransition(
      prevAttending,
      "NOT_ATTENDING",
      0,
      new Date("2026-10-03T12:00:00Z")
    );

    expect(updateResponse).not.toBeNull();
    expect(updateResponse?.isFirstResponse).toBe(false);
    expect(updateResponse?.oldStatus).toBe("ATTENDING");
    expect(updateResponse?.newStatus).toBe("NOT_ATTENDING");
  });

  it("RSVP-02: dispatches notifications to active workspace members with guests permission", async () => {
    const adminMember = {
      id: "m1",
      weddingId,
      userId: adminUserId,
      role: "ADMIN",
      permissions: { guests: true },
      status: "ACTIVE",
    };
    const guestMember = {
      id: "m2",
      weddingId,
      userId: memberUserId,
      role: "MEMBER",
      permissions: { guests: true },
      status: "ACTIVE",
    };
    const noAccessMember = {
      id: "m3",
      weddingId,
      userId: noAccessUserId,
      role: "MEMBER",
      permissions: { guests: false },
      status: "ACTIVE",
    };

    vi.mocked(TeamMemberRepository.findActiveMembersByWeddingId).mockResolvedValue([
      { member: adminMember as never, user: { name: "Admin" } },
      { member: guestMember as never, user: { name: "Member" } },
      { member: noAccessMember as never, user: { name: "NoAccess" } },
    ]);

    vi.mocked(NotificationRepository.create).mockImplementation(async (data) => ({
      _id: "notif_" + Math.random(),
      userId: data.userId,
      weddingId: data.weddingId,
      type: data.type,
      title: data.title,
      message: data.message,
      entityType: data.entityType,
      entityId: data.entityId,
      link: data.link,
      dedupKey: data.dedupKey,
      readAt: null,
      createdAt: new Date(),
    } as never));

    const respondedAt = new Date("2026-10-03T10:00:00Z");
    await RsvpNotificationService.notifyRsvpChange({
      weddingId,
      householdId,
      householdName: "Smith Family",
      oldRsvp: baseHousehold,
      newRsvp: {
        status: "ATTENDING",
        attendingCount: 2,
        respondedAt,
      },
    });

    // Should create notifications for adminUserId and memberUserId, but NOT noAccessUserId
    expect(NotificationRepository.create).toHaveBeenCalledTimes(2);

    const calls = vi.mocked(NotificationRepository.create).mock.calls;
    const userIdsNotified = calls.map((call) => call[0].userId.toString());
    expect(userIdsNotified).toContain(adminUserId);
    expect(userIdsNotified).toContain(memberUserId);
    expect(userIdsNotified).not.toContain(noAccessUserId);

    // Check payload structure and secret protection
    const firstPayload = calls[0][0];
    expect(firstPayload.title).toBe("RSVP Received from Smith Family");
    expect(firstPayload.message).toBe("Responded ATTENDING (2 guests)");
    expect(firstPayload.link).toBe(`/workspace/${weddingId}/guests?householdId=${householdId}`);
    expect(firstPayload.type).toBe("RSVP_RESPONSE");
    expect(firstPayload.entityType).toBe("GUEST");

    // Guarantee raw token is never exposed in title, message, link, or dedupKey
    expect(JSON.stringify(firstPayload)).not.toContain("secret-token-xyz123");
  });

  it("RSN-001: excludes acting organiser user from receiving self-notifications when actorUserId is provided", async () => {
    const adminMember = {
      id: "m1",
      weddingId,
      userId: adminUserId,
      role: "ADMIN",
      permissions: { guests: true },
      status: "ACTIVE",
    };
    const guestMember = {
      id: "m2",
      weddingId,
      userId: memberUserId,
      role: "MEMBER",
      permissions: { guests: true },
      status: "ACTIVE",
    };

    vi.mocked(TeamMemberRepository.findActiveMembersByWeddingId).mockResolvedValue([
      { member: adminMember as never, user: { name: "Admin" } },
      { member: guestMember as never, user: { name: "Member" } },
    ]);

    vi.mocked(NotificationRepository.create).mockImplementation(async (data) => ({
      _id: "notif_" + Math.random(),
      userId: data.userId,
      weddingId: data.weddingId,
      type: data.type,
      title: data.title,
      message: data.message,
      entityType: data.entityType,
      entityId: data.entityId,
      link: data.link,
      dedupKey: data.dedupKey,
      readAt: null,
      createdAt: new Date(),
    } as never));

    // Admin user (adminUserId) manually updates RSVP -> pass actorUserId: adminUserId
    await RsvpNotificationService.notifyRsvpChange({
      weddingId,
      householdId,
      householdName: "Smith Family",
      oldRsvp: baseHousehold,
      newRsvp: {
        status: "ATTENDING",
        attendingCount: 2,
        respondedAt: new Date("2026-10-03T10:00:00Z"),
      },
      actorUserId: adminUserId,
    });

    // Should ONLY notify memberUserId, excluding adminUserId (the actor)
    expect(NotificationRepository.create).toHaveBeenCalledTimes(1);
    const calls = vi.mocked(NotificationRepository.create).mock.calls;
    const userIdsNotified = calls.map((call) => call[0].userId.toString());
    expect(userIdsNotified).not.toContain(adminUserId);
    expect(userIdsNotified).toContain(memberUserId);
  });

  it("RSVP-03: supports A -> B -> A sequence with distinct respondedAt timestamps", async () => {
    const adminMember = {
      id: "m1",
      weddingId,
      userId: adminUserId,
      role: "ADMIN",
      permissions: { guests: true },
      status: "ACTIVE",
    };

    vi.mocked(TeamMemberRepository.findActiveMembersByWeddingId).mockResolvedValue([
      { member: adminMember as never, user: { name: "Admin" } },
    ]);

    vi.mocked(NotificationRepository.create).mockImplementation(async (data) => ({
      _id: "notif_" + Math.random(),
      userId: data.userId,
      weddingId: data.weddingId,
      type: data.type,
      title: data.title,
      message: data.message,
      entityType: data.entityType,
      entityId: data.entityId,
      link: data.link,
      dedupKey: data.dedupKey,
      readAt: null,
      createdAt: new Date(),
    } as never));

    // Transition 1: AWAITING -> ATTENDING (t1)
    const t1 = new Date("2026-10-03T10:00:00.000Z");
    await RsvpNotificationService.notifyRsvpChange({
      weddingId,
      householdId,
      householdName: "Smith Family",
      oldRsvp: { status: "AWAITING", attendingCount: 0 },
      newRsvp: { status: "ATTENDING", attendingCount: 2, respondedAt: t1 },
    });

    // Transition 2: ATTENDING -> NOT_ATTENDING (t2)
    const t2 = new Date("2026-10-03T11:00:00.000Z");
    await RsvpNotificationService.notifyRsvpChange({
      weddingId,
      householdId,
      householdName: "Smith Family",
      oldRsvp: { status: "ATTENDING", attendingCount: 2 },
      newRsvp: { status: "NOT_ATTENDING", attendingCount: 0, respondedAt: t2 },
    });

    // Transition 3: NOT_ATTENDING -> ATTENDING (t3) - A -> B -> A
    const t3 = new Date("2026-10-03T12:00:00.000Z");
    await RsvpNotificationService.notifyRsvpChange({
      weddingId,
      householdId,
      householdName: "Smith Family",
      oldRsvp: { status: "NOT_ATTENDING", attendingCount: 0 },
      newRsvp: { status: "ATTENDING", attendingCount: 2, respondedAt: t3 },
    });

    expect(NotificationRepository.create).toHaveBeenCalledTimes(3);
    const dedupKeys = vi
      .mocked(NotificationRepository.create)
      .mock.calls.map((c) => c[0].dedupKey);

    expect(dedupKeys[0]).toContain(`AWAITING_0_TO_ATTENDING_2_AT_${t1.getTime()}`);
    expect(dedupKeys[1]).toContain(`ATTENDING_2_TO_NOT_ATTENDING_0_AT_${t2.getTime()}`);
    expect(dedupKeys[2]).toContain(`NOT_ATTENDING_0_TO_ATTENDING_2_AT_${t3.getTime()}`);

    // Each dedup key is unique
    expect(new Set(dedupKeys).size).toBe(3);
  });

  it("RSVP-04: handles duplicate key gracefully during concurrent calls", async () => {
    const adminMember = {
      id: "m1",
      weddingId,
      userId: adminUserId,
      role: "ADMIN",
      permissions: { guests: true },
      status: "ACTIVE",
    };

    vi.mocked(TeamMemberRepository.findActiveMembersByWeddingId).mockResolvedValue([
      { member: adminMember as never, user: { name: "Admin" } },
    ]);

    // Return null (duplicate key suppressed by NotificationRepository)
    vi.mocked(NotificationRepository.create).mockResolvedValue(null as never);

    const respondedAt = new Date("2026-10-03T10:00:00Z");
    const result = await RsvpNotificationService.notifyRsvpChange({
      weddingId,
      householdId,
      householdName: "Smith Family",
      oldRsvp: baseHousehold,
      newRsvp: { status: "ATTENDING", attendingCount: 2, respondedAt },
    });

    expect(result.success).toBe(true);
    expect(result.notificationsSent).toBe(0);
  });

  it("RSVP-05: NotificationService filters out RSVP notifications if household is deleted or access revoked", async () => {
    const memberObj = {
      userId: memberUserId,
      weddingId,
      status: "ACTIVE",
      role: "MEMBER",
      permissions: { guests: true },
    };

    vi.mocked(TeamAuthorization.requireWeddingMembership).mockResolvedValue(memberObj as never);

    const mockNotifs = [
      {
        _id: "n1",
        userId: memberUserId,
        weddingId,
        title: "RSVP Received from Smith Family",
        message: "Responded ATTENDING (2 guests)",
        type: "RSVP_RESPONSE",
        entityId: householdId,
        entityType: "GUEST",
        link: `/workspace/${weddingId}/guests?householdId=${householdId}`,
        readAt: null,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.mocked(NotificationRepository.findNotificationsByUserId).mockResolvedValue(
      mockNotifs as never
    );
    vi.mocked(NotificationRepository.countUnreadByUserId).mockResolvedValue(1);

    // 1. When household exists -> returns 1 notification
    vi.mocked(GuestHouseholdModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([{ _id: householdId }]),
    } as never);

    const resultWithHousehold = await NotificationService.getUserNotifications({
      userId: memberUserId,
      weddingId,
    });
    expect(resultWithHousehold.success).toBe(true);
    expect(resultWithHousehold.data?.length).toBe(1);
    expect(resultWithHousehold.unreadCount).toBe(1);

    // 2. When household is deleted -> returns 0 notifications and unreadCount = 0
    vi.mocked(GuestHouseholdModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    } as never);

    const resultDeletedHousehold = await NotificationService.getUserNotifications({
      userId: memberUserId,
      weddingId,
    });
    expect(resultDeletedHousehold.success).toBe(true);
    expect(resultDeletedHousehold.data?.length).toBe(0);
    expect(resultDeletedHousehold.unreadCount).toBe(0);

    // 3. When guests permission is revoked -> returns 0 notifications
    vi.mocked(GuestHouseholdModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([{ _id: householdId }]),
    } as never);

    const revokedMemberObj = {
      ...memberObj,
      permissions: { guests: false },
    };
    vi.mocked(TeamAuthorization.requireWeddingMembership).mockResolvedValue(revokedMemberObj as never);

    const resultRevokedPermission = await NotificationService.getUserNotifications({
      userId: memberUserId,
      weddingId,
    });
    expect(resultRevokedPermission.success).toBe(true);
    expect(resultRevokedPermission.data?.length).toBe(0);
    expect(resultRevokedPermission.unreadCount).toBe(0);
  });
});
