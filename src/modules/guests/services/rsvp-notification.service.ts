import { connectToDatabase } from "@/lib/db/connect";
import { TeamMemberRepository } from "@/modules/team/repositories/team-member.repository";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { NotificationService } from "@/modules/notifications/services/notification.service";

export interface NotifyRsvpChangeParams {
  weddingId: string;
  householdId: string;
  householdName: string;
  oldRsvp: { status: string; attendingCount?: number };
  newRsvp: { status: string; attendingCount?: number; respondedAt?: Date | null };
  actorUserId?: string;
}

export interface RsvpTransition {
  isFirstResponse: boolean;
  oldStatus: string;
  oldCount: number;
  newStatus: string;
  newCount: number;
  transitionKey: string;
}

export class RsvpNotificationService {
  /**
   * Compares validated old state against new state and returns a normalized transition if state changed.
   * Returns null if state is identical or non-RSVP.
   */
  static calculateTransition(
    oldRsvp: { status: string; attendingCount?: number },
    newRsvpStatus: string,
    newAttendingCount: number,
    respondedAt?: Date | null
  ): RsvpTransition | null {
    const oldStatus = oldRsvp?.status || "AWAITING";
    const oldCount = oldRsvp?.attendingCount ?? 0;
    const newStatus = newRsvpStatus || "AWAITING";
    const newCount = newAttendingCount ?? 0;

    if (oldStatus === newStatus && oldCount === newCount) {
      return null;
    }

    const respondedAtMs = respondedAt ? new Date(respondedAt).getTime() : Date.now();
    const transitionKey = `${oldStatus}_${oldCount}_TO_${newStatus}_${newCount}_AT_${respondedAtMs}`;
    const isFirstResponse = oldStatus === "AWAITING";

    return {
      isFirstResponse,
      oldStatus,
      oldCount,
      newStatus,
      newCount,
      transitionKey,
    };
  }

  /**
   * Triggers in-app notifications for committed RSVP status/count transitions.
   * Deduplicates per transition and recipient atomically.
   */
  static async notifyRsvpChange({
    weddingId,
    householdId,
    householdName,
    oldRsvp,
    newRsvp,
    actorUserId,
  }: NotifyRsvpChangeParams): Promise<{ success: boolean; notificationsSent: number }> {
    const transition = this.calculateTransition(
      oldRsvp,
      newRsvp.status,
      newRsvp.attendingCount ?? 0,
      newRsvp.respondedAt
    );

    if (!transition) {
      return { success: true, notificationsSent: 0 };
    }

    await connectToDatabase();

    // Resolve eligible recipients server-side (active members with guests permission or ADMIN role, excluding acting organiser)
    const memberObjs = await TeamMemberRepository.findActiveMembersByWeddingId(weddingId);
    const eligibleRecipients = memberObjs
      .map(({ member }) => member)
      .filter(
        (m) =>
          m.status === "ACTIVE" &&
          (m.role === "ADMIN" || TeamAuthorization.hasPermission(m, "guests")) &&
          (!actorUserId || m.userId.toString() !== actorUserId)
      );

    if (eligibleRecipients.length === 0) {
      return { success: true, notificationsSent: 0 };
    }

    const { isFirstResponse, newStatus, newCount, transitionKey } = transition;

    let title = `RSVP Received from ${householdName}`;
    let message = "";

    if (newStatus === "ATTENDING") {
      if (isFirstResponse) {
        title = `RSVP Received from ${householdName}`;
        message = `Responded ATTENDING (${newCount} guest${newCount === 1 ? "" : "s"})`;
      } else {
        title = `RSVP Updated by ${householdName}`;
        message = `Updated RSVP to ATTENDING (${newCount} guest${newCount === 1 ? "" : "s"})`;
      }
    } else if (newStatus === "NOT_ATTENDING") {
      if (isFirstResponse) {
        title = `RSVP Received from ${householdName}`;
        message = `Responded NOT ATTENDING`;
      } else {
        title = `RSVP Updated by ${householdName}`;
        message = `Updated RSVP to NOT ATTENDING`;
      }
    } else {
      title = `RSVP Reset for ${householdName}`;
      message = `RSVP status reset to AWAITING`;
    }

    let sentCount = 0;

    for (const recipient of eligibleRecipients) {
      const recipientUserId = recipient.userId.toString();
      const dedupKey = `${recipientUserId}_RSVP_${householdId}_${transitionKey}`;

      const res = await NotificationService.createNotification({
        weddingId,
        userId: recipientUserId,
        type: "RSVP_RESPONSE",
        title,
        message,
        entityType: "GUEST",
        entityId: householdId,
        link: `/workspace/${weddingId}/guests?householdId=${householdId}`,
        dedupKey,
      });

      if (res.success && res.data) {
        sentCount++;
      }
    }

    return { success: true, notificationsSent: sentCount };
  }
}
