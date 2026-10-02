import { describe, it, expect, beforeEach, vi } from "vitest";
import { Types } from "mongoose";
import { SearchService } from "@/modules/search/services/search.service";
import { EventService } from "@/modules/events/services/event.service";
import { TaskService } from "@/modules/tasks/services/task.service";
import { ExpenseService } from "@/modules/expenses/services/expense.service";
import { VendorService } from "@/modules/vendors/services/vendor.service";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { EventModel } from "@/modules/events/models/event.model";
import { TaskModel } from "@/modules/tasks/models/task.model";
import { GuestHouseholdModel } from "@/modules/guests/models/guest-household.model";
import { VendorModel } from "@/modules/vendors/models/vendor.model";
import { ExpenseModel } from "@/modules/expenses/models/expense.model";
import { DocumentModel } from "@/modules/documents/models/document.model";
import { EventRepository } from "@/modules/events/repositories/event.repository";
import { TaskRepository } from "@/modules/tasks/repositories/task.repository";
import { ExpenseRepository } from "@/modules/expenses/repositories/expense.repository";
import { VendorRepository } from "@/modules/vendors/repositories/vendor.repository";
import { ExpensePaymentRepository } from "@/modules/expenses/repositories/expense-payment.repository";
import { IWeddingMember } from "@/modules/weddings/models/wedding-member.model";

// Mock server-only package for Vitest runner
vi.mock("server-only", () => ({}));

// Mock MongoDB connection to run synchronously in test suite
vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

