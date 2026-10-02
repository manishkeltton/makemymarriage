import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { EventModel } from "@/modules/events/models/event.model";
import { TaskModel } from "@/modules/tasks/models/task.model";
import { GuestHouseholdModel } from "@/modules/guests/models/guest-household.model";
import { VendorModel } from "@/modules/vendors/models/vendor.model";
import { ExpenseModel } from "@/modules/expenses/models/expense.model";
import { DocumentModel } from "@/modules/documents/models/document.model";
import {
  SearchResponseDTO,
  SearchEventResultDTO,
  SearchTaskResultDTO,
  SearchGuestResultDTO,
  SearchVendorResultDTO,
  SearchExpenseResultDTO,
  SearchDocumentResultDTO,
} from "../dto/search.dto";

export class SearchService {
  /**
   * Performs a permission-gated, tenant-isolated unified search across 6 workspace modules.
   */
  static async searchWorkspace({
    weddingId,
    userId,
    query,
    limit = 5,
  }: {
    weddingId: string;
    userId: string;
    query: string;
    limit?: number;
  }): Promise<{ success: boolean; data?: SearchResponseDTO; error?: string; code?: string }> {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid ID format", code: "INVALID_ID" };
    }

    const trimmedQuery = (query || "").trim();
    if (trimmedQuery.length < 2) {
      return {
        success: false,
        error: "Search query must be at least 2 characters",
        code: "INVALID_QUERY",
      };
    }

    // Sanitize search query string to prevent regular expression injection / crashes
    const sanitizedQuery = trimmedQuery.slice(0, 100);
    const escapedRegex = new RegExp(
      sanitizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );

    const safeLimit = Math.min(Math.max(1, limit), 20);
    const wObjectId = new Types.ObjectId(weddingId);

