import crypto from "crypto";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { GuestHouseholdRepository, GuestHouseholdFilterParams, UpdateGuestHouseholdParams } from "../repositories/guest-household.repository";
import { GuestAccessTokenRepository } from "../repositories/guest-access-token.repository";
import { GuestHouseholdDTO, PublicGuestAccessDTO, GuestStatsSummaryDTO, toGuestHouseholdDTO, toPublicGuestAccessDTO } from "../dto/guest.dto";
import { CreateGuestHouseholdInput, UpdateGuestHouseholdInput, PublicRsvpInput } from "../validation/guest.schemas";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { WeddingRepository } from "@/modules/weddings/repositories/wedding.repository";

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function getAppOrigin(): string {
  return (
    process.env.APP_ORIGIN ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export class GuestService {
  /**
   * Helper to check guest management access permission (`guests` permission or ADMIN).
   */
  private static async checkGuestAccess(weddingId: string, userId: string): Promise<boolean> {
    const hasPermission = await TeamAuthorization.requireWeddingPermission(weddingId, userId, "guests");
    if (hasPermission) return true;

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    return Boolean(member && member.status === "ACTIVE" && member.role === "ADMIN");
  }

  /**
   * Fetches guest households for a wedding workspace with filters and aggregated summary metrics.
   */
  static async getHouseholds(
    weddingId: string,
    userId: string,
    filters: Omit<GuestHouseholdFilterParams, "weddingId">
  ): Promise<{
    success: boolean;
    data?: GuestHouseholdDTO[];
    stats?: GuestStatsSummaryDTO;
    nextCursor?: string;
    hasMore?: boolean;
    totalCount?: number;
    error?: string;
    code?: string;
  }> {
    await connectToDatabase();

    const allowed = await GuestService.checkGuestAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires guest permission", code: "FORBIDDEN" };
    }

    try {
      const [{ households, nextCursor, hasMore, totalCount }, stats] = await Promise.all([
        GuestHouseholdRepository.findHouseholdsByFilters({ weddingId, ...filters }),
        GuestHouseholdRepository.aggregateGuestStats(weddingId),
      ]);

      const dtos = households.map(toGuestHouseholdDTO);

      return {
        success: true,
        data: dtos,
        stats,
        nextCursor,
        hasMore,
        totalCount,
      };
    } catch (err: unknown) {
      console.error("Error fetching guest households:", err);
      return { success: false, error: "Failed to fetch guest households", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Fetches a single guest household by ID.
   */
  static async getHouseholdById(
    weddingId: string,
    householdId: string,
    userId: string
  ): Promise<{ success: boolean; data?: GuestHouseholdDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await GuestService.checkGuestAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires guest permission", code: "FORBIDDEN" };
    }

    try {
      const household = await GuestHouseholdRepository.findByIdAndWeddingId({ weddingId, householdId });
      if (!household) {
        return { success: false, error: "Guest household not found", code: "NOT_FOUND" };
      }

      return { success: true, data: toGuestHouseholdDTO(household) };
    } catch (err: unknown) {
      console.error("Error fetching guest household by ID:", err);
      return { success: false, error: "Failed to fetch guest household", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Creates a new guest household.
   */
  static async createHousehold(
    weddingId: string,
    userId: string,
    payload: CreateGuestHouseholdInput
  ): Promise<{ success: boolean; data?: GuestHouseholdDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await GuestService.checkGuestAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires guest permission", code: "FORBIDDEN" };
    }

    try {
      const wId = new Types.ObjectId(weddingId);
      const uId = new Types.ObjectId(userId);

      const household = await GuestHouseholdRepository.create({
        weddingId: wId,
        householdName: payload.householdName,
        primaryContact: {
          name: payload.primaryContact.name,
          email: payload.primaryContact.email || undefined,
          phone: payload.primaryContact.phone || undefined,
        },
        side: payload.side || "BOTH",
        members: payload.members || [],
        totalInvited: payload.totalInvited ?? 1,
        galleryAccess: payload.galleryAccess !== undefined ? payload.galleryAccess : true,
        notes: payload.notes || undefined,
        createdBy: uId,
      });

      return { success: true, data: toGuestHouseholdDTO(household) };
    } catch (err: unknown) {
      console.error("Error creating guest household:", err);
      return { success: false, error: "Failed to create guest household", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Updates an existing guest household document.
   */
  static async updateHousehold(
    weddingId: string,
    householdId: string,
    userId: string,
    payload: UpdateGuestHouseholdInput
  ): Promise<{ success: boolean; data?: GuestHouseholdDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await GuestService.checkGuestAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires guest permission", code: "FORBIDDEN" };
    }

    const existing = await GuestHouseholdRepository.findByIdAndWeddingId({ weddingId, householdId });
    if (!existing) {
      return { success: false, error: "Guest household not found", code: "NOT_FOUND" };
    }

    const updateData: UpdateGuestHouseholdParams = {
      updatedBy: new Types.ObjectId(userId),
    };

    if (payload.householdName !== undefined) updateData.householdName = payload.householdName;
    if (payload.primaryContact !== undefined) updateData.primaryContact = payload.primaryContact;
    if (payload.side !== undefined) updateData.side = payload.side;
    if (payload.members !== undefined) updateData.members = payload.members;
    if (payload.totalInvited !== undefined) updateData.totalInvited = payload.totalInvited;
    if (payload.invitationStatus !== undefined) {
      updateData.invitationStatus = payload.invitationStatus;
      if (payload.invitationStatus === "SENT" && existing.invitationStatus !== "SENT") {
        updateData.invitationSentAt = new Date();
      }
    }
    if (payload.galleryAccess !== undefined) updateData.galleryAccess = payload.galleryAccess;
    if (payload.notes !== undefined) updateData.notes = payload.notes;

    const targetTotal = payload.totalInvited ?? existing.totalInvited;
    const effectiveStatus = payload.rsvp?.status ?? existing.rsvp.status;

    if (payload.rsvp !== undefined || (payload.totalInvited !== undefined && existing.rsvp.status === "ATTENDING")) {
      let count = payload.rsvp?.attendingCount ?? existing.rsvp.attendingCount ?? existing.totalInvited;

      if (effectiveStatus === "ATTENDING") {
        if (count === undefined || count < 1) count = targetTotal;
        if (count > targetTotal) count = targetTotal;
      } else {
        count = 0;
      }

      updateData.rsvp = {
        status: effectiveStatus,
        attendingCount: count,
        respondedAt: payload.rsvp !== undefined ? new Date() : (existing.rsvp.respondedAt || new Date()),
      };
    }

    try {
      const updated = await GuestHouseholdRepository.updateByIdAndWeddingId({
        weddingId,
        householdId,
        updateData,
      });

      return { success: true, data: toGuestHouseholdDTO(updated!) };
    } catch (err: unknown) {
      console.error("Error updating guest household:", err);
      return { success: false, error: "Failed to update guest household", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Deletes a guest household and revokes/deletes all associated access tokens.
   */
  static async deleteHousehold(
    weddingId: string,
    householdId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await GuestService.checkGuestAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires guest permission", code: "FORBIDDEN" };
    }

    try {
      const deleted = await GuestHouseholdRepository.deleteByIdAndWeddingId({ weddingId, householdId });
      if (!deleted) {
        return { success: false, error: "Guest household not found", code: "NOT_FOUND" };
      }

      // Delete associated access tokens
      await GuestAccessTokenRepository.deleteAllByHouseholdId({ weddingId, householdId });

      return { success: true };
    } catch (err: unknown) {
      console.error("Error deleting guest household:", err);
      return { success: false, error: "Failed to delete guest household", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Generates or rotates a secure guest access link (storing only SHA-256 tokenHash).
   */
  static async generateAccessLink(
    weddingId: string,
    householdId: string,
    userId: string
  ): Promise<{
    success: boolean;
    data?: { rawToken: string; accessUrl: string; tokenHash: string };
    error?: string;
    code?: string;
  }> {
    await connectToDatabase();

    const allowed = await GuestService.checkGuestAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires guest permission", code: "FORBIDDEN" };
    }

    const household = await GuestHouseholdRepository.findByIdAndWeddingId({ weddingId, householdId });
    if (!household) {
      return { success: false, error: "Guest household not found", code: "NOT_FOUND" };
    }

    try {
      // Revoke any previous active tokens for this household
      await GuestAccessTokenRepository.revokeActiveTokensByHouseholdId({ weddingId, householdId });

      // Generate cryptographically secure random token (64 hex characters)
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);

      const wId = new Types.ObjectId(weddingId);
      const hId = new Types.ObjectId(householdId);

      // Default expiry: 365 days
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      await GuestAccessTokenRepository.create({
        weddingId: wId,
        householdId: hId,
        tokenHash,
        expiresAt,
      });

      const appOrigin = getAppOrigin();
      const accessUrl = `${appOrigin}/invitation/${rawToken}`;

      return {
        success: true,
        data: {
          rawToken,
          accessUrl,
          tokenHash,
        },
      };
    } catch (err: unknown) {
      console.error("Error generating guest access link:", err);
      return { success: false, error: "Failed to generate guest access link", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Marks a guest household invitation as SENT.
   */
  static async markInvitationSent(
    weddingId: string,
    householdId: string,
    userId: string
  ): Promise<{ success: boolean; data?: GuestHouseholdDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await GuestService.checkGuestAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires guest permission", code: "FORBIDDEN" };
    }

    const household = await GuestHouseholdRepository.findByIdAndWeddingId({ weddingId, householdId });
    if (!household) {
      return { success: false, error: "Guest household not found", code: "NOT_FOUND" };
    }

    try {
      const updated = await GuestHouseholdRepository.updateByIdAndWeddingId({
        weddingId,
        householdId,
        updateData: {
          invitationStatus: "SENT",
          invitationSentAt: new Date(),
          updatedBy: new Types.ObjectId(userId),
        },
      });

      return { success: true, data: toGuestHouseholdDTO(updated!) };
    } catch (err: unknown) {
      console.error("Error marking invitation sent:", err);
      return { success: false, error: "Failed to mark invitation as sent", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Public Endpoint: Fetches public-safe invitation details using raw token.
   */
  static async getPublicGuestAccess(
    rawToken: string
  ): Promise<{ success: boolean; data?: PublicGuestAccessDTO; error?: string; code?: string }> {
    await connectToDatabase();

    if (!rawToken || !rawToken.trim()) {
      return { success: false, error: "Token is required", code: "INVALID_TOKEN" };
    }

    const tokenHash = hashToken(rawToken.trim());
    const tokenDoc = await GuestAccessTokenRepository.findByTokenHash(tokenHash);

    if (!tokenDoc) {
      return { success: false, error: "Invalid invitation link", code: "NOT_FOUND" };
    }

    if (tokenDoc.revokedAt) {
      return { success: false, error: "Invitation link has been revoked", code: "TOKEN_REVOKED" };
    }

    if (tokenDoc.expiresAt && new Date(tokenDoc.expiresAt).getTime() < Date.now()) {
      return { success: false, error: "Invitation link has expired", code: "TOKEN_EXPIRED" };
    }

    try {
      const household = await GuestHouseholdRepository.findByIdAndWeddingId({
        weddingId: tokenDoc.weddingId.toString(),
        householdId: tokenDoc.householdId.toString(),
      });

      if (!household) {
        return { success: false, error: "Household record not found", code: "NOT_FOUND" };
      }

      const wedding = await WeddingRepository.findById(tokenDoc.weddingId.toString());
      if (!wedding) {
        return { success: false, error: "Wedding workspace not found", code: "NOT_FOUND" };
      }

      // Record lastUsedAt asynchronously
      void GuestAccessTokenRepository.updateLastUsedAt(tokenDoc._id);

      return {
        success: true,
        data: toPublicGuestAccessDTO(household, {
          title: wedding.title,
          primaryWeddingDate: wedding.primaryWeddingDate,
          brideName: wedding.bride?.name,
          groomName: wedding.groom?.name,
          locationName: wedding.generalLocation?.name,
          cityName: wedding.generalLocation?.city,
        }),
      };
    } catch (err: unknown) {
      console.error("Error fetching public guest access:", err);
      return { success: false, error: "Failed to load invitation", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Public Endpoint: Submits public RSVP response using raw token.
   */
  static async submitPublicRsvp(
    rawToken: string,
    payload: PublicRsvpInput
  ): Promise<{ success: boolean; data?: PublicGuestAccessDTO; error?: string; code?: string }> {
    await connectToDatabase();

    if (!rawToken || !rawToken.trim()) {
      return { success: false, error: "Token is required", code: "INVALID_TOKEN" };
    }

    const tokenHash = hashToken(rawToken.trim());
    const tokenDoc = await GuestAccessTokenRepository.findByTokenHash(tokenHash);

    if (!tokenDoc) {
      return { success: false, error: "Invalid invitation link", code: "NOT_FOUND" };
    }

    if (tokenDoc.revokedAt) {
      return { success: false, error: "Invitation link has been revoked", code: "TOKEN_REVOKED" };
    }

    if (tokenDoc.expiresAt && new Date(tokenDoc.expiresAt).getTime() < Date.now()) {
      return { success: false, error: "Invitation link has expired", code: "TOKEN_EXPIRED" };
    }

    const household = await GuestHouseholdRepository.findByIdAndWeddingId({
      weddingId: tokenDoc.weddingId.toString(),
      householdId: tokenDoc.householdId.toString(),
    });

    if (!household) {
      return { success: false, error: "Household record not found", code: "NOT_FOUND" };
    }

    // Validate attendingCount against totalInvited
    let count = payload.attendingCount;
    if (payload.status === "ATTENDING") {
      if (count === undefined || count < 1) count = household.totalInvited;
      if (count > household.totalInvited) {
        return {
          success: false,
          error: `Attending count cannot exceed total invited guests (${household.totalInvited})`,
          code: "RSVP_COUNT_INVALID",
        };
      }
    } else if (payload.status === "NOT_ATTENDING") {
      count = 0;
    }

    try {
      const updated = await GuestHouseholdRepository.updateByIdAndWeddingId({
        weddingId: tokenDoc.weddingId.toString(),
        householdId: tokenDoc.householdId.toString(),
        updateData: {
          rsvp: {
            status: payload.status,
            attendingCount: count,
            respondedAt: new Date(),
          },
        },
      });

      const wedding = await WeddingRepository.findById(tokenDoc.weddingId.toString());

      return {
        success: true,
        data: toPublicGuestAccessDTO(updated!, {
          title: wedding?.title || "Wedding Invitation",
          primaryWeddingDate: wedding?.primaryWeddingDate,
          brideName: wedding?.bride?.name,
          groomName: wedding?.groom?.name,
          locationName: wedding?.generalLocation?.name,
          cityName: wedding?.generalLocation?.city,
        }),
      };
    } catch (err: unknown) {
      console.error("Error submitting public RSVP:", err);
      return { success: false, error: "Failed to submit RSVP response", code: "INTERNAL_ERROR" };
    }
  }
}
