import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import { VendorService } from "../modules/vendors/services/vendor.service";
import { VendorRepository } from "../modules/vendors/repositories/vendor.repository";
import { EventRepository } from "../modules/events/repositories/event.repository";
import { ExpenseRepository } from "../modules/expenses/repositories/expense.repository";
import { createVendorSchema } from "../modules/vendors/validation/vendor.schemas";
import { connectToDatabase } from "../lib/db/connect";
import { rupeesToPaise, paiseToRupees, formatINR } from "../lib/utils/money";
import { TeamAuthorization } from "../modules/team/authorization/team.auth";
import { IVendor } from "../modules/vendors/models/vendor.model";
import { IEvent } from "../modules/events/models/event.model";
import { IExpense } from "../modules/expenses/models/expense.model";
import { IExpensePayment } from "../modules/expenses/models/expense-payment.model";
import { IWeddingMember } from "../modules/weddings/models/wedding-member.model";

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
    findEventsByWeddingId: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../modules/expenses/repositories/expense.repository", () => ({
  ExpenseRepository: {
    unlinkVendorFromExpenses: vi.fn().mockResolvedValue(0),
    findExpensesByFilters: vi.fn().mockResolvedValue({ expenses: [], hasMore: false, totalCount: 0 }),
  },
}));

vi.mock("../modules/expenses/repositories/expense-payment.repository", () => ({
  ExpensePaymentRepository: {
    findPaymentsByFilters: vi.fn().mockResolvedValue({ payments: [], hasMore: false, totalCount: 0 }),
  },
}));

vi.mock("../modules/documents/repositories/document.repository", () => ({
  DocumentRepository: {
    countDocumentsByRelatedId: vi.fn().mockResolvedValue(0),
  },
}));

vi.mock("../modules/team/authorization/team.auth", () => ({
  TeamAuthorization: {
    requireWeddingPermission: vi.fn(),
    requireWeddingMembership: vi.fn(),
  },
}));

