import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchService } from "@/modules/search/services/search.service";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { EventModel } from "@/modules/events/models/event.model";
import { TaskModel } from "@/modules/tasks/models/task.model";
import { GuestHouseholdModel } from "@/modules/guests/models/guest-household.model";
import { VendorModel } from "@/modules/vendors/models/vendor.model";
import { ExpenseModel } from "@/modules/expenses/models/expense.model";
import { DocumentModel } from "@/modules/documents/models/document.model";

// Mocks
vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/modules/team/authorization/team.auth", () => ({
  TeamAuthorization: {
    requireWeddingMembership: vi.fn(),
    requireWeddingPermission: vi.fn(),
    hasPermission: vi.fn().mockReturnValue(true),
    canAccessDocument: vi.fn().mockReturnValue(true),
    canAccessEventId: vi.fn().mockReturnValue(true),
    canAccessTask: vi.fn().mockReturnValue(true),
    canAccessVendor: vi.fn().mockReturnValue(true),
    canAccessExpense: vi.fn().mockReturnValue(true),
  },
}));

vi.mock("@/modules/events/models/event.model", () => ({
  EventModel: {
    find: vi.fn(),
  },
}));

vi.mock("@/modules/tasks/models/task.model", () => ({
  TaskModel: {
    find: vi.fn(),
  },
}));

vi.mock("@/modules/guests/models/guest-household.model", () => ({
  GuestHouseholdModel: {
    find: vi.fn(),
  },
}));

vi.mock("@/modules/vendors/models/vendor.model", () => ({
  VendorModel: {
    find: vi.fn(),
  },
}));

vi.mock("@/modules/expenses/models/expense.model", () => ({
  ExpenseModel: {
    find: vi.fn(),
  },
}));

vi.mock("@/modules/documents/models/document.model", () => ({
  DocumentModel: {
    find: vi.fn(),
  },
}));

