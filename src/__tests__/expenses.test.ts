import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import { ExpenseService } from "../modules/expenses/services/expense.service";
import { ExpenseRepository } from "../modules/expenses/repositories/expense.repository";
import { ExpensePaymentRepository } from "../modules/expenses/repositories/expense-payment.repository";
import { TeamMemberRepository } from "../modules/team/repositories/team-member.repository";
import { TeamAuthorization } from "../modules/team/authorization/team.auth";
import {
  createExpenseSchema,
  approveExpenseSchema,
  createPaymentSchema,
} from "../modules/expenses/validation/expense.schemas";
import { connectToDatabase } from "../lib/db/connect";
import { IExpense } from "../modules/expenses/models/expense.model";
import { IExpensePayment } from "../modules/expenses/models/expense-payment.model";
import { User } from "../lib/db/models/User";

vi.mock("../lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("../lib/db/models/User", () => ({
  User: {
    findById: vi.fn(),
    find: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../modules/events/repositories/event.repository", () => ({
  EventRepository: {
    findByIdAndWeddingId: vi.fn(),
  },
}));

vi.mock("../modules/vendors/repositories/vendor.repository", () => ({
  VendorRepository: {
    findByIdAndWeddingId: vi.fn(),
    findVendorsByIdsAndWeddingId: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../modules/documents/repositories/document.repository", () => ({
  DocumentRepository: {
    countDocumentsByRelatedId: vi.fn().mockResolvedValue(0),
  },
}));

vi.mock("../modules/team/repositories/team-member.repository", () => ({
  TeamMemberRepository: {
    findByUserIdAndWeddingId: vi.fn(),
  },
}));

vi.mock("../modules/team/authorization/team.auth", () => ({
  TeamAuthorization: {
    requireWeddingPermission: vi.fn(),
    requireWeddingMembership: vi.fn(),
  },
}));

describe("Expense & Payment Domain Module Tests", () => {
  const fakeAdminUserId = new Types.ObjectId().toString();
  const fakeMemberUserId = new Types.ObjectId().toString();
  const fakeWeddingId = new Types.ObjectId().toString();
  const fakeExpenseId = new Types.ObjectId().toString();
  const fakePaymentId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validation Schemas", () => {
    it("should validate create expense payload", () => {
      const payload = {
        title: "Catering Advance",
        category: "CATERING",
        totalAmountRupees: 150000,
        notes: "Advance payment for 500 guests",
      };
      const result = createExpenseSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should validate approve expense payload", () => {
      const payload = {
        approvalStatus: "APPROVED",
        note: "Approved by lead organiser",
      };
      const result = approveExpenseSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject payment with non-positive amount", () => {
      const payload = {
        amountRupees: 0,
        status: "PAID",
        paidBy: { type: "OTHER", name: "Uncle Ji" },
      };
      const result = createPaymentSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("should reject MEMBER payer type without userId", () => {
      const payload = {
        amountRupees: 10000,
        paidBy: { type: "MEMBER" }, // missing userId
      };
      const result = createPaymentSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("Expense CRUD & Single-step Approval", () => {
    it("should create an expense when user has finance permission", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);

      const mockExpenseDoc = {
        _id: new Types.ObjectId(fakeExpenseId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: "Stage Decor",
        category: "DECORATION",
        totalAmountPaise: 5000000,
        approvalStatus: "PENDING",
        createdBy: new Types.ObjectId(fakeAdminUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(ExpenseRepository, "create").mockResolvedValue(mockExpenseDoc as unknown as IExpense);

      const result = await ExpenseService.createExpense(fakeWeddingId, fakeAdminUserId, {
        title: "Stage Decor",
        category: "DECORATION",
        totalAmountRupees: 50000,
      });

      expect(connectToDatabase).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Stage Decor");
      expect(result.data?.totalAmountPaise).toBe(5000000);
      expect(result.data?.approvalStatus).toBe("PENDING");
    });

    it("should approve an expense successfully (PENDING -> APPROVED)", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);

      const mockExpense = {
        _id: new Types.ObjectId(fakeExpenseId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: "Stage Decor",
        category: "DECORATION",
        totalAmountPaise: 5000000,
        approvalStatus: "PENDING",
        createdBy: new Types.ObjectId(fakeAdminUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedExpense = {
        ...mockExpense,
        approvalStatus: "APPROVED",
        approval: {
          decidedBy: new Types.ObjectId(fakeAdminUserId),
          decidedAt: new Date(),
          note: "Looks good",
        },
      };

      vi.spyOn(ExpenseRepository, "findByIdAndWeddingId").mockResolvedValue(mockExpense as unknown as IExpense);
      vi.spyOn(ExpenseRepository, "updateByIdAndWeddingId").mockResolvedValue(updatedExpense as unknown as IExpense);
      (User.findById as ReturnType<typeof vi.fn>).mockResolvedValue({ name: "Admin User" });

      const result = await ExpenseService.approveExpense(fakeWeddingId, fakeExpenseId, fakeAdminUserId, {
        approvalStatus: "APPROVED",
        note: "Looks good",
      });

      expect(result.success).toBe(true);
      expect(result.data?.approvalStatus).toBe("APPROVED");
    });

    it("should cascade delete payments when an expense is deleted", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(ExpenseRepository, "deleteByIdAndWeddingId").mockResolvedValue(true);
      vi.spyOn(ExpensePaymentRepository, "deletePaymentsByExpenseId").mockResolvedValue(1);

      const result = await ExpenseService.deleteExpense(fakeWeddingId, fakeExpenseId, fakeAdminUserId);

      expect(result.success).toBe(true);
      expect(ExpensePaymentRepository.deletePaymentsByExpenseId).toHaveBeenCalledWith({
        weddingId: fakeWeddingId,
        expenseId: fakeExpenseId,
      });
    });
  });

  describe("Payments, Payer Attribution & Derived Overdue Calculation", () => {
    it("should create a payment with MEMBER payer attribution", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(ExpenseRepository, "findByIdAndWeddingId").mockResolvedValue({
        _id: new Types.ObjectId(fakeExpenseId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: "Catering Bill",
      } as unknown as IExpense);

      vi.spyOn(TeamMemberRepository, "findByUserIdAndWeddingId").mockResolvedValue({
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        userId: new Types.ObjectId(fakeMemberUserId),
        status: "ACTIVE",
      } as unknown as ReturnType<typeof TeamMemberRepository.findByUserIdAndWeddingId> extends Promise<infer T> ? T : never);

      (User.findById as ReturnType<typeof vi.fn>).mockImplementation(async (id) => {
        if (id.toString() === fakeMemberUserId) return { name: "Priya Sharma" };
        return { name: "Admin User" };
      });

      const mockPaymentDoc = {
        _id: new Types.ObjectId(fakePaymentId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        expenseId: new Types.ObjectId(fakeExpenseId),
        amountPaise: 2500000,
        status: "PAID",
        paidAt: new Date(),
        paidBy: {
          type: "MEMBER",
          userId: new Types.ObjectId(fakeMemberUserId),
          name: "Priya Sharma",
        },
        createdBy: new Types.ObjectId(fakeAdminUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(ExpensePaymentRepository, "create").mockResolvedValue(mockPaymentDoc as unknown as IExpensePayment);

      const result = await ExpenseService.createPayment(fakeWeddingId, fakeExpenseId, fakeAdminUserId, {
        amountRupees: 25000,
        status: "PAID",
        paidBy: {
          type: "MEMBER",
          userId: fakeMemberUserId,
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.amountPaise).toBe(2500000);
      expect(result.data?.paidBy.type).toBe("MEMBER");
      expect(result.data?.payerName).toBe("Priya Sharma");
    });

    it("should derive OVERDUE payment status when PENDING payment has dueAt in past", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);

      const pastDate = new Date(Date.now() - 86400000 * 3); // 3 days ago

      const mockPaymentDoc = {
        _id: new Types.ObjectId(fakePaymentId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        expenseId: new Types.ObjectId(fakeExpenseId),
        amountPaise: 1000000,
        status: "PENDING",
        dueAt: pastDate,
        paidBy: { type: "OTHER", name: "Father" },
        createdBy: new Types.ObjectId(fakeAdminUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(ExpensePaymentRepository, "findPaymentsByFilters").mockResolvedValue({
        payments: [mockPaymentDoc as unknown as IExpensePayment],
        nextCursor: undefined,
        hasMore: false,
        totalCount: 1,
      });

      vi.spyOn(ExpenseRepository, "findExpensesByIdsAndWeddingId").mockResolvedValue([
        { _id: new Types.ObjectId(fakeExpenseId), title: "Venue Advance" } as unknown as IExpense,
      ]);

      const result = await ExpenseService.getPayments(fakeWeddingId, fakeAdminUserId, {});

      expect(result.success).toBe(true);
      expect(result.data?.[0].effectiveStatus).toBe("OVERDUE");
    });
  });

  describe("Workspace Finance Summaries", () => {
    it("should calculate correct budget, paid, outstanding, and payer breakdown", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);

      const expense1 = {
        _id: new Types.ObjectId("60f000000000000000000001"),
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: "Food",
        category: "CATERING",
        totalAmountPaise: 1000000, // 10,000 INR
        approvalStatus: "APPROVED",
      };

      const expense2 = {
        _id: new Types.ObjectId("60f000000000000000000002"),
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: "Flowers",
        category: "DECORATION",
        totalAmountPaise: 500000, // 5,000 INR
        approvalStatus: "PENDING",
      };

      const rejectedExpense = {
        _id: new Types.ObjectId("60f000000000000000000003"),
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: "Rejected Item",
        category: "OTHER",
        totalAmountPaise: 2000000,
        approvalStatus: "REJECTED",
      };

      const payment1 = {
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        expenseId: expense1._id,
        amountPaise: 600000, // 6,000 INR paid
        status: "PAID",
        paidBy: { type: "MEMBER", userId: new Types.ObjectId(fakeAdminUserId), name: "Admin" },
      };

      const payment2 = {
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        expenseId: expense2._id,
        amountPaise: 200000, // 2,000 INR overdue pending
        status: "PENDING",
        dueAt: new Date(Date.now() - 86400000), // yesterday
        paidBy: { type: "OTHER", name: "Uncle Ji" },
      };

      vi.spyOn(ExpenseRepository, "findExpensesByFilters").mockResolvedValue({
        expenses: [expense1, expense2, rejectedExpense] as unknown as IExpense[],
        hasMore: false,
        totalCount: 3,
      });

      vi.spyOn(ExpensePaymentRepository, "findPaymentsByFilters").mockResolvedValue({
        payments: [payment1, payment2] as unknown as IExpensePayment[],
        hasMore: false,
        totalCount: 2,
      });

      const result = await ExpenseService.getFinanceSummary(fakeWeddingId, fakeAdminUserId);

      expect(result.success).toBe(true);
      expect(result.data?.totalBudgetPaise).toBe(1500000); // 10,000 + 5,000 (rejected excluded)
      expect(result.data?.totalPaidPaise).toBe(600000); // 6,000 paid
      expect(result.data?.totalOutstandingPaise).toBe(900000); // 15,000 - 6,000 = 9,000
      expect(result.data?.overduePaymentsCount).toBe(1);
      expect(result.data?.pendingApprovalCount).toBe(1);
      expect(result.data?.payerBreakdown).toHaveLength(1); // 1 paid record
    });

    it("MONEY-P1-01: should calculate totalOutstandingPaise by summing per-expense outstanding without masking unpaid balances due to overpayment", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);

      // Expense 1: Budget 5,000 INR (500,000 paise), Paid 20,000 INR (2,000,000 paise) -> Overpaid by 15,000 INR
      const overpaidExpense = {
        _id: new Types.ObjectId("60f000000000000000000010"),
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: "Overpaid Item",
        category: "CATERING",
        totalAmountPaise: 500000,
        approvalStatus: "APPROVED",
      };

      // Expense 2: Budget 10,000 INR (1,000,000 paise), Paid 0 INR -> Outstanding 10,000 INR (1,000,000 paise)
      const unpaidExpense = {
        _id: new Types.ObjectId("60f000000000000000000011"),
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: "Unpaid Item",
        category: "VENUE",
        totalAmountPaise: 1000000,
        approvalStatus: "APPROVED",
      };

      const overpaidPayment = {
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        expenseId: overpaidExpense._id,
        amountPaise: 2000000,
        status: "PAID",
        paidBy: { type: "OTHER", name: "Sponsor" },
      };

      vi.spyOn(ExpenseRepository, "findExpensesByFilters").mockResolvedValue({
        expenses: [overpaidExpense, unpaidExpense] as unknown as IExpense[],
        hasMore: false,
        totalCount: 2,
      });

      vi.spyOn(ExpensePaymentRepository, "findPaymentsByFilters").mockResolvedValue({
        payments: [overpaidPayment] as unknown as IExpensePayment[],
        hasMore: false,
        totalCount: 1,
      });

      const result = await ExpenseService.getFinanceSummary(fakeWeddingId, fakeAdminUserId);

      expect(result.success).toBe(true);
      expect(result.data?.totalBudgetPaise).toBe(1500000); // 15,000 INR total budget
      expect(result.data?.totalPaidPaise).toBe(2000000); // 20,000 INR total paid
      // Must NOT be 0; unpaidExpense has 1,000,000 paise outstanding liability!
      expect(result.data?.totalOutstandingPaise).toBe(1000000);
    });

    it("MONEY-P1-03: should reject createPayment on REJECTED expense", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(ExpenseRepository, "findByIdAndWeddingId").mockResolvedValue({
        _id: new Types.ObjectId(fakeExpenseId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: "Rejected Decor",
        approvalStatus: "REJECTED",
      } as unknown as IExpense);

      const result = await ExpenseService.createPayment(fakeWeddingId, fakeExpenseId, fakeAdminUserId, {
        amountRupees: 5000,
        status: "PAID",
        paidBy: { type: "OTHER", name: "Uncle" },
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("REJECTED_EXPENSE");
      expect(result.error).toContain("rejected expense");
    });

    it("MONEY-P1-04: updatePayment should enforce payer validation for MEMBER and OTHER types", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(ExpensePaymentRepository, "findByIdAndWeddingId").mockResolvedValue({
        _id: new Types.ObjectId(fakePaymentId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        expenseId: new Types.ObjectId(fakeExpenseId),
        status: "PAID",
      } as unknown as IExpensePayment);

      // Test MEMBER without userId
      const memberResult = await ExpenseService.updatePayment(fakeWeddingId, fakeExpenseId, fakePaymentId, fakeAdminUserId, {
        paidBy: { type: "MEMBER" },
      });
      expect(memberResult.success).toBe(false);
      expect(memberResult.code).toBe("INVALID_PAYER");

      // Test OTHER without name
      const otherResult = await ExpenseService.updatePayment(fakeWeddingId, fakeExpenseId, fakePaymentId, fakeAdminUserId, {
        paidBy: { type: "OTHER", name: "  " },
      });
      expect(otherResult.success).toBe(false);
      expect(otherResult.code).toBe("INVALID_PAYER");
    });

    it("MONEY-P1-05: deletePayment should reject deletion when payment belongs to a different expenseId", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      const differentExpenseId = new Types.ObjectId().toString();

      vi.spyOn(ExpensePaymentRepository, "findByIdAndWeddingId").mockResolvedValue({
        _id: new Types.ObjectId(fakePaymentId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        expenseId: new Types.ObjectId(differentExpenseId),
      } as unknown as IExpensePayment);

      const result = await ExpenseService.deletePayment(fakeWeddingId, fakeExpenseId, fakePaymentId, fakeAdminUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe("NOT_FOUND");
    });
  });
});
