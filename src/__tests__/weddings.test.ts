vi.mock("@/modules/tasks/services/task.service", () => ({ TaskService: { summary: vi.fn().mockResolvedValue({ total: 0, completed: 0, pending: 0, overdue: 0, percent: 0, overdueTasks: [] }) } }));
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { WeddingService } from "../modules/weddings/services/wedding.service";
import { Wedding } from "../modules/weddings/models/wedding.model";
import { WeddingMember } from "../modules/weddings/models/wedding-member.model";
import { connectToDatabase } from "../lib/db/connect";

vi.mock("../lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("../modules/weddings/models/wedding.model", () => ({
  Wedding: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock("../modules/weddings/models/wedding-member.model", () => ({
  WeddingMember: {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock("../modules/events/repositories/event.repository", () => ({
  EventRepository: {
    findEventsByWeddingId: vi.fn().mockResolvedValue([]),
    findNextUpcomingEvent: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("../modules/expenses/repositories/expense.repository", () => ({
  ExpenseRepository: {
    findExpensesByFilters: vi.fn().mockResolvedValue({ expenses: [], hasMore: false, totalCount: 0 }),
  },
}));

vi.mock("../modules/expenses/repositories/expense-payment.repository", () => ({
  ExpensePaymentRepository: {
    findPaymentsByFilters: vi.fn().mockResolvedValue({ payments: [], hasMore: false, totalCount: 0 }),
  },
}));

vi.mock("../modules/tasks/repositories/task.repository", () => ({
  TaskRepository: {
    countTaskMetrics: vi.fn().mockResolvedValue({
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      todoTasks: 0,
      overdueTasks: 0,
      upcomingTasks: 0,
    }),
    findTasksByFilters: vi.fn().mockResolvedValue({ tasks: [], hasMore: false, totalCount: 0 }),
  },
}));

vi.mock("../modules/guests/repositories/guest-household.repository", () => ({
  GuestHouseholdRepository: {
    aggregateGuestStats: vi.fn().mockResolvedValue({ totalInvited: 0, totalAttending: 0 }),
  },
}));

describe("WeddingService Unit Tests", () => {
  const fakeUserId = "507f1f77bcf86cd799439011";
  const fakeWeddingId = "507f1f77bcf86cd799439012";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(mongoose, "startSession").mockImplementation(async () => {
      return {
        withTransaction: async (cb: () => Promise<void>) => {
          await cb();
        },
        endSession: () => {},
      } as unknown as mongoose.ClientSession;
    });
  });

  it("should calculate UTC days remaining accurately", () => {
    const currentDate = new Date(Date.UTC(2026, 8, 23)); // 2026-09-23
    const targetDate = new Date(Date.UTC(2026, 8, 28)); // 2026-09-28
    const days = WeddingService.calculateDaysRemaining(targetDate, currentDate);
    expect(days).toBe(5);
  });

  it("should create a wedding workspace with ADMIN member and return DTO", async () => {
    const mockWeddingDoc = {
      _id: fakeWeddingId,
      title: "Rahul & Ananya",
      bride: { name: "Ananya" },
      groom: { name: "Rahul" },
      primaryWeddingDate: new Date("2027-12-01"),
      status: "PLANNING",
      preferredLanguage: "en",
      createdBy: fakeUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (Wedding.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([mockWeddingDoc]);
    (WeddingMember.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{}]);

    const result = await WeddingService.createWedding(fakeUserId, {
      title: "Rahul & Ananya",
      bride: { name: "Ananya" },
      groom: { name: "Rahul" },
      primaryWeddingDate: "2027-12-01",
    });

    expect(connectToDatabase).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.wedding?.id).toBe(fakeWeddingId);
    expect(result.wedding?.title).toBe("Rahul & Ananya");
  });

  it("should return invalid ID error for invalid userId on create", async () => {
    const result = await WeddingService.createWedding("invalid_id", {
      title: "Test",
      bride: { name: "B" },
      groom: { name: "G" },
      primaryWeddingDate: "2027-12-01",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INVALID_USER_ID");
  });

  it("should update wedding details if user is ADMIN", async () => {
    const mockMemberDoc = {
      _id: "member123",
      weddingId: fakeWeddingId,
      userId: fakeUserId,
      role: "ADMIN",
      status: "ACTIVE",
    };

    const mockUpdatedWeddingDoc = {
      _id: fakeWeddingId,
      title: "Updated Wedding Title",
      bride: { name: "Ananya" },
      groom: { name: "Rahul" },
      primaryWeddingDate: new Date("2027-12-01"),
      status: "PLANNING",
      preferredLanguage: "en",
      createdBy: fakeUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (WeddingMember.findOne as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockMemberDoc);
    (Wedding.findByIdAndUpdate as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockUpdatedWeddingDoc);

    const result = await WeddingService.updateWedding(fakeWeddingId, fakeUserId, {
      title: "Updated Wedding Title",
    });

    expect(result.success).toBe(true);
    expect(result.wedding?.title).toBe("Updated Wedding Title");
  });

  it("should deny update if user is not ADMIN", async () => {
    const mockMemberDoc = {
      _id: "member123",
      weddingId: fakeWeddingId,
      userId: fakeUserId,
      role: "ORGANISER",
      status: "ACTIVE",
    };

    (WeddingMember.findOne as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockMemberDoc);

    const result = await WeddingService.updateWedding(fakeWeddingId, fakeUserId, {
      title: "Hack Title",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("FORBIDDEN");
  });

  it("should return dashboard summary for valid member", async () => {
    const mockMember = {
      _id: "member123",
      weddingId: fakeWeddingId,
      userId: fakeUserId,
      role: "ADMIN",
      permissions: { guests: true, vendors: true, finance: true, gallery: true, website: true, guestbook: true, emergency: true },
      eventScope: { allEvents: true, eventIds: [] },
      status: "ACTIVE",
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockWedding = {
      _id: fakeWeddingId,
      title: "Rahul & Ananya",
      bride: { name: "Ananya" },
      groom: { name: "Rahul" },
      primaryWeddingDate: new Date("2027-12-01"),
      status: "PLANNING",
      preferredLanguage: "en",
      createdBy: fakeUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (WeddingMember.findOne as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockMember);
    (Wedding.findById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockWedding);
    (WeddingMember.countDocuments as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const result = await WeddingService.getDashboardSummary(fakeWeddingId, fakeUserId);

    expect(result.success).toBe(true);
    expect(result.data?.wedding.title).toBe("Rahul & Ananya");
    expect(result.data?.userRole).toBe("ADMIN");
    expect(result.data?.stats.totalTeamMembers).toBe(1);
  });
});
