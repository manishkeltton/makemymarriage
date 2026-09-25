import crypto from "crypto";
import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { WeddingRepository } from "@/modules/weddings/repositories/wedding.repository";
import { EventRepository } from "@/modules/events/repositories/event.repository";
import { TeamMemberRepository } from "../repositories/team-member.repository";
import { TeamInviteRepository } from "../repositories/team-invite.repository";
import { TeamAuthorization } from "../authorization/team.auth";
import { EmailService } from "@/lib/services/email.service";
import {
  TeamMemberDTO,
  PendingInviteDTO,
  PublicInvitePreviewDTO,
  toTeamMemberDTO,
  toPendingInviteDTO,
  toPublicInvitePreviewDTO,
} from "../dto/team.dto";
import { CreateInviteInput, UpdateMemberInput } from "../validation/team.schemas";

export class TeamService {
  /**
   * Helper to hash a raw token using SHA-256.
   */
  public static hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  /**
   * Helper to construct full public invitation URL.
   */
  public static getInviteUrl(rawToken: string): string {
    const baseUrl = process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
      (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined);
    if (!baseUrl) throw new Error("APP_ORIGIN is required for invitation links");
    const url = new URL(baseUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
        (process.env.NODE_ENV === "production" && (url.protocol !== "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) {
      throw new Error("APP_ORIGIN must be a public HTTPS URL in production");
    }
    return new URL(`/invite/${encodeURIComponent(rawToken)}`, url.origin).toString();
  }

  /**
   * Returns active team members for a wedding (Admin only).
   */
  static async getTeamMembers(
    weddingId: string,
    userId: string
  ): Promise<{ success: boolean; data?: TeamMemberDTO[]; error?: string; code?: string }> {
    await connectToDatabase();

    const admin = await TeamAuthorization.requireWeddingAdmin(weddingId, userId);
    if (!admin) {
      return { success: false, error: "Only wedding ADMIN can view team members", code: "FORBIDDEN" };
    }

    try {
      const memberDocs = await TeamMemberRepository.findActiveMembersByWeddingId(weddingId);
      const dtos = memberDocs.map(({ member, user }) => toTeamMemberDTO(member, user));
      return { success: true, data: dtos };
    } catch (err: unknown) {
      console.error("Error fetching team members:", err);
      return { success: false, error: "Failed to fetch team members", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Returns pending invitations for a wedding (Admin only).
   */
  static async getPendingInvites(
    weddingId: string,
    userId: string
  ): Promise<{ success: boolean; data?: PendingInviteDTO[]; error?: string; code?: string }> {
    await connectToDatabase();

    const admin = await TeamAuthorization.requireWeddingAdmin(weddingId, userId);
    if (!admin) {
      return { success: false, error: "Only wedding ADMIN can view invitations", code: "FORBIDDEN" };
    }

    try {
      const invites = await TeamInviteRepository.findPendingInvitesByWeddingId(weddingId);
      const dtos = invites.map(toPendingInviteDTO);
      return { success: true, data: dtos };
    } catch (err: unknown) {
      console.error("Error fetching pending invites:", err);
      return { success: false, error: "Failed to fetch invitations", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Creates and dispatches a team invitation (Admin only).
   */
  static async createInvite(
    weddingId: string,
    userId: string,
    payload: CreateInviteInput
  ): Promise<{ success: boolean; data?: PendingInviteDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const admin = await TeamAuthorization.requireWeddingAdmin(weddingId, userId);
    if (!admin) {
      return { success: false, error: "Only wedding ADMIN can invite team members", code: "FORBIDDEN" };
    }

    const normalizedEmail = payload.email.toLowerCase().trim();

    try {
      // 1. Check if user with this email is already an active member
      const existingUser = await User.findOne({ normalizedEmail });
      if (existingUser) {
        const activeMember = await TeamMemberRepository.findByUserIdAndWeddingId({
          weddingId,
          userId: existingUser._id.toString(),
        });
        if (activeMember && activeMember.status === "ACTIVE") {
          return {
            success: false,
            error: "User is already an active member of this wedding workspace",
            code: "ALREADY_ACTIVE_MEMBER",
          };
        }
      }

      // 2. Validate event scope if not allEvents
      const eventIds: Types.ObjectId[] = [];
      if (!payload.eventScope?.allEvents && payload.eventScope?.eventIds?.length) {
        for (const eId of payload.eventScope.eventIds) {
          const validEvent = await EventRepository.findByIdAndWeddingId({
            weddingId,
            eventId: eId,
          });
          if (!validEvent) {
            return {
              success: false,
              error: `Event ID ${eId} does not belong to this wedding workspace`,
              code: "INVALID_EVENT_SCOPE",
            };
          }
          eventIds.push(new Types.ObjectId(eId));
        }
      }

      // 3. Generate raw token & hash
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = this.hashToken(rawToken);
      const inviteUrl = this.getInviteUrl(rawToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // 4. Revoke existing pending invite for this email if present
      const existingPending = await TeamInviteRepository.findPendingInviteByEmail({
        weddingId,
        normalizedEmail,
      });
      if (existingPending) {
        await TeamInviteRepository.updateInviteStatus({
          inviteId: existingPending._id,
          status: "REVOKED",
        });
      }

      const defaultPermissions = {
        guests: true,
        vendors: true,
        finance: true,
        gallery: true,
        website: true,
        guestbook: true,
        emergency: true,
      };
      const permissions = {
        ...defaultPermissions,
        ...(payload.permissions || {}),
      };

      // 5. Create invite
      const inviteDoc = await TeamInviteRepository.createInvite({
        weddingId: new Types.ObjectId(weddingId),
        invitedEmail: payload.email.trim(),
        normalizedEmail,
        role: payload.role,
        permissions,
        eventScope: {
          allEvents: payload.eventScope?.allEvents ?? true,
          eventIds,
        },
        tokenHash,
        expiresAt,
        invitedBy: new Types.ObjectId(userId),
      });

      // 6. Fetch inviter & wedding details for email
      const inviterUser = await User.findById(userId);
      const weddingDoc = await WeddingRepository.findById(weddingId);

      // Enqueue email job
      const emailSent = await EmailService.enqueueTeamInviteEmail({
        toEmail: payload.email,
        invitedByName: inviterUser?.name || "A Wedding Admin",
        weddingTitle: weddingDoc?.title || "Wedding Workspace",
        role: payload.role,
        inviteUrl,
        expiresAt,
      });

      const inviteDto = toPendingInviteDTO(inviteDoc);
      inviteDto.inviteUrl = inviteUrl;
      inviteDto.emailDelivery = emailSent ? "SENT" : "FAILED";

      return { success: true, data: inviteDto };
    } catch (err: unknown) {
      console.error("Error creating invitation:", err);
      return { success: false, error: "Failed to create invitation", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Resends a pending invitation with a new token & refreshed expiry (Admin only).
   */
  static async resendInvite(
    weddingId: string,
    inviteId: string,
    userId: string
  ): Promise<{ success: boolean; data?: PendingInviteDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const admin = await TeamAuthorization.requireWeddingAdmin(weddingId, userId);
    if (!admin) {
      return { success: false, error: "Only wedding ADMIN can resend invitations", code: "FORBIDDEN" };
    }

    try {
      const invite = await TeamInviteRepository.findByIdAndWeddingId({ weddingId, inviteId });
      if (!invite || invite.status !== "PENDING") {
        return { success: false, error: "Pending invitation not found", code: "NOT_FOUND" };
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const newTokenHash = this.hashToken(rawToken);
      const inviteUrl = this.getInviteUrl(rawToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const updatedInvite = await TeamInviteRepository.refreshInviteForResend({
        inviteId,
        weddingId,
        newTokenHash,
        expiresAt,
      });

      const inviterUser = await User.findById(userId);
      const weddingDoc = await WeddingRepository.findById(weddingId);

      const emailSent = await EmailService.enqueueTeamInviteEmail({
        toEmail: invite.invitedEmail,
        invitedByName: inviterUser?.name || "A Wedding Admin",
        weddingTitle: weddingDoc?.title || "Wedding Workspace",
        role: invite.role,
        inviteUrl,
        expiresAt,
      });

      const inviteDto = toPendingInviteDTO(updatedInvite!);
      inviteDto.inviteUrl = inviteUrl;
      inviteDto.emailDelivery = emailSent ? "SENT" : "FAILED";

      return { success: true, data: inviteDto };
    } catch (err: unknown) {
      console.error("Error resending invitation:", err);
      return { success: false, error: "Failed to resend invitation", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Revokes a pending invitation (Admin only).
   */
  static async revokeInvite(
    weddingId: string,
    inviteId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    await connectToDatabase();

    const admin = await TeamAuthorization.requireWeddingAdmin(weddingId, userId);
    if (!admin) {
      return { success: false, error: "Only wedding ADMIN can revoke invitations", code: "FORBIDDEN" };
    }

    try {
      const invite = await TeamInviteRepository.findByIdAndWeddingId({ weddingId, inviteId });
      if (!invite || invite.status !== "PENDING") {
        return { success: false, error: "Pending invitation not found", code: "NOT_FOUND" };
      }

      await TeamInviteRepository.updateInviteStatus({
        inviteId,
        status: "REVOKED",
      });

      return { success: true };
    } catch (err: unknown) {
      console.error("Error revoking invitation:", err);
      return { success: false, error: "Failed to revoke invitation", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Updates a member's role, permissions, or event scope (Admin only).
   */
  static async updateMember(
    weddingId: string,
    memberId: string,
    userId: string,
    payload: UpdateMemberInput
  ): Promise<{ success: boolean; data?: TeamMemberDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const admin = await TeamAuthorization.requireWeddingAdmin(weddingId, userId);
    if (!admin) {
      return { success: false, error: "Only wedding ADMIN can update team members", code: "FORBIDDEN" };
    }

    try {
      const targetMember = await TeamMemberRepository.findByIdAndWeddingId({ weddingId, memberId });
      if (!targetMember || targetMember.status !== "ACTIVE") {
        return { success: false, error: "Team member not found", code: "NOT_FOUND" };
      }

      // FINAL ADMIN PROTECTION: Prevent demoting final Admin to Manager or Organiser
      if (
        targetMember.role === "ADMIN" &&
        payload.role &&
        payload.role !== "ADMIN"
      ) {
        const adminCount = await TeamMemberRepository.countActiveAdmins(weddingId);
        if (adminCount <= 1) {
          return {
            success: false,
            error: "Cannot demote the only remaining Admin for this wedding workspace",
            code: "CANNOT_DEMOTE_FINAL_ADMIN",
          };
        }
      }

      // Validate eventIds belong to wedding
      const eventIds: Types.ObjectId[] = [];
      if (payload.eventScope && !payload.eventScope.allEvents && payload.eventScope.eventIds?.length) {
        for (const eId of payload.eventScope.eventIds) {
          const validEvent = await EventRepository.findByIdAndWeddingId({
            weddingId,
            eventId: eId,
          });
          if (!validEvent) {
            return {
              success: false,
              error: `Event ID ${eId} does not belong to this wedding workspace`,
              code: "INVALID_EVENT_SCOPE",
            };
          }
          eventIds.push(new Types.ObjectId(eId));
        }
      }

      const updateData: Record<string, unknown> = {};
      if (payload.role) updateData.role = payload.role;
      if (payload.permissions) updateData.permissions = payload.permissions;
      if (payload.eventScope) {
        updateData.eventScope = {
          allEvents: payload.eventScope.allEvents,
          eventIds,
        };
      }

      const updatedMember = await TeamMemberRepository.updateMemberByIdAndWeddingId({
        weddingId,
        memberId,
        updateData: updateData as Record<string, unknown>,
      });

      const userDoc = await User.findById(updatedMember!.userId);
      return { success: true, data: toTeamMemberDTO(updatedMember!, userDoc) };
    } catch (err: unknown) {
      console.error("Error updating team member:", err);
      return { success: false, error: "Failed to update team member", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Soft-removes a member from the wedding workspace (Admin only).
   */
  static async removeMember(
    weddingId: string,
    memberId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    await connectToDatabase();

    const admin = await TeamAuthorization.requireWeddingAdmin(weddingId, userId);
    if (!admin) {
      return { success: false, error: "Only wedding ADMIN can remove team members", code: "FORBIDDEN" };
    }

    try {
      const targetMember = await TeamMemberRepository.findByIdAndWeddingId({ weddingId, memberId });
      if (!targetMember || targetMember.status !== "ACTIVE") {
        return { success: false, error: "Team member not found", code: "NOT_FOUND" };
      }

      // FINAL ADMIN PROTECTION: Prevent removing final Admin
      if (targetMember.role === "ADMIN") {
        const adminCount = await TeamMemberRepository.countActiveAdmins(weddingId);
        if (adminCount <= 1) {
          return {
            success: false,
            error: "Cannot remove the only remaining Admin for this wedding workspace",
            code: "CANNOT_REMOVE_FINAL_ADMIN",
          };
        }
      }

      const removed = await TeamMemberRepository.softDeleteMemberByIdAndWeddingId({
        weddingId,
        memberId,
      });

      if (!removed) {
        return { success: false, error: "Failed to remove member", code: "NOT_FOUND" };
      }

      return { success: true };
    } catch (err: unknown) {
      console.error("Error removing team member:", err);
      return { success: false, error: "Failed to remove team member", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Public preview of invitation using raw token string.
   */
  static async getPublicInvitePreview(
    rawToken: string
  ): Promise<{ success: boolean; data?: PublicInvitePreviewDTO; error?: string; code?: string }> {
    await connectToDatabase();

    if (!rawToken || typeof rawToken !== "string") {
      return { success: false, error: "Invalid invitation token", code: "INVALID_TOKEN" };
    }

    try {
      const tokenHash = this.hashToken(rawToken);
      const invite = await TeamInviteRepository.findInviteByTokenHash(tokenHash);
      if (!invite) {
        return { success: false, error: "Invitation not found or invalid", code: "NOT_FOUND" };
      }

      const weddingDoc = await WeddingRepository.findById(invite.weddingId);
      if (!weddingDoc) {
        return { success: false, error: "Associated wedding workspace not found", code: "NOT_FOUND" };
      }

      const inviterUser = await User.findById(invite.invitedBy);
      const isInvitedUserRegistered = Boolean(
        await User.exists({ normalizedEmail: invite.normalizedEmail })
      );

      return {
        success: true,
        data: toPublicInvitePreviewDTO(invite, weddingDoc, inviterUser, isInvitedUserRegistered),
      };
    } catch (err: unknown) {
      console.error("Error fetching public invite preview:", err);
      return { success: false, error: "Internal server error", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Accepts invitation for logged-in user with matching normalized email.
   */
  static async acceptInvite(
    rawToken: string,
    currentUserId: string
  ): Promise<{ success: boolean; weddingId?: string; error?: string; code?: string }> {
    await connectToDatabase();

    if (!rawToken || !Types.ObjectId.isValid(currentUserId)) {
      return { success: false, error: "Invalid request parameters", code: "INVALID_INPUT" };
    }

    try {
      const tokenHash = this.hashToken(rawToken);
      const invite = await TeamInviteRepository.findInviteByTokenHash(tokenHash);

      if (!invite) {
        return { success: false, error: "Invitation not found or invalid", code: "NOT_FOUND" };
      }

      if (invite.status === "ACCEPTED") {
        return { success: true, weddingId: invite.weddingId.toString() };
      }

      if (invite.status !== "PENDING") {
        return {
          success: false,
          error: `Invitation has been ${invite.status.toLowerCase()}`,
          code: `INVITE_${invite.status}`,
        };
      }

      if (new Date(invite.expiresAt).getTime() < Date.now()) {
        await TeamInviteRepository.updateInviteStatus({
          inviteId: invite._id,
          status: "EXPIRED",
        });
        return { success: false, error: "Invitation has expired", code: "INVITE_EXPIRED" };
      }

      // Check current user email match
      const currentUser = await User.findById(currentUserId);
      if (!currentUser) {
        return { success: false, error: "Authenticated user account not found", code: "USER_NOT_FOUND" };
      }

      if (currentUser.normalizedEmail !== invite.normalizedEmail) {
        return {
          success: false,
          error: `Invitation was sent to ${invite.invitedEmail}, but you are logged in as ${currentUser.email}.`,
          code: "EMAIL_MISMATCH",
        };
      }

      // Check if user is already an active member
      const existingMember = await TeamMemberRepository.findByUserIdAndWeddingId({
        weddingId: invite.weddingId,
        userId: currentUserId,
      });

      if (existingMember && existingMember.status === "ACTIVE") {
        await TeamInviteRepository.updateInviteStatus({
          inviteId: invite._id,
          status: "ACCEPTED",
          acceptedBy: new Types.ObjectId(currentUserId),
          acceptedAt: new Date(),
        });
        return { success: true, weddingId: invite.weddingId.toString() };
      }

      // Execute transaction (or standalone fallback)
      let mongoSession: mongoose.ClientSession | null = null;
      try {
        mongoSession = await mongoose.startSession();
        await mongoSession.withTransaction(async () => {
          if (existingMember) {
            await TeamMemberRepository.updateMemberByIdAndWeddingId({
              weddingId: invite.weddingId,
              memberId: existingMember._id,
              updateData: {
                role: invite.role,
                permissions: invite.permissions,
                eventScope: invite.eventScope,
                status: "ACTIVE",
              },
              session: mongoSession!,
            });
          } else {
            await TeamMemberRepository.createMember(
              {
                weddingId: invite.weddingId,
                userId: new Types.ObjectId(currentUserId),
                role: invite.role,
                permissions: invite.permissions,
                eventScope: invite.eventScope,
                status: "ACTIVE",
              },
              mongoSession!
            );
          }

          await TeamInviteRepository.updateInviteStatus({
            inviteId: invite._id,
            status: "ACCEPTED",
            acceptedBy: new Types.ObjectId(currentUserId),
            acceptedAt: new Date(),
            session: mongoSession!,
          });
        });
      } catch (txErr: unknown) {
        console.error("Transaction failed during acceptInvite, trying fallback:", txErr);
        if (existingMember) {
          await TeamMemberRepository.updateMemberByIdAndWeddingId({
            weddingId: invite.weddingId,
            memberId: existingMember._id,
            updateData: {
              role: invite.role,
              permissions: invite.permissions,
              eventScope: invite.eventScope,
              status: "ACTIVE",
            },
          });
        } else {
          await TeamMemberRepository.createMember({
            weddingId: invite.weddingId,
            userId: new Types.ObjectId(currentUserId),
            role: invite.role,
            permissions: invite.permissions,
            eventScope: invite.eventScope,
            status: "ACTIVE",
          });
        }

        await TeamInviteRepository.updateInviteStatus({
          inviteId: invite._id,
          status: "ACCEPTED",
          acceptedBy: new Types.ObjectId(currentUserId),
          acceptedAt: new Date(),
        });
      } finally {
        if (mongoSession) mongoSession.endSession();
      }

      return { success: true, weddingId: invite.weddingId.toString() };
    } catch (err: unknown) {
      console.error("Error accepting invite:", err);
      return { success: false, error: "Failed to accept invitation", code: "INTERNAL_ERROR" };
    }
  }
}