describe("Money Utilities & Vendor Domain Tests", () => {
  const fakeAdminUserId = new Types.ObjectId().toString();
  const fakeWeddingId = new Types.ObjectId().toString();
  const fakeVendorId = new Types.ObjectId().toString();
  const fakeEventId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Shared Money Utilities (paise / INR)", () => {
    it("should convert decimal rupees to integer paise accurately without floating-point errors", () => {
      expect(rupeesToPaise(100)).toBe(10000);
      expect(rupeesToPaise("25000.50")).toBe(2500050);
      expect(rupeesToPaise(0)).toBe(0);
      expect(rupeesToPaise(12.345)).toBe(1234);
    });

    it("should convert integer paise to decimal rupees", () => {
      expect(paiseToRupees(2500050)).toBe(25000.5);
      expect(paiseToRupees(10000)).toBe(100);
      expect(paiseToRupees(0)).toBe(0);
    });

    it("should format paise as formatted INR string", () => {
      expect(formatINR(2500050)).toBe("₹25,000.50");
      expect(formatINR(1000000)).toBe("₹10,000");
      expect(formatINR(0)).toBe("₹0");
    });
  });

  describe("Vendor Validation Schemas", () => {
    it("should validate valid vendor creation payload", () => {
      const payload = {
        name: "Grand Palace Decorators",
        category: "DECORATOR",
        contactPerson: "Rajesh Kumar",
        email: "rajesh@grandpalace.com",
        phone: "+919876543210",
        agreedAmountRupees: 150000,
      };

      const result = createVendorSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject vendor with blank name or invalid email", () => {
      const payload = {
        name: "   ",
        category: "CATERER",
        email: "invalid-email-format",
      };

      const result = createVendorSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("Vendor Service CRUD & Permission Checks", () => {
    it("should deny vendor access if user lacks vendors permission", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(false);
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue({
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        userId: new Types.ObjectId(fakeAdminUserId),
        role: "ORGANISER",
        status: "ACTIVE",
        permissions: { vendors: false },
      } as unknown as IWeddingMember);

      const result = await VendorService.getVendors(fakeWeddingId, fakeAdminUserId, {});
      expect(result.success).toBe(false);
      expect(result.code).toBe("FORBIDDEN");
    });

    it("should create a vendor when user has vendors permission and same-wedding events", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(EventRepository, "findEventsByWeddingId").mockResolvedValue([
        { _id: new Types.ObjectId(fakeEventId), name: "Sangeet" } as unknown as IEvent,
      ]);

      const mockVendorDoc = {
        _id: new Types.ObjectId(fakeVendorId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        name: "Royal Caterers",
        category: "CATERER",
        contactPerson: "Suresh Sharma",
        phone: "+919876543210",
        email: "suresh@royal.com",
        agreedAmountPaise: 25000000,
        eventIds: [new Types.ObjectId(fakeEventId)],
        createdBy: new Types.ObjectId(fakeAdminUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(VendorRepository, "create").mockResolvedValue(mockVendorDoc as unknown as IVendor);

      const result = await VendorService.createVendor(fakeWeddingId, fakeAdminUserId, {
        name: "Royal Caterers",
        category: "CATERER",
        contactPerson: "Suresh Sharma",
        phone: "+919876543210",
        email: "suresh@royal.com",
        agreedAmountRupees: 250000,
        eventIds: [fakeEventId],
      });

      expect(connectToDatabase).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Royal Caterers");
      expect(result.data?.agreedAmountPaise).toBe(25000000);
    });

    it("should reject vendor creation if associated event belongs to another wedding", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(EventRepository, "findEventsByWeddingId").mockResolvedValue([]); // Event not found in this wedding!

      const result = await VendorService.createVendor(fakeWeddingId, fakeAdminUserId, {
        name: "Foreign Event Vendor",
        category: "ENTERTAINMENT",
        eventIds: [new Types.ObjectId().toString()],
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("INVALID_EVENT");
    });

    it("should unlink vendor from expenses when vendor is deleted", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(VendorRepository, "deleteByIdAndWeddingId").mockResolvedValue(true);

      const result = await VendorService.deleteVendor(fakeWeddingId, fakeVendorId, fakeAdminUserId);

      expect(result.success).toBe(true);
      expect(ExpenseRepository.unlinkVendorFromExpenses).toHaveBeenCalledWith({
        weddingId: fakeWeddingId,
        vendorId: fakeVendorId,
      });
    });

    it("MONEY-P1-02: should exclude payments for REJECTED expenses when calculating vendor totalPaidPaise", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);

      const mockVendor = {
        _id: new Types.ObjectId(fakeVendorId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        name: "Test Vendor",
        category: "CATERER",
        agreedAmountPaise: 1000000,
        eventIds: [],
        createdBy: new Types.ObjectId(fakeAdminUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const approvedExpense = {
        _id: new Types.ObjectId("60f000000000000000000100"),
        weddingId: new Types.ObjectId(fakeWeddingId),
        vendorId: mockVendor._id,
        title: "Approved Catering",
        totalAmountPaise: 500000,
        approvalStatus: "APPROVED",
      };

      const rejectedExpense = {
        _id: new Types.ObjectId("60f000000000000000000101"),
        weddingId: new Types.ObjectId(fakeWeddingId),
        vendorId: mockVendor._id,
        title: "Rejected Catering Extra",
        totalAmountPaise: 300000,
        approvalStatus: "REJECTED",
      };

      const approvedPayment = {
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        expenseId: approvedExpense._id,
        amountPaise: 500000,
        status: "PAID",
      };

      const rejectedExpensePayment = {
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        expenseId: rejectedExpense._id,
        amountPaise: 300000,
        status: "PAID",
      };

      vi.spyOn(VendorRepository, "findVendorsByFilters").mockResolvedValue({
        vendors: [mockVendor as unknown as IVendor],
        hasMore: false,
        totalCount: 1,
      });

      vi.spyOn(ExpenseRepository, "findExpensesByFilters").mockResolvedValue({
        expenses: [approvedExpense, rejectedExpense] as unknown as IExpense[],
        hasMore: false,
        totalCount: 2,
      });

      const { ExpensePaymentRepository } = await import("../modules/expenses/repositories/expense-payment.repository");
      vi.spyOn(ExpensePaymentRepository, "findPaymentsByFilters").mockResolvedValue({
        payments: [approvedPayment, rejectedExpensePayment] as unknown as IExpensePayment[],
        hasMore: false,
        totalCount: 2,
      });

      const result = await VendorService.getVendors(fakeWeddingId, fakeAdminUserId, {});

      expect(result.success).toBe(true);
      expect(result.data?.[0].financials?.totalExpensesPaise).toBe(500000); // Only approved expense
      expect(result.data?.[0].financials?.totalPaidPaise).toBe(500000); // Excludes 300000 payment from rejected expense
    });
  });
});
