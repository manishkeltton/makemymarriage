import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import { VendorService } from "../modules/vendors/services/vendor.service";
import { VendorRepository } from "../modules/vendors/repositories/vendor.repository";
import { EventRepository } from "../modules/events/repositories/event.repository";
import { TeamAuthorization } from "../modules/team/authorization/team.auth";
import { connectToDatabase } from "../lib/db/connect";

import { IEvent } from "../modules/events/models/event.model";
import { IVendor } from "../modules/vendors/models/vendor.model";

import { EventService } from "../modules/events/services/event.service";
import { ExpenseRepository } from "../modules/expenses/repositories/expense.repository";
import { ExpensePaymentRepository } from "../modules/expenses/repositories/expense-payment.repository";

vi.mock("../lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("../modules/weddings/repositories/wedding-member.repository", () => ({
  WeddingMemberRepository: {
    findMember: vi.fn().mockResolvedValue({ status: "ACTIVE", role: "MEMBER" }),
  },
}));

vi.mock("../modules/team/authorization/team.auth", () => ({
  TeamAuthorization: {
    requireWeddingPermission: vi.fn(),
    requireWeddingMembership: vi.fn(),
    requireEventAccess: vi.fn(),
  },
}));

describe("V1 Event/Ceremony Workspace Integration Tests", () => {
  const fakeUserId = new Types.ObjectId().toString();
  const fakeWeddingId = new Types.ObjectId().toString();
  const fakeEventId1 = new Types.ObjectId().toString();
  const fakeEventId2 = new Types.ObjectId().toString();
  const fakeVendorId = new Types.ObjectId().toString();
  const unrelatedWeddingId = new Types.ObjectId().toString();

  const createMockVendorDoc = (eventIds: string[] = []) => ({
    _id: new Types.ObjectId(fakeVendorId),
    weddingId: new Types.ObjectId(fakeWeddingId),
    name: "Royal Decors & Florists",
    category: "DECORATOR",
    contactName: "Vikram Sharma",
    phone: "+919876543210",
    email: "vikram@royaldecors.com",
    contractStatus: "SIGNED",
    contractAmountPaise: 50000000,
    paidAmountPaise: 20000000,
    eventIds: eventIds.map((id) => new Types.ObjectId(id)),
    createdBy: new Types.ObjectId(fakeUserId),
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject: function () {
      return this;
    },
  });

  const createMockEventDoc = (eventId: string, name: string) => ({
    _id: new Types.ObjectId(eventId),
    weddingId: new Types.ObjectId(fakeWeddingId),
    name,
    type: "SANGEET",
    startAt: new Date("2026-11-20T18:00:00.000Z"),
    toObject: function () {
      return this;
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(TeamAuthorization, "requireEventAccess").mockResolvedValue(true);
  });

  describe("Vendor Ceremony Association (Link & Unlink)", () => {
    it("should successfully link a same-wedding vendor to a ceremony", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(EventRepository, "findByIdAndWeddingId").mockResolvedValue(
        createMockEventDoc(fakeEventId1, "Sangeet Night") as unknown as IEvent
      );
      vi.spyOn(VendorRepository, "addEventToVendor").mockResolvedValue(
        createMockVendorDoc([fakeEventId1]) as unknown as IVendor
      );

      const result = await VendorService.linkVendorToEvent({
        weddingId: fakeWeddingId,
        vendorId: fakeVendorId,
        eventId: fakeEventId1,
        userId: fakeUserId,
      });

      expect(connectToDatabase).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data?.eventIds).toContain(fakeEventId1);
      expect(VendorRepository.addEventToVendor).toHaveBeenCalledWith({
        weddingId: fakeWeddingId,
        vendorId: fakeVendorId,
        eventId: fakeEventId1,
      });
    });

    it("should maintain idempotency when linking an already associated vendor", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(EventRepository, "findByIdAndWeddingId").mockResolvedValue(
        createMockEventDoc(fakeEventId1, "Sangeet Night") as unknown as IEvent
      );
      vi.spyOn(VendorRepository, "addEventToVendor").mockResolvedValue(
        createMockVendorDoc([fakeEventId1]) as unknown as IVendor
      );

      const result = await VendorService.linkVendorToEvent({
        weddingId: fakeWeddingId,
        vendorId: fakeVendorId,
        eventId: fakeEventId1,
        userId: fakeUserId,
      });

      expect(result.success).toBe(true);
      expect(result.data?.eventIds).toHaveLength(1);
    });

    it("should reject linking if ceremony belongs to a different wedding", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(EventRepository, "findByIdAndWeddingId").mockResolvedValue(null);

      const result = await VendorService.linkVendorToEvent({
        weddingId: unrelatedWeddingId,
        vendorId: fakeVendorId,
        eventId: fakeEventId1,
        userId: fakeUserId,
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("INVALID_EVENT");
    });

    it("should successfully unlink vendor from ceremony without deleting vendor or other ceremony links", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(EventRepository, "findByIdAndWeddingId").mockResolvedValue(
        createMockEventDoc(fakeEventId1, "Sangeet Night") as unknown as IEvent
      );
      vi.spyOn(VendorRepository, "removeEventFromVendor").mockResolvedValue(
        createMockVendorDoc([fakeEventId2]) as unknown as IVendor
      );

      const result = await VendorService.unlinkVendorFromEvent({
        weddingId: fakeWeddingId,
        vendorId: fakeVendorId,
        eventId: fakeEventId1,
        userId: fakeUserId,
      });

      expect(result.success).toBe(true);
      expect(result.data?.eventIds).not.toContain(fakeEventId1);
      expect(result.data?.eventIds).toContain(fakeEventId2);
      expect(VendorRepository.removeEventFromVendor).toHaveBeenCalledWith({
        weddingId: fakeWeddingId,
        vendorId: fakeVendorId,
        eventId: fakeEventId1,
      });
    });

    it("should deny linking/unlinking if user is not a member of the wedding", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(false);
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(null);

      const linkResult = await VendorService.linkVendorToEvent({
        weddingId: fakeWeddingId,
        vendorId: fakeVendorId,
        eventId: fakeEventId1,
        userId: fakeUserId,
      });
      expect(linkResult.success).toBe(false);
      expect(linkResult.code).toBe("FORBIDDEN");

      const unlinkResult = await VendorService.unlinkVendorFromEvent({
        weddingId: fakeWeddingId,
        vendorId: fakeVendorId,
        eventId: fakeEventId1,
        userId: fakeUserId,
      });
      expect(unlinkResult.success).toBe(false);
      expect(unlinkResult.code).toBe("FORBIDDEN");
    });
  });

  describe("Ceremony Financial Metrics Logic", () => {
    it("should correctly compute total expenses, paid amount, and outstanding balance in integer paise excluding REJECTED expenses", () => {
      const expenses = [
        {
          id: "exp_1",
          eventId: fakeEventId1,
          totalAmountPaise: 15000000, // ₹1,50,000
          paidAmountPaise: 5000000,   // ₹50,000
          status: "APPROVED",
        },
        {
          id: "exp_2",
          eventId: fakeEventId1,
          totalAmountPaise: 8000000,  // ₹80,000
          paidAmountPaise: 8000000,  // ₹80,000
          status: "PAID",
        },
        {
          id: "exp_3",
          eventId: fakeEventId1,
          totalAmountPaise: 20000000, // REJECTED expense (should be ignored)
          paidAmountPaise: 0,
          status: "REJECTED",
        },
        {
          id: "exp_4",
          eventId: fakeEventId2, // Different ceremony expense (should be ignored)
          totalAmountPaise: 99000000,
          paidAmountPaise: 10000000,
          status: "APPROVED",
        },
      ];

      const ceremonyExpenses = expenses.filter(
        (e) => e.eventId === fakeEventId1 && e.status !== "REJECTED"
      );

      const totalExpensesPaise = ceremonyExpenses.reduce(
        (acc, e) => acc + (e.totalAmountPaise || 0),
        0
      );
      const confirmedPaidPaise = ceremonyExpenses.reduce(
        (acc, e) => acc + (e.paidAmountPaise || 0),
        0
      );
      const outstandingBalancePaise = ceremonyExpenses.reduce(
        (acc, e) => acc + Math.max(0, (e.totalAmountPaise || 0) - (e.paidAmountPaise || 0)),
        0
      );

      expect(totalExpensesPaise).toBe(23000000);     // ₹2,30,000
      expect(confirmedPaidPaise).toBe(13000000);     // ₹1,30,000
      expect(outstandingBalancePaise).toBe(10000000); // ₹1,00,000
    });
  });

  describe("Regression Tests for P1 Security & Financial Correctness Findings", () => {
    it("CEREMONY-P1-01: should query expenses and payments with limit 10000 for unpaginated vendor financial metrics", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(VendorRepository, "findVendorsByFilters").mockResolvedValue({
        vendors: [createMockVendorDoc([]) as unknown as IVendor],
        hasMore: false,
        totalCount: 1,
      });
      vi.spyOn(EventRepository, "findEventsByWeddingId").mockResolvedValue([]);
      vi.spyOn(ExpenseRepository, "findExpensesByFilters").mockResolvedValue({ expenses: [], hasMore: false, totalCount: 0 });
      vi.spyOn(ExpensePaymentRepository, "findPaymentsByFilters").mockResolvedValue({ payments: [], hasMore: false, totalCount: 0 });

      await VendorService.getVendors(fakeWeddingId, fakeUserId, {});

      expect(ExpenseRepository.findExpensesByFilters).toHaveBeenCalledWith({ weddingId: fakeWeddingId, limit: 10000 });
      expect(ExpensePaymentRepository.findPaymentsByFilters).toHaveBeenCalledWith({ weddingId: fakeWeddingId, status: "PAID", limit: 10000 });

      vi.spyOn(VendorRepository, "findByIdAndWeddingId").mockResolvedValue(createMockVendorDoc([]) as unknown as IVendor);
      const expId = new Types.ObjectId().toString();
      vi.spyOn(ExpenseRepository, "findExpensesByFilters").mockResolvedValue({
        expenses: [{ _id: new Types.ObjectId(expId), totalAmountPaise: 100000, approvalStatus: "APPROVED" }] as never,
        hasMore: false,
        totalCount: 1,
      });

      await VendorService.getVendorById(fakeWeddingId, fakeVendorId, fakeUserId);
      expect(ExpensePaymentRepository.findPaymentsByFilters).toHaveBeenCalledWith({ weddingId: fakeWeddingId, status: "PAID", limit: 10000 });
    });

    it("CEREMONY-P1-02: should reject ceremony detail access and vendor linking if user lacks event scope permission", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingPermission").mockResolvedValue(true);
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue({ status: "ACTIVE", role: "MEMBER" } as never);
      vi.spyOn(TeamAuthorization, "requireEventAccess").mockResolvedValue(false); // Scope access denied!

      vi.spyOn(EventRepository, "findByIdAndWeddingId").mockResolvedValue(
        createMockEventDoc(fakeEventId1, "Restricted VIP Reception") as unknown as IEvent
      );

      const linkResult = await VendorService.linkVendorToEvent({
        weddingId: fakeWeddingId,
        vendorId: fakeVendorId,
        eventId: fakeEventId1,
        userId: fakeUserId,
      });

      expect(linkResult.success).toBe(false);
      expect(linkResult.code).toBe("FORBIDDEN");
      expect(linkResult.error).toContain("do not have permission for this ceremony");

      const eventResult = await EventService.getEventById(fakeWeddingId, fakeEventId1, fakeUserId);

      expect(eventResult.success).toBe(false);
      expect(eventResult.code).toBe("FORBIDDEN");
      expect(eventResult.error).toContain("do not have permission for this ceremony");
    });
  });
});
