import { connectToDatabase } from "@/lib/db/connect";
import { TeamMemberRepository } from "@/modules/team/repositories/team-member.repository";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { NotificationService } from "@/modules/notifications/services/notification.service";
import { GuestHouseholdRepository } from "@/modules/guests/repositories/guest-household.repository";

export interface NotifyGuestUploadParams {
  weddingId: string;
  mediaId: string;
  originalFilename: string;
  mediaType: string;
  uploadedByHouseholdId?: string;
}

export class GuestUploadNotificationService {
  /**
   * Triggers in-app notifications for active workspace members with gallery permission when a guest upload requires moderation.
   * Deduplicates per recipient and media item atomically.
   */
  static async notifyGuestUpload({
    weddingId,
    mediaId,
    originalFilename,
    mediaType,
    uploadedByHouseholdId,
  }: NotifyGuestUploadParams): Promise<{ success: boolean; notificationsSent: number }> {
    await connectToDatabase();

    // Look up uploader household identity from trusted server-side repository
    let householdName = "A Guest";
    if (uploadedByHouseholdId) {
      const household = await GuestHouseholdRepository.findByIdAndWeddingId({
        weddingId,
        householdId: uploadedByHouseholdId,
      });
      if (household?.householdName) {
        householdName = household.householdName;
      }
    }

    // Resolve eligible workspace recipients server-side (active members with gallery permission or ADMIN role)
    const memberObjs = await TeamMemberRepository.findActiveMembersByWeddingId(weddingId);
    const eligibleRecipients = memberObjs
      .map(({ member }) => member)
      .filter(
        (m) =>
          m.status === "ACTIVE" &&
          (m.role === "ADMIN" || TeamAuthorization.hasPermission(m, "gallery"))
      );

    if (eligibleRecipients.length === 0) {
      return { success: true, notificationsSent: 0 };
    }

    const typeLabel = mediaType === "VIDEO" ? "Video" : mediaType === "AUDIO" ? "Audio" : "Photo";
    const title = `New Guest ${typeLabel} Uploaded`;
    const message = `${householdName} uploaded "${originalFilename}" for moderation.`;
    const link = `/workspace/${weddingId}/gallery?mediaId=${mediaId}`;

    let sentCount = 0;

    for (const recipient of eligibleRecipients) {
      const recipientUserId = recipient.userId.toString();
      const dedupKey = `${recipientUserId}_GUEST_UPLOAD_${mediaId}`;

      const res = await NotificationService.createNotification({
        weddingId,
        userId: recipientUserId,
        type: "GUEST_UPLOAD_PENDING",
        title,
        message,
        entityType: "MEDIA",
        entityId: mediaId,
        link,
        dedupKey,
      });

      if (res.success && res.data) {
        sentCount++;
      }
    }

    return { success: true, notificationsSent: sentCount };
  }
}
