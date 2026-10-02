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

  /**
   * Helper to check if a member has a functional permission key.
   */
  static hasPermission(
    member: IWeddingMember,
    permissionKey: keyof IWeddingMemberPermissions
  ): boolean {
    if (!member || member.status !== "ACTIVE") return false;
    if (member.role === "ADMIN") return true;
    return Boolean(member.permissions?.[permissionKey]);
  }

  /**
   * Helper to check if a member can access an event ID.
   */
  static canAccessEventId(member: IWeddingMember, eventId?: string | null): boolean {
    if (!member || member.status !== "ACTIVE") return false;
    if (member.role === "ADMIN" || member.eventScope?.allEvents) return true;
    if (!eventId) return true;
    const allowed = member.eventScope?.eventIds || [];
    return allowed.some((id) => id.toString() === eventId.toString());
  }

  /**
   * Helper to check if a member can access a task.
   */
  static canAccessTask(member: IWeddingMember, task: { eventId?: unknown }): boolean {
    if (!member || member.status !== "ACTIVE") return false;
    if (member.role === "ADMIN" || member.eventScope?.allEvents) return true;
    const eventIdStr = task.eventId ? task.eventId.toString() : null;
    return this.canAccessEventId(member, eventIdStr);
  }

  /**
   * Helper to check if a member can access a vendor.
   */
  static canAccessVendor(
    member: IWeddingMember,
    vendor: { eventIds?: unknown[] }
  ): boolean {
    if (!member || member.status !== "ACTIVE") return false;
    if (!this.hasPermission(member, "vendors")) return false;
    if (member.role === "ADMIN" || member.eventScope?.allEvents) return true;
    const vendorEvents = (vendor.eventIds || []).map((id: unknown) => String(id));
    if (vendorEvents.length === 0) return true;
    const allowed = new Set((member.eventScope?.eventIds || []).map((id) => id.toString()));
    return vendorEvents.some((id) => allowed.has(id));
  }

  /**
   * Helper to check if a member can access an expense.
   */
  static canAccessExpense(
    member: IWeddingMember,
    expense: { eventId?: unknown; approvalStatus?: string }
  ): boolean {
    if (!member || member.status !== "ACTIVE") return false;
    if (!this.hasPermission(member, "finance")) return false;
    if (expense.approvalStatus === "REJECTED") return false;
    if (member.role === "ADMIN" || member.eventScope?.allEvents) return true;
    const eventIdStr = expense.eventId ? expense.eventId.toString() : null;
    return this.canAccessEventId(member, eventIdStr);
  }

  /**
   * Helper to check document parent authorization & orphan policy.
   */
  static canAccessDocument(
    member: IWeddingMember,
    doc: {
      weddingId?: unknown;
      relatedTo?: { type?: string; id?: unknown };
    },
    parentMaps?: {
      events?: Map<string, { _id: unknown }>;
      tasks?: Map<string, { eventId?: unknown }>;
      vendors?: Map<string, { eventIds?: unknown[] }>;
      expenses?: Map<string, { eventId?: unknown; approvalStatus?: string }>;
    }
  ): boolean {
    if (!member || member.status !== "ACTIVE") return false;
    if (!doc.relatedTo || !doc.relatedTo.type || !doc.relatedTo.id) {
      return true; // Standalone document
    }

    const parentIdStr = doc.relatedTo.id.toString();

    switch (doc.relatedTo.type) {
      case "EVENT": {
        const parentEvent = parentMaps?.events?.get(parentIdStr);
        if (!parentEvent) return false;
        return this.canAccessEventId(member, parentIdStr);
      }
      case "TASK": {
        const parentTask = parentMaps?.tasks?.get(parentIdStr);
        if (!parentTask) return false;
        return this.canAccessTask(member, parentTask);
      }
      case "VENDOR": {
        const parentVendor = parentMaps?.vendors?.get(parentIdStr);
        if (!parentVendor) return false;
        return this.canAccessVendor(member, parentVendor);
      }
      case "EXPENSE": {
        const parentExpense = parentMaps?.expenses?.get(parentIdStr);
        if (!parentExpense) return false;
        return this.canAccessExpense(member, parentExpense);
      }
      default:
        return true;
    }
  }
}