describe("V1 Workspace Search Integration & Unit Tests", () => {
  const mockWeddingId = "507f1f77bcf86cd799439011";
  const mockUserId = "507f1f77bcf86cd799439022";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SEARCH-P1-01: Unified Workspace Search & Permission Isolation", () => {
    it("should search across all 6 modules when user has full permissions", async () => {
      // Mock Membership
      vi.mocked(TeamAuthorization.requireWeddingMembership).mockResolvedValue({
        userId: mockUserId,
        weddingId: mockWeddingId,
        role: "ADMIN",
        status: "ACTIVE",
      } as never);

      // Allow all permissions
      vi.mocked(TeamAuthorization.requireWeddingPermission).mockResolvedValue(true as never);

      // Mock Event query chain
      vi.mocked(EventModel.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([
              {
                _id: "evt_1",
                name: "Sangeet Ceremony",
                type: "CEREMONY",
                startAt: new Date("2026-11-20T18:00:00Z"),
              },
            ]),
          }),
        }),
      } as never);

      // Mock Task query chain
      vi.mocked(TaskModel.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([
              {
                _id: "tsk_1",
                title: "Book Sangeet DJ",
                status: "IN_PROGRESS",
                priority: "HIGH",
              },
            ]),
          }),
        }),
      } as never);

      // Mock Guest query chain
      vi.mocked(GuestHouseholdModel.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([
              {
                _id: "gst_1",
                householdName: "Sharma Family",
                side: "BRIDE",
                members: [{ name: "Raj Sharma" }, { name: "Sunita Sharma" }],
                totalInvited: 2,
                rsvp: { status: "ACCEPTED" },
              },
            ]),
          }),
        }),
      } as never);

      // Mock Vendor query chain
      vi.mocked(VendorModel.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([
              {
                _id: "vnd_1",
                name: "Sharma Caterers",
                category: "Catering",
                contractStatus: "BOOKED",
              },
            ]),
          }),
        }),
      } as never);

      // Mock Expense query chain
      vi.mocked(ExpenseModel.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([
              {
                _id: "exp_1",
                title: "Sharma Catering Advance",
                totalAmountPaise: 5000000,
                approvalStatus: "APPROVED",
              },
            ]),
          }),
        }),
      } as never);

      // Mock Document query chain
      vi.mocked(DocumentModel.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([
              {
                _id: "doc_1",
                title: "Sharma Catering Contract",
                type: "PDF",
                mimeType: "application/pdf",
              },
            ]),
          }),
        }),
      } as never);

      const response = await SearchService.searchWorkspace({
        weddingId: mockWeddingId,
        userId: mockUserId,
        query: "Sharma",
        limit: 5,
      });

      expect(response.success).toBe(true);
      expect(response.data?.query).toBe("Sharma");
      expect(response.data?.totalMatches).toBe(6);

      expect(response.data?.results.events).toHaveLength(1);
      expect(response.data?.results.events[0].targetUrl).toBe(`/workspace/${mockWeddingId}/events/evt_1`);

      expect(response.data?.results.tasks).toHaveLength(1);
      expect(response.data?.results.tasks[0].targetUrl).toBe(`/workspace/${mockWeddingId}/tasks?taskId=tsk_1`);

      expect(response.data?.results.guests).toHaveLength(1);
      expect(response.data?.results.guests[0].targetUrl).toBe(`/workspace/${mockWeddingId}/guests?householdId=gst_1`);

      expect(response.data?.results.vendors).toHaveLength(1);
      expect(response.data?.results.vendors[0].targetUrl).toBe(`/workspace/${mockWeddingId}/vendors?vendorId=vnd_1`);

      expect(response.data?.results.expenses).toHaveLength(1);
      expect(response.data?.results.expenses[0].targetUrl).toBe(`/workspace/${mockWeddingId}/expenses?expenseId=exp_1`);

      expect(response.data?.results.documents).toHaveLength(1);
      expect(response.data?.results.documents[0].targetUrl).toBe(`/workspace/${mockWeddingId}/documents?documentId=doc_1`);
    });

    it("should omit restricted modules when user lacks specific permissions", async () => {
      // Mock Membership
      vi.mocked(TeamAuthorization.requireWeddingMembership).mockResolvedValue({
        userId: mockUserId,
        weddingId: mockWeddingId,
        role: "MEMBER",
        status: "ACTIVE",
        eventScope: { allEvents: true, eventIds: [] },
      } as never);

      // Deny GUESTS and FINANCE permissions, allow VENDORS
      vi.mocked(TeamAuthorization.requireWeddingPermission).mockImplementation(
        async (_wId: string, _uId: string, permission: string) => {
          if (permission === "guests") return false as never;
          if (permission === "finance") return false as never;
          return true as never;
        }
      );
      vi.mocked(TeamAuthorization.hasPermission).mockImplementation(
        (_member: unknown, permission: string) => {
          if (permission === "guests") return false;
          if (permission === "finance") return false;
          return true;
        }
      );

      vi.mocked(EventModel.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as never);

      vi.mocked(TaskModel.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as never);

      vi.mocked(VendorModel.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([
              {
                _id: "vnd_1",
                name: "Royal Decorators",
                category: "Decor",
                contractStatus: "IN_TALKS",
              },
            ]),
          }),
        }),
      } as never);

      vi.mocked(DocumentModel.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as never);

      const response = await SearchService.searchWorkspace({
        weddingId: mockWeddingId,
        userId: mockUserId,
        query: "Royal",
        limit: 5,
      });

      expect(response.success).toBe(true);
      expect(response.data?.totalMatches).toBe(1);
      expect(response.data?.results.vendors).toHaveLength(1);
      expect(response.data?.results.guests).toHaveLength(0);
      expect(response.data?.results.expenses).toHaveLength(0);

      // Verify that Guest & Expense models were never queried due to missing permissions
      expect(GuestHouseholdModel.find).not.toHaveBeenCalled();
      expect(ExpenseModel.find).not.toHaveBeenCalled();
    });

    it("should return error for queries under 2 characters", async () => {
      const response = await SearchService.searchWorkspace({
        weddingId: mockWeddingId,
        userId: mockUserId,
        query: "a",
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe("INVALID_QUERY");
      expect(response.error).toBe("Search query must be at least 2 characters");
    });
  });

  describe("SEARCH-P1-02: Regex Escaping & Special Character Input Handling", () => {
    it("should escape special regex characters without throwing SyntaxError", () => {
      const specialQueries = ["+91", "(VIP)", "Sharma & Sons*", "[Draft]", "Haldi?", "^Test$"];

      specialQueries.forEach((q) => {
        const escapedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        expect(() => new RegExp(escapedQuery, "i")).not.toThrow();

        const regex = new RegExp(escapedQuery, "i");
        // Ensure literal matching works
        expect(regex.test(`Phone: ${q}`)).toBe(true);
      });
    });
  });
});
