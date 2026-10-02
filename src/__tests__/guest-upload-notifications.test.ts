import { describe, it, expect, vi, beforeEach } from "vitest";
import { MediaService } from "@/modules/media/services/media.service";
import { MediaRepository } from "@/modules/media/repositories/media.repository";
import { NotificationRepository } from "@/modules/notifications/repositories/notification.repository";
import { NotificationService } from "@/modules/notifications/services/notification.service";
import { TeamMemberRepository } from "@/modules/team/repositories/team-member.repository";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { GuestHouseholdRepository } from "@/modules/guests/repositories/guest-household.repository";
import { StorageService } from "@/modules/documents/services/storage.service";
import { MediaModel } from "@/modules/media/models/media.model";

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

vi.mock("@/modules/guests/repositories/guest-household.repository", () => ({
  GuestHouseholdRepository: {
    findByIdAndWeddingId: vi.fn(),
  },
}));

vi.mock("@/modules/media/repositories/media.repository", () => ({
  MediaRepository: {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatusFromPendingUpload: vi.fn(),
    findByWedding: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/modules/documents/services/storage.service", () => ({
  StorageService: {
    verifyAndSeal: vi.fn().mockResolvedValue(true),
    accessUrl: vi.fn().mockResolvedValue("https://res.cloudinary.com/demo/image/upload/sample.jpg"),
    objectKey: vi.fn((key: string) => key),
    remove: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("@/modules/media/models/media.model", () => ({
  MediaModel: {
    find: vi.fn(),
    findById: vi.fn(),
  },
}));

describe("V1 Guest-Upload Notifications Suite", () => {
  const weddingId = "507f1f77bcf86cd799439011";
  const mediaId = "607f1f77bcf86cd799439022";
  const householdId = "707f1f77bcf86cd799439033";
  const adminUserId = "507f1f77bcf86cd799439044";
  const memberUserId = "507f1f77bcf86cd799439055";
  const noGalleryAccessUserId = "507f1f77bcf86cd799439066";

  const guestMediaMock = {
    _id: mediaId,
    weddingId,
    objectKey: `weddings/${weddingId}/media/sample-photo.jpg`,
    originalFilename: "wedding-dance.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 1024500,
    mediaType: "IMAGE",
    visibility: "PUBLIC",
    status: "PENDING_UPLOAD",
    uploadedByType: "GUEST",
    uploadedByHouseholdId: householdId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("GUN-01: guest upload completion triggers in-app moderation notifications for eligible members", async () => {
    vi.mocked(MediaRepository.findById).mockResolvedValue(guestMediaMock as never);
    vi.mocked(MediaRepository.updateStatusFromPendingUpload).mockResolvedValue({
      ...guestMediaMock,
      status: "PENDING_APPROVAL",
    } as never);

    vi.mocked(GuestHouseholdRepository.findByIdAndWeddingId).mockResolvedValue({
      _id: householdId,
      householdName: "The Kapoor Family",
    } as never);

    const adminMember = {
      id: "m1",
      weddingId,
      userId: adminUserId,
      role: "ADMIN",
      permissions: { gallery: true },
      status: "ACTIVE",
    };
    const galleryMember = {
      id: "m2",
      weddingId,
      userId: memberUserId,
      role: "MEMBER",
      permissions: { gallery: true },
      status: "ACTIVE",
    };
    const noGalleryMember = {
      id: "m3",
      weddingId,
      userId: noGalleryAccessUserId,
      role: "MEMBER",
      permissions: { gallery: false },
      status: "ACTIVE",
    };

    vi.mocked(TeamMemberRepository.findActiveMembersByWeddingId).mockResolvedValue([
      { member: adminMember as never, user: { name: "Admin" } },
      { member: galleryMember as never, user: { name: "Member" } },
      { member: noGalleryMember as never, user: { name: "NoGallery" } },
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

    const completeInput = {
      uploadKey: guestMediaMock.objectKey,
      objectKey: guestMediaMock.objectKey,
      mimeType: guestMediaMock.mimeType,
      sizeBytes: guestMediaMock.sizeBytes,
    };

    const result = await MediaService.completeUpload(weddingId, mediaId, completeInput, {
      type: "GUEST",
      householdId,
    });

    expect(result.status).toBe("PENDING_APPROVAL");
    expect(StorageService.verifyAndSeal).toHaveBeenCalledWith(
      completeInput.uploadKey,
      guestMediaMock.objectKey,
      guestMediaMock.mimeType,
      guestMediaMock.sizeBytes,
      weddingId
    );

    // Wait microtask tick for async notifyGuestUpload
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(NotificationRepository.create).toHaveBeenCalledTimes(2);

    const calls = vi.mocked(NotificationRepository.create).mock.calls;
    const userIdsNotified = calls.map((call) => call[0].userId.toString());
    expect(userIdsNotified).toContain(adminUserId);
    expect(userIdsNotified).toContain(memberUserId);
    expect(userIdsNotified).not.toContain(noGalleryAccessUserId);

    const firstPayload = calls[0][0];
    expect(firstPayload.title).toBe("New Guest Photo Uploaded");
    expect(firstPayload.message).toBe('The Kapoor Family uploaded "wedding-dance.jpg" for moderation.');
    expect(firstPayload.link).toBe(`/workspace/${weddingId}/gallery?mediaId=${mediaId}`);
    expect(firstPayload.type).toBe("GUEST_UPLOAD_PENDING");
    expect(firstPayload.entityType).toBe("MEDIA");
    expect(firstPayload.dedupKey).toContain(`_GUEST_UPLOAD_${mediaId}`);

    // Guarantee raw keys, tokens, or credentials are never exposed in title/message/link
    expect(JSON.stringify(firstPayload)).not.toContain("secret");
    expect(JSON.stringify(firstPayload)).not.toContain("CLOUDINARY");
  });

  it("GUN-02: member upload completion goes straight to APPROVED and emits 0 notifications", async () => {
    const memberMediaMock = {
      ...guestMediaMock,
      uploadedByType: "MEMBER",
      uploadedByUserId: adminUserId,
      uploadedByHouseholdId: undefined,
    };

    vi.mocked(MediaRepository.findById).mockResolvedValue(memberMediaMock as never);
    vi.mocked(MediaRepository.updateStatusFromPendingUpload).mockResolvedValue({
      ...memberMediaMock,
      status: "APPROVED",
    } as never);

    const completeInput = {
      uploadKey: memberMediaMock.objectKey,
      objectKey: memberMediaMock.objectKey,
      mimeType: memberMediaMock.mimeType,
      sizeBytes: memberMediaMock.sizeBytes,
    };

    const result = await MediaService.completeUpload(weddingId, mediaId, completeInput, {
      type: "MEMBER",
      userId: adminUserId,
    });

    expect(result.status).toBe("APPROVED");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(NotificationRepository.create).not.toHaveBeenCalled();
  });

  it("GUN-03: repeated completion calls for already completed media return record idempotently without duplicate notifications", async () => {
    const alreadyCompletedMock = {
      ...guestMediaMock,
      status: "PENDING_APPROVAL",
    };

    vi.mocked(MediaRepository.findById).mockResolvedValue(alreadyCompletedMock as never);

    const completeInput = {
      uploadKey: alreadyCompletedMock.objectKey,
      objectKey: alreadyCompletedMock.objectKey,
      mimeType: alreadyCompletedMock.mimeType,
      sizeBytes: alreadyCompletedMock.sizeBytes,
    };

    const result = await MediaService.completeUpload(weddingId, mediaId, completeInput, {
      type: "GUEST",
      householdId,
    });

    expect(result.status).toBe("PENDING_APPROVAL");
    expect(StorageService.verifyAndSeal).not.toHaveBeenCalled();
    expect(NotificationRepository.create).not.toHaveBeenCalled();
  });

  it("GUN-04: NotificationService filters out guest upload notifications if media is deleted or permission revoked", async () => {
    vi.mocked(TeamAuthorization.requireWeddingMembership).mockResolvedValue({
      userId: memberUserId,
      weddingId,
      status: "ACTIVE",
      role: "MEMBER",
      permissions: { gallery: true },
    } as never);

    const mockNotifs = [
      {
        _id: "n1",
        userId: memberUserId,
        weddingId,
        title: "New Guest Photo Uploaded",
        message: 'The Kapoor Family uploaded "wedding-dance.jpg" for moderation.',
        type: "GUEST_UPLOAD_PENDING",
        entityId: mediaId,
        entityType: "MEDIA",
        link: `/workspace/${weddingId}/gallery?mediaId=${mediaId}`,
        dedupKey: `${memberUserId}_GUEST_UPLOAD_${mediaId}`,
        readAt: null,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.mocked(NotificationRepository.findNotificationsByUserId).mockResolvedValue(
      mockNotifs as never
    );
    vi.mocked(NotificationRepository.countUnreadByUserId).mockResolvedValue(1);

    // 1. When media exists in DB -> returns 1 notification
    vi.mocked(MediaModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([{ _id: mediaId }]),
    } as never);

    const resultWithMedia = await NotificationService.getUserNotifications({
      userId: memberUserId,
      weddingId,
    });
    expect(resultWithMedia.success).toBe(true);
    expect(resultWithMedia.data?.length).toBe(1);
    expect(resultWithMedia.unreadCount).toBe(1);

    // 2. When media is deleted -> returns 0 notifications and unreadCount = 0
    vi.mocked(MediaModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    } as never);

    const resultDeletedMedia = await NotificationService.getUserNotifications({
      userId: memberUserId,
      weddingId,
    });
    expect(resultDeletedMedia.success).toBe(true);
    expect(resultDeletedMedia.data?.length).toBe(0);
    expect(resultDeletedMedia.unreadCount).toBe(0);

    // 3. When gallery permission is revoked -> returns 0 notifications
    vi.mocked(MediaModel.find).mockReturnValue({
      exec: vi.fn().mockResolvedValue([{ _id: mediaId }]),
    } as never);

    vi.mocked(TeamAuthorization.requireWeddingMembership).mockResolvedValue({
      userId: memberUserId,
      weddingId,
      status: "ACTIVE",
      role: "MEMBER",
      permissions: { gallery: false },
    } as never);

    const resultRevokedPermission = await NotificationService.getUserNotifications({
      userId: memberUserId,
      weddingId,
    });
    expect(resultRevokedPermission.success).toBe(true);
    expect(resultRevokedPermission.data?.length).toBe(0);
    expect(resultRevokedPermission.unreadCount).toBe(0);
  });
});
