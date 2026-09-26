import crypto from "crypto";
import { connectToDatabase } from "@/lib/db/connect";
import { GuestAccessTokenRepository } from "../repositories/guest-access-token.repository";
import { GuestHouseholdRepository } from "../repositories/guest-household.repository";
import { AppError } from "@/shared/errors/app-error";

export interface VerifiedGuestAccess {
  weddingId: string;
  householdId: string;
  householdName: string;
}

export async function verifyGuestTokenAccess(rawToken: string): Promise<VerifiedGuestAccess> {
  await connectToDatabase();

  if (!rawToken || !rawToken.trim()) {
    throw new AppError("AUTH_REQUIRED", "Invitation token is required", 401);
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
  const tokenDoc = await GuestAccessTokenRepository.findByTokenHash(tokenHash);

  if (!tokenDoc) {
    throw new AppError("RESOURCE_NOT_FOUND", "Invalid or unknown invitation token", 404);
  }

  if (tokenDoc.revokedAt) {
    throw new AppError("FORBIDDEN", "Invitation link has been revoked", 403);
  }

  if (tokenDoc.expiresAt && new Date(tokenDoc.expiresAt).getTime() < Date.now()) {
    throw new AppError("FORBIDDEN", "Invitation link has expired", 403);
  }

  const household = await GuestHouseholdRepository.findByIdAndWeddingId({
    weddingId: tokenDoc.weddingId.toString(),
    householdId: tokenDoc.householdId.toString(),
  });

  if (!household) {
    throw new AppError("RESOURCE_NOT_FOUND", "Guest household not found", 404);
  }

  if (household.galleryAccess === false) {
    throw new AppError("FORBIDDEN", "Gallery access is disabled for this household", 403);
  }

  // Record token usage
  void GuestAccessTokenRepository.updateLastUsedAt(tokenDoc._id);

  return {
    weddingId: tokenDoc.weddingId.toString(),
    householdId: tokenDoc.householdId.toString(),
    householdName: household.householdName,
  };
}