    try {
      // 1. Check workspace membership
      const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
      if (!member || member.status !== "ACTIVE") {
        return { success: false, error: "Access denied or wedding not found", code: "FORBIDDEN" };
      }

      // 2. Evaluate functional permissions & ceremony scope
      const canReadGuests = TeamAuthorization.hasPermission(member, "guests");
      const canReadVendors = TeamAuthorization.hasPermission(member, "vendors");
      const canReadFinance = TeamAuthorization.hasPermission(member, "finance");

      const isCeremonyRestricted = member.role !== "ADMIN" && !member.eventScope?.allEvents;
      const allowedEventObjIds = (member.eventScope?.eventIds || []).map(
        (id) => new Types.ObjectId(id.toString())
      );

      // Build database queries with pre-limit authorization filtering
      const eventQuery: Record<string, unknown> = {
        weddingId: wObjectId,
        name: escapedRegex,
      };
      if (isCeremonyRestricted) {
        eventQuery._id = { $in: allowedEventObjIds };
      }

      const taskQuery: Record<string, unknown> = {
        weddingId: wObjectId,
        $or: [{ title: escapedRegex }, { description: escapedRegex }],
      };
      if (isCeremonyRestricted) {
        taskQuery.$and = [
          {
            $or: [
              { eventId: { $in: allowedEventObjIds } },
              { eventId: null },
              { eventId: { $exists: false } },
            ],
          },
        ];
      }

      const guestQuery: Record<string, unknown> = {
        weddingId: wObjectId,
        $or: [
          { householdName: escapedRegex },
          { "primaryContact.name": escapedRegex },
          { "members.name": escapedRegex },
        ],
      };

      const vendorQuery: Record<string, unknown> = {
        weddingId: wObjectId,
        $or: [
          { name: escapedRegex },
          { contactName: escapedRegex },
          { category: escapedRegex },
        ],
      };
      if (isCeremonyRestricted) {
        vendorQuery.$and = [
          {
            $or: [
              { eventIds: { $in: allowedEventObjIds } },
              { eventIds: { $size: 0 } },
              { eventIds: null },
              { eventIds: { $exists: false } },
            ],
          },
        ];
      }

      const expenseQuery: Record<string, unknown> = {
        weddingId: wObjectId,
        approvalStatus: { $ne: "REJECTED" },
        $or: [{ title: escapedRegex }, { category: escapedRegex }],
      };
      if (isCeremonyRestricted) {
        expenseQuery.$and = [
          {
            $or: [
              { eventId: { $in: allowedEventObjIds } },
              { eventId: null },
              { eventId: { $exists: false } },
            ],
          },
        ];
      }

      // 3. Execute parallel queries for permitted modules
      const candidateDocLimit = Math.min(safeLimit * 10, 100);

      const [
        eventDocs,
        taskDocs,
        guestDocs,
        vendorDocs,
        expenseDocs,
        candidateDocs,
      ] = await Promise.all([
        EventModel.find(eventQuery).sort({ startAt: 1 }).limit(safeLimit).exec(),
        TaskModel.find(taskQuery).sort({ createdAt: -1 }).limit(safeLimit).exec(),
        canReadGuests
          ? GuestHouseholdModel.find(guestQuery).sort({ householdName: 1 }).limit(safeLimit).exec()
          : Promise.resolve([]),
        canReadVendors
          ? VendorModel.find(vendorQuery).sort({ name: 1 }).limit(safeLimit).exec()
          : Promise.resolve([]),
        canReadFinance
          ? ExpenseModel.find(expenseQuery).sort({ createdAt: -1 }).limit(safeLimit).exec()
          : Promise.resolve([]),
        DocumentModel.find({ weddingId: wObjectId, title: escapedRegex }).sort({ createdAt: -1 }).limit(candidateDocLimit).exec(),
      ]);

      // 4. Batch parent access validation & orphan policy filtering for Documents
      const eventParentIds = new Set<string>();
      const taskParentIds = new Set<string>();
      const vendorParentIds = new Set<string>();
      const expenseParentIds = new Set<string>();

      for (const d of candidateDocs) {
        if (d.relatedTo?.type === "EVENT" && d.relatedTo.id) {
          eventParentIds.add(d.relatedTo.id.toString());
        } else if (d.relatedTo?.type === "TASK" && d.relatedTo.id) {
          taskParentIds.add(d.relatedTo.id.toString());
        } else if (d.relatedTo?.type === "VENDOR" && d.relatedTo.id) {
          vendorParentIds.add(d.relatedTo.id.toString());
        } else if (d.relatedTo?.type === "EXPENSE" && d.relatedTo.id) {
          expenseParentIds.add(d.relatedTo.id.toString());
        }
      }

      const [eventsList, tasksList, vendorsList, expensesList] = await Promise.all([
        eventParentIds.size > 0
          ? EventModel.find({
              _id: { $in: Array.from(eventParentIds).map((id) => new Types.ObjectId(id)) },
              weddingId: wObjectId,
            }).exec()
          : [],
        taskParentIds.size > 0
          ? TaskModel.find({
              _id: { $in: Array.from(taskParentIds).map((id) => new Types.ObjectId(id)) },
              weddingId: wObjectId,
            }).exec()
          : [],
        vendorParentIds.size > 0 && canReadVendors
          ? VendorModel.find({
              _id: { $in: Array.from(vendorParentIds).map((id) => new Types.ObjectId(id)) },
              weddingId: wObjectId,
            }).exec()
          : [],
        expenseParentIds.size > 0 && canReadFinance
          ? ExpenseModel.find({
              _id: { $in: Array.from(expenseParentIds).map((id) => new Types.ObjectId(id)) },
              weddingId: wObjectId,
              approvalStatus: { $ne: "REJECTED" },
            }).exec()
          : [],
      ]);

      const parentMaps = {
        events: new Map(eventsList.map((e) => [e._id.toString(), e])),
        tasks: new Map(tasksList.map((t) => [t._id.toString(), t])),
        vendors: new Map(vendorsList.map((v) => [v._id.toString(), v])),
        expenses: new Map(expensesList.map((ex) => [ex._id.toString(), ex])),
      };

      const documentDocs = candidateDocs
        .filter((d) => TeamAuthorization.canAccessDocument(member, d, parentMaps))
        .slice(0, safeLimit);

      // 5. Map entities to Search DTO results with sanitization
      const events: SearchEventResultDTO[] = eventDocs.map((e) => ({
        id: e._id.toString(),
        name: e.name,
        startAt: e.startAt ? e.startAt.toISOString() : "",
        eventType: e.type || "CUSTOM",
        targetUrl: `/workspace/${weddingId}/events/${e._id.toString()}`,
      }));

      const tasks: SearchTaskResultDTO[] = taskDocs.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        status: t.status,
        priority: t.priority,
        category: (t as unknown as { category?: string }).category,
        targetUrl: `/workspace/${weddingId}/tasks?taskId=${t._id.toString()}`,
      }));

      const guests: SearchGuestResultDTO[] = guestDocs.map((g) => ({
        id: g._id.toString(),
        name: g.householdName,
        side: g.side,
        memberCount: (g.members || []).length || g.totalInvited || 1,
        rsvpStatus: g.rsvp?.status || "PENDING",
        targetUrl: `/workspace/${weddingId}/guests?householdId=${g._id.toString()}`,
      }));

      const vendors: SearchVendorResultDTO[] = vendorDocs.map((v) => ({
        id: v._id.toString(),
        name: v.name,
        category: v.category,
        status: v.contractStatus || "INQUIRY",
        targetUrl: `/workspace/${weddingId}/vendors?vendorId=${v._id.toString()}`,
      }));

      const expenses: SearchExpenseResultDTO[] = expenseDocs.map((ex) => ({
        id: ex._id.toString(),
        title: ex.title,
        amountPaise: ex.totalAmountPaise || 0,
        status: ex.approvalStatus || "APPROVED",
        targetUrl: `/workspace/${weddingId}/expenses?expenseId=${ex._id.toString()}`,
      }));

      const documents: SearchDocumentResultDTO[] = documentDocs.map((d) => ({
        id: d._id.toString(),
        title: d.title,
        fileType: d.type || "OTHER",
        mimeType: d.mimeType,
        targetUrl: `/workspace/${weddingId}/documents?documentId=${d._id.toString()}`,
      }));

      const totalMatches =
        events.length +
        tasks.length +
        guests.length +
        vendors.length +
        expenses.length +
        documents.length;

      return {
        success: true,
        data: {
          query: sanitizedQuery,
          totalMatches,
          results: {
            events,
            tasks,
            guests,
            vendors,
            expenses,
            documents,
          },
        },
      };
    } catch (err: unknown) {
      console.error("Error executing workspace search:", err);
      return { success: false, error: "Internal server error", code: "INTERNAL_ERROR" };
    }
  }
}