describe("V1 Search Access Restrictions Specification Suite", () => {
  const weddingIdA = new Types.ObjectId().toString();
  const weddingIdB = new Types.ObjectId().toString();

  const adminUserId = new Types.ObjectId().toString();
  const restrictedUserId = new Types.ObjectId().toString();

  const eventAId = new Types.ObjectId().toString();
  const eventBId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Tenant Isolation & Multi-Wedding Boundaries", () => {
    it("should prevent Admin of Wedding A from seeing search matches in Wedding B", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockImplementation(
        async (wId, uId) => {
          if (wId === weddingIdA && uId === adminUserId) {
            return {
              weddingId: new Types.ObjectId(weddingIdA),
              userId: new Types.ObjectId(adminUserId),
              role: "ADMIN",
              status: "ACTIVE",
              permissions: { guests: true, vendors: true, finance: true },
              eventScope: { allEvents: true, eventIds: [] },
            } as unknown as IWeddingMember;
          }
          return null; // Not a member of Wedding B!
        }
      );

      const res = await SearchService.searchWorkspace({
        weddingId: weddingIdB,
        userId: adminUserId,
        query: "Sangeet",
      });

      expect(res.success).toBe(false);
      expect(res.code).toBe("FORBIDDEN");
    });
  });

  describe("SAR-001: Document Search Candidate Expansion & No Truncation", () => {
    it("should return accessible document matches even when 5 restricted candidate documents appear first", async () => {
      const member = {
        weddingId: new Types.ObjectId(weddingIdA),
        userId: new Types.ObjectId(restrictedUserId),
        role: "ORGANISER",
        status: "ACTIVE",
        permissions: { guests: true, vendors: true, finance: true },
        eventScope: { allEvents: false, eventIds: [new Types.ObjectId(eventAId)] },
      };

      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(member as unknown as IWeddingMember);

      // Create 5 candidate docs linked to restricted Event B, and 1 candidate doc linked to allowed Event A
      const restrictedDocs = Array.from({ length: 5 }).map(() => ({
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(weddingIdA),
        title: "Contract Document",
        type: "CONTRACT",
        relatedTo: { type: "EVENT", id: new Types.ObjectId(eventBId) },
      }));

      const accessibleDoc = {
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(weddingIdA),
        title: "Contract Document",
        type: "CONTRACT",
        relatedTo: { type: "EVENT", id: new Types.ObjectId(eventAId) },
      };

      const candidateDocs = [...restrictedDocs, accessibleDoc];

      vi.spyOn(EventModel, "find").mockImplementation((query?: unknown) => {
        const q = query as { _id?: { $in?: unknown } } | undefined;
        const isParentLookup = q?._id?.$in && Array.isArray(q._id.$in);
        const docs = isParentLookup ? [{ _id: new Types.ObjectId(eventAId), name: "Event A" }] : [];
        return {
          sort: () => ({ limit: () => ({ exec: async () => docs }) }),
          exec: async () => docs,
        } as unknown as ReturnType<typeof EventModel.find>;
      });

      vi.spyOn(TaskModel, "find").mockReturnValue({ sort: () => ({ limit: () => ({ exec: async () => [] }) }) } as unknown as ReturnType<typeof TaskModel.find>);
      vi.spyOn(GuestHouseholdModel, "find").mockReturnValue({ sort: () => ({ limit: () => ({ exec: async () => [] }) }) } as unknown as ReturnType<typeof GuestHouseholdModel.find>);
      vi.spyOn(VendorModel, "find").mockReturnValue({ sort: () => ({ limit: () => ({ exec: async () => [] }) }) } as unknown as ReturnType<typeof VendorModel.find>);
      vi.spyOn(ExpenseModel, "find").mockReturnValue({ sort: () => ({ limit: () => ({ exec: async () => [] }) }) } as unknown as ReturnType<typeof ExpenseModel.find>);
      vi.spyOn(DocumentModel, "find").mockReturnValue({ sort: () => ({ limit: () => ({ exec: async () => candidateDocs }) }) } as unknown as ReturnType<typeof DocumentModel.find>);

      const res = await SearchService.searchWorkspace({
        weddingId: weddingIdA,
        userId: restrictedUserId,
        query: "Contract",
        limit: 5,
      });

      expect(res.success).toBe(true);
      expect(res.data?.results.documents).toHaveLength(1);
      expect(res.data?.results.documents[0].id).toBe(accessibleDoc._id.toString());
    });
  });

  describe("SAR-002: Direct Module API Ceremony Scope Enforcement", () => {
    it("should filter restricted ceremonies from EventService.getEventsByWeddingId", async () => {
      const member = {
        weddingId: new Types.ObjectId(weddingIdA),
        userId: new Types.ObjectId(restrictedUserId),
        role: "ORGANISER",
        status: "ACTIVE",
        permissions: { guests: true, vendors: true, finance: true },
        eventScope: { allEvents: false, eventIds: [new Types.ObjectId(eventAId)] },
      };

      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(member as unknown as IWeddingMember);

      const allEvents = [
        { _id: new Types.ObjectId(eventAId), name: "Haldi Ceremony", startAt: new Date() },
        { _id: new Types.ObjectId(eventBId), name: "Reception Ceremony", startAt: new Date() },
      ];

      vi.spyOn(EventRepository, "findEventsByWeddingId").mockResolvedValue(allEvents as never);

      const res = await EventService.getEventsByWeddingId(weddingIdA, restrictedUserId);
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data?.[0].id).toBe(eventAId);
    });

    it("should deny access to TaskService.getTaskById for a task assigned to a restricted ceremony", async () => {
      const member = {
        weddingId: new Types.ObjectId(weddingIdA),
        userId: new Types.ObjectId(restrictedUserId),
        role: "ORGANISER",
        status: "ACTIVE",
        permissions: { guests: true, vendors: true, finance: true },
        eventScope: { allEvents: false, eventIds: [new Types.ObjectId(eventAId)] },
      };

      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(member as unknown as IWeddingMember);

      const restrictedTask = {
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(weddingIdA),
        title: "Book Reception DJ",
        eventId: new Types.ObjectId(eventBId),
      };

      vi.spyOn(TaskRepository, "findByIdAndWeddingId").mockResolvedValue(restrictedTask as never);

      const res = await TaskService.getTaskById(weddingIdA, restrictedTask._id.toString(), restrictedUserId);
      expect(res.success).toBe(false);
      expect(res.code).toBe("FORBIDDEN");
    });

    it("should deny access to ExpenseService.getExpenseById for an expense assigned to a restricted ceremony", async () => {
      const member = {
        weddingId: new Types.ObjectId(weddingIdA),
        userId: new Types.ObjectId(restrictedUserId),
        role: "ORGANISER",
        status: "ACTIVE",
        permissions: { guests: true, vendors: true, finance: true },
        eventScope: { allEvents: false, eventIds: [new Types.ObjectId(eventAId)] },
      };

      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(member as unknown as IWeddingMember);
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);

      const restrictedExpense = {
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(weddingIdA),
        title: "Reception Venue Deposit",
        eventId: new Types.ObjectId(eventBId),
        approvalStatus: "APPROVED",
      };

      vi.spyOn(ExpenseRepository, "findByIdAndWeddingId").mockResolvedValue(restrictedExpense as never);

      const res = await ExpenseService.getExpenseById(weddingIdA, restrictedExpense._id.toString(), restrictedUserId);
      expect(res.success).toBe(false);
      expect(res.code).toBe("FORBIDDEN");
    });
  });

  describe("SAR-003: Vendor Financial Aggregates Ceremony Isolation", () => {
    it("should omit expense figures from restricted ceremonies when computing vendor financials", async () => {
      const member = {
        weddingId: new Types.ObjectId(weddingIdA),
        userId: new Types.ObjectId(restrictedUserId),
        role: "ORGANISER",
        status: "ACTIVE",
        permissions: { guests: true, vendors: true, finance: true },
        eventScope: { allEvents: false, eventIds: [new Types.ObjectId(eventAId)] },
      };

      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(member as unknown as IWeddingMember);
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);

      const sharedVendor = {
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(weddingIdA),
        name: "Apex Sound & Lighting",
        category: "SOUND",
        eventIds: [new Types.ObjectId(eventAId), new Types.ObjectId(eventBId)],
        agreedAmountPaise: 10000000,
      };

      vi.spyOn(VendorRepository, "findByIdAndWeddingId").mockResolvedValue(sharedVendor as never);
      vi.spyOn(EventRepository, "findEventsByWeddingId").mockResolvedValue([
        { _id: new Types.ObjectId(eventAId), name: "Haldi" },
      ] as never);

      // 1 expense for allowed Event A (₹20,000) and 1 expense for restricted Event B (₹50,000)
      const expenses = [
        {
          _id: new Types.ObjectId(),
          weddingId: new Types.ObjectId(weddingIdA),
          vendorId: sharedVendor._id,
          eventId: new Types.ObjectId(eventAId),
          totalAmountPaise: 2000000,
          approvalStatus: "APPROVED",
        },
        {
          _id: new Types.ObjectId(),
          weddingId: new Types.ObjectId(weddingIdA),
          vendorId: sharedVendor._id,
          eventId: new Types.ObjectId(eventBId),
          totalAmountPaise: 5000000,
          approvalStatus: "APPROVED",
        },
      ];

      vi.spyOn(ExpenseRepository, "findExpensesByFilters").mockResolvedValue({
        expenses: expenses as never,
        hasMore: false,
        totalCount: 2,
      });

      vi.spyOn(ExpensePaymentRepository, "findPaymentsByFilters").mockResolvedValue({
        payments: [],
        hasMore: false,
        totalCount: 0,
      });

      const res = await VendorService.getVendorById(weddingIdA, sharedVendor._id.toString(), restrictedUserId);
      expect(res.success).toBe(true);
      // Financials should ONLY reflect the ₹20,000 expense from Event A, ignoring the ₹50,000 expense from Event B!
      expect(res.data?.financials?.totalExpensesPaise).toBe(2000000);
    });
  });
});
