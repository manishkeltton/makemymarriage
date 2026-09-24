import { TeamMemberRepository } from "../repositories/team-member.repository";
import { IWeddingMember, IWeddingMemberPermissions } from "@/modules/weddings/models/wedding-member.model";

export class TeamAuthorization {
  /**
   * Requires that a user is an active member of the wedding workspace.
   */
  static async requireWeddingMembership(
    weddingId: string,
    userId: string
  ): Promise<IWeddingMember | null> {
    return await TeamMemberRepository.findByUserIdAndWeddingId({ weddingId, userId });
  }

  /**
   * Requires that a user is an active ADMIN of the wedding workspace.
   */
  static async requireWeddingAdmin(
    weddingId: string,
    userId: string
  ): Promise<IWeddingMember | null> {
    const member = await this.requireWeddingMembership(weddingId, userId);
    if (!member || member.status !== "ACTIVE" || member.role !== "ADMIN") {
      return null;
    }
    return member;
  }

  /**
   * Checks if a user has a specific functional permission for a wedding.
   * ADMIN role implicitly has all permissions.
   */
  static async requireWeddingPermission(
    weddingId: string,
    userId: string,
    permissionKey: keyof IWeddingMemberPermissions
  ): Promise<boolean> {
    const member = await this.requireWeddingMembership(weddingId, userId);
    if (!member || member.status !== "ACTIVE") {
      return false;
    }

    if (member.role === "ADMIN") {
      return true;
    }

    return Boolean(member.permissions?.[permissionKey]);
  }

  /**
   * Checks if a user has access to a specific event within a wedding based on event scope.
   */
  static async requireEventAccess(
    weddingId: string,
    userId: string,
    eventId: string
  ): Promise<boolean> {
    const member = await this.requireWeddingMembership(weddingId, userId);
    if (!member || member.status !== "ACTIVE") {
      return false;
    }

    if (member.role === "ADMIN" || member.eventScope?.allEvents) {
      return true;
    }

    const eventIds = member.eventScope?.eventIds || [];
    return eventIds.some((id) => id.toString() === eventId);
  }
}
