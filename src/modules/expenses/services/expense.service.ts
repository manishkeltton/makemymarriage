import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { ExpenseRepository, ExpenseFilterParams, UpdateExpenseParams } from "../repositories/expense.repository";
import { ExpensePaymentRepository, ExpensePaymentFilterParams, UpdateExpensePaymentParams } from "../repositories/expense-payment.repository";
import { ExpenseDTO, ExpensePaymentDTO, FinanceSummaryDTO, toExpenseDTO, toExpensePaymentDTO } from "../dto/expense.dto";
import { CreateExpenseInput, UpdateExpenseInput, ApproveExpenseInput, CreatePaymentInput, UpdatePaymentInput } from "../validation/expense.schemas";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { EventRepository } from "@/modules/events/repositories/event.repository";
import { VendorRepository } from "@/modules/vendors/repositories/vendor.repository";
import { DocumentRepository } from "@/modules/documents/repositories/document.repository";
import { TeamMemberRepository } from "@/modules/team/repositories/team-member.repository";
import { EXPENSE_CATEGORIES } from "../models/expense.model";
import { parseAmountToPaise } from "@/lib/utils/money";

export class ExpenseService {
  /**
   * Helper to verify finance access permission (`finance` permission or ADMIN).
   */
  private static async checkFinanceAccess(weddingId: string, userId: string): Promise<boolean> {
    const hasPermission = await TeamAuthorization.requireWeddingPermission(weddingId, userId, "finance");
    if (hasPermission) return true;

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    return Boolean(member && member.status === "ACTIVE" && member.role === "ADMIN");
  }

  /**
   * Fetches expenses with filters and enriched DTO fields (paid amount, payment status, counts).
   */
  static async getExpenses(
    weddingId: string,
    userId: string,
    filters: Omit<ExpenseFilterParams, "weddingId">
  ): Promise<{
    success: boolean;
    data?: ExpenseDTO[];
    nextCursor?: string;
    hasMore?: boolean;
    totalCount?: number;
    error?: string;
    code?: string;
  }> {
    await connectToDatabase();

    const allowed = await ExpenseService.checkFinanceAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires finance permission", code: "FORBIDDEN" };
    }

    try {
      const { expenses, nextCursor, hasMore, totalCount } = await ExpenseRepository.findExpensesByFilters({
        weddingId,
        ...filters,
      });

      // Gather reference IDs for bulk enrichment
      const eventIds = Array.from(new Set(expenses.map((e) => e.eventId?.toString()).filter(Boolean) as string[]));
      const vendorIds = Array.from(new Set(expenses.map((e) => e.vendorId?.toString()).filter(Boolean) as string[]));
      const userIds = Array.from(
        new Set(
          expenses
            .flatMap((e) => [e.createdBy.toString(), e.approval?.decidedBy?.toString()])
            .filter(Boolean) as string[]
        )
      );
      const expenseIds = expenses.map((e) => e._id.toString());

      const [events, vendors, users, payments, docCounts] = await Promise.all([
        eventIds.length ? EventRepository.findEventsByWeddingId({ weddingId }) : Promise.resolve([]),
        vendorIds.length ? VendorRepository.findVendorsByIdsAndWeddingId({ weddingId, vendorIds }) : Promise.resolve([]),
        userIds.length ? User.find({ _id: { $in: userIds } }) : Promise.resolve([]),
        expenseIds.length ? ExpensePaymentRepository.findPaymentsByExpenseIds({ weddingId, expenseIds }) : Promise.resolve([]),
        Promise.all(
          expenseIds.map((eId) =>
            DocumentRepository.countDocumentsByRelatedId({
              weddingId,
              relatedType: "EXPENSE",
              relatedId: eId,
            })
          )
        ),
      ]);

      const eventMap = new Map(events.map((e) => [e._id.toString(), e.name]));
      const vendorMap = new Map(vendors.map((v) => [v._id.toString(), v.name]));
      const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));

      const paidByExpenseId = new Map<string, number>();
      const countByExpenseId = new Map<string, number>();
      const hasOverdueByExpenseId = new Map<string, boolean>();

      const now = Date.now();
      for (const p of payments) {
        const eId = p.expenseId.toString();
        countByExpenseId.set(eId, (countByExpenseId.get(eId) || 0) + 1);

        if (p.status === "PAID") {
          paidByExpenseId.set(eId, (paidByExpenseId.get(eId) || 0) + p.amountPaise);
        } else if (p.status === "PENDING" && p.dueAt && new Date(p.dueAt).getTime() < now) {
          hasOverdueByExpenseId.set(eId, true);
        }
      }

      const dtos = expenses.map((e, idx) => {
        const eId = e._id.toString();
        const evId = e.eventId?.toString();
        const vId = e.vendorId?.toString();

        return toExpenseDTO(e, {
          eventName: evId ? eventMap.get(evId) : undefined,
          vendorName: vId ? vendorMap.get(vId) : undefined,
          createdByName: userMap.get(e.createdBy.toString()),
          decidedByName: e.approval?.decidedBy ? userMap.get(e.approval.decidedBy.toString()) : undefined,
          paidAmountPaise: paidByExpenseId.get(eId) || 0,
          paymentsCount: countByExpenseId.get(eId) || 0,
          documentsCount: docCounts[idx] || 0,
          hasOverduePayment: hasOverdueByExpenseId.get(eId) || false,
        });
      });

      return { success: true, data: dtos, nextCursor, hasMore, totalCount };
    } catch (err: unknown) {
      console.error("Error fetching expenses:", err);
      return { success: false, error: "Failed to fetch expenses", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Fetches a single expense by ID.
   */
  static async getExpenseById(
    weddingId: string,
    expenseId: string,
    userId: string
  ): Promise<{ success: boolean; data?: ExpenseDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await ExpenseService.checkFinanceAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires finance permission", code: "FORBIDDEN" };
    }

    try {
      const expense = await ExpenseRepository.findByIdAndWeddingId({ weddingId, expenseId });
      if (!expense) {
        return { success: false, error: "Expense not found", code: "NOT_FOUND" };
      }

      let eventName: string | undefined = undefined;
      if (expense.eventId) {
        const ev = await EventRepository.findByIdAndWeddingId({ weddingId, eventId: expense.eventId.toString() });
        eventName = ev?.name;
      }

      let vendorName: string | undefined = undefined;
      if (expense.vendorId) {
        const ven = await VendorRepository.findByIdAndWeddingId({ weddingId, vendorId: expense.vendorId.toString() });
        vendorName = ven?.name;
      }

      const createdUser = await User.findById(expense.createdBy);
      let decidedByName: string | undefined = undefined;
      if (expense.approval?.decidedBy) {
        const decidedUser = await User.findById(expense.approval.decidedBy);
        decidedByName = decidedUser?.name;
      }

      const payments = await ExpensePaymentRepository.findPaymentsByExpenseId({ weddingId, expenseId });
      const paidAmountPaise = payments
        .filter((p) => p.status === "PAID")
        .reduce((sum, p) => sum + p.amountPaise, 0);

      const hasOverduePayment = payments.some(
        (p) => p.status === "PENDING" && p.dueAt && new Date(p.dueAt).getTime() < Date.now()
      );

      const documentsCount = await DocumentRepository.countDocumentsByRelatedId({
        weddingId,
        relatedType: "EXPENSE",
        relatedId: expenseId,
      });

      return {
        success: true,
        data: toExpenseDTO(expense, {
          eventName,
          vendorName,
          createdByName: createdUser?.name,
          decidedByName,
          paidAmountPaise,
          paymentsCount: payments.length,
          documentsCount,
          hasOverduePayment,
        }),
      };
    } catch (err: unknown) {
      console.error("Error fetching expense by ID:", err);
      return { success: false, error: "Failed to fetch expense", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Creates an expense document.
   */
  static async createExpense(
    weddingId: string,
    userId: string,
    payload: CreateExpenseInput
  ): Promise<{ success: boolean; data?: ExpenseDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await ExpenseService.checkFinanceAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires finance permission", code: "FORBIDDEN" };
    }

    // Same-wedding reference validations
    if (payload.eventId) {
      const validEvent = await EventRepository.findByIdAndWeddingId({ weddingId, eventId: payload.eventId });
      if (!validEvent) {
        return { success: false, error: "Referenced event does not belong to this wedding workspace", code: "INVALID_EVENT" };
      }
    }

    if (payload.vendorId) {
      const validVendor = await VendorRepository.findByIdAndWeddingId({ weddingId, vendorId: payload.vendorId });
      if (!validVendor) {
        return { success: false, error: "Referenced vendor does not belong to this wedding workspace", code: "INVALID_VENDOR" };
      }
    }

    const totalAmountPaise = parseAmountToPaise(
      payload.totalAmountRupees,
      payload.totalAmountPaise
    );

    try {
      const wId = new Types.ObjectId(weddingId);
      const uId = new Types.ObjectId(userId);

      const expense = await ExpenseRepository.create({
        weddingId: wId,
        eventId: payload.eventId ? new Types.ObjectId(payload.eventId) : undefined,
        vendorId: payload.vendorId ? new Types.ObjectId(payload.vendorId) : undefined,
        title: payload.title,
        category: payload.category,
        totalAmountPaise,
        approvalStatus: "PENDING",
        notes: payload.notes || undefined,
        createdBy: uId,
      });

      return { success: true, data: toExpenseDTO(expense) };
    } catch (err: unknown) {
      console.error("Error creating expense:", err);
      return { success: false, error: "Failed to create expense", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Updates an expense document.
   */
  static async updateExpense(
    weddingId: string,
    expenseId: string,
    userId: string,
    payload: UpdateExpenseInput
  ): Promise<{ success: boolean; data?: ExpenseDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await ExpenseService.checkFinanceAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires finance permission", code: "FORBIDDEN" };
    }

    const existing = await ExpenseRepository.findByIdAndWeddingId({ weddingId, expenseId });
    if (!existing) {
      return { success: false, error: "Expense not found", code: "NOT_FOUND" };
    }

    const updateData: UpdateExpenseParams = {
      updatedBy: new Types.ObjectId(userId),
    };

    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.category !== undefined) updateData.category = payload.category;
    if (payload.notes !== undefined) updateData.notes = payload.notes;

    if (payload.totalAmountPaise !== undefined && payload.totalAmountPaise !== null) {
      updateData.totalAmountPaise = Math.round(Number(payload.totalAmountPaise));
    } else if (payload.totalAmountRupees !== undefined && payload.totalAmountRupees !== null) {
      updateData.totalAmountPaise = parseAmountToPaise(payload.totalAmountRupees);
    } else if (payload.totalAmountPaise === null || payload.totalAmountRupees === null) {
      updateData.totalAmountPaise = 0;
    }

    if (payload.eventId !== undefined) {
      if (payload.eventId === null) {
        updateData.eventId = null;
      } else {
        const validEvent = await EventRepository.findByIdAndWeddingId({ weddingId, eventId: payload.eventId });
        if (!validEvent) {
          return { success: false, error: "Referenced event does not belong to this wedding workspace", code: "INVALID_EVENT" };
        }
        updateData.eventId = new Types.ObjectId(payload.eventId);
      }
    }

    if (payload.vendorId !== undefined) {
      if (payload.vendorId === null) {
        updateData.vendorId = null;
      } else {
        const validVendor = await VendorRepository.findByIdAndWeddingId({ weddingId, vendorId: payload.vendorId });
        if (!validVendor) {
          return { success: false, error: "Referenced vendor does not belong to this wedding workspace", code: "INVALID_VENDOR" };
        }
        updateData.vendorId = new Types.ObjectId(payload.vendorId);
      }
    }

    try {
      const updated = await ExpenseRepository.updateByIdAndWeddingId({
        weddingId,
        expenseId,
        updateData,
      });

      return { success: true, data: toExpenseDTO(updated!) };
    } catch (err: unknown) {
      console.error("Error updating expense:", err);
      return { success: false, error: "Failed to update expense", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Performs single-step expense approval (PENDING -> APPROVED / REJECTED).
   */
  static async approveExpense(
    weddingId: string,
    expenseId: string,
    userId: string,
    payload: ApproveExpenseInput
  ): Promise<{ success: boolean; data?: ExpenseDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await ExpenseService.checkFinanceAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires finance permission", code: "FORBIDDEN" };
    }

    const existing = await ExpenseRepository.findByIdAndWeddingId({ weddingId, expenseId });
    if (!existing) {
      return { success: false, error: "Expense not found", code: "NOT_FOUND" };
    }

    try {
      const uId = new Types.ObjectId(userId);
      const updated = await ExpenseRepository.updateByIdAndWeddingId({
        weddingId,
        expenseId,
        updateData: {
          approvalStatus: payload.approvalStatus,
          approval: {
            decidedBy: uId,
            decidedAt: new Date(),
            note: payload.note || undefined,
          },
          updatedBy: uId,
        },
      });

      const decidedUser = await User.findById(userId);

      return {
        success: true,
        data: toExpenseDTO(updated!, { decidedByName: decidedUser?.name }),
      };
    } catch (err: unknown) {
      console.error("Error updating expense approval status:", err);
      return { success: false, error: "Failed to set approval status", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Deletes an expense and all associated payment instalments.
   */
  static async deleteExpense(
    weddingId: string,
    expenseId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await ExpenseService.checkFinanceAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires finance permission", code: "FORBIDDEN" };
    }

    try {
      const deleted = await ExpenseRepository.deleteByIdAndWeddingId({ weddingId, expenseId });
      if (!deleted) {
        return { success: false, error: "Expense not found", code: "NOT_FOUND" };
      }

      // Cascading deletion of payments associated with this expense
      await ExpensePaymentRepository.deletePaymentsByExpenseId({ weddingId, expenseId });

      return { success: true };
    } catch (err: unknown) {
      console.error("Error deleting expense:", err);
      return { success: false, error: "Failed to delete expense", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Creates an expense payment instalment or recorded payment.
   */
  static async createPayment(
    weddingId: string,
    expenseId: string,
    userId: string,
    payload: CreatePaymentInput
  ): Promise<{ success: boolean; data?: ExpensePaymentDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await ExpenseService.checkFinanceAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires finance permission", code: "FORBIDDEN" };
    }

    const expense = await ExpenseRepository.findByIdAndWeddingId({ weddingId, expenseId });
    if (!expense) {
      return { success: false, error: "Expense not found", code: "NOT_FOUND" };
    }

    if (expense.approvalStatus === "REJECTED") {
      return { success: false, error: "Cannot add payment to a rejected expense", code: "REJECTED_EXPENSE" };
    }

    const amountPaise = parseAmountToPaise(
      payload.amountRupees,
      payload.amountPaise
    );

    if (amountPaise <= 0) {
      return { success: false, error: "Payment amount must be greater than zero", code: "INVALID_AMOUNT" };
    }

    // Payer validation
    let payerUserIdObj: Types.ObjectId | undefined = undefined;
    let payerName = payload.paidBy.name || undefined;

    if (payload.paidBy.type === "MEMBER") {
      if (!payload.paidBy.userId) {
        return { success: false, error: "userId is required for MEMBER payer type", code: "INVALID_PAYER" };
      }
      const member = await TeamMemberRepository.findByUserIdAndWeddingId({
        weddingId,
        userId: payload.paidBy.userId,
      });
      if (!member || member.status !== "ACTIVE") {
        return { success: false, error: "Payer is not an active member of this wedding workspace", code: "INVALID_PAYER" };
      }
      payerUserIdObj = new Types.ObjectId(payload.paidBy.userId);
      const payerUserDoc = await User.findById(payload.paidBy.userId);
      payerName = payerUserDoc?.name || "Team Member";
    } else if (payload.paidBy.type === "OTHER") {
      if (!payerName || !payerName.trim()) {
        return { success: false, error: "Payer name is required for OTHER payer type", code: "INVALID_PAYER" };
      }
    }

    try {
      const wId = new Types.ObjectId(weddingId);
      const eId = new Types.ObjectId(expenseId);
      const uId = new Types.ObjectId(userId);

      const status = payload.status || "PENDING";
      const paidAtDate = payload.paidAt
        ? new Date(payload.paidAt)
        : status === "PAID"
        ? new Date()
        : undefined;

      const payment = await ExpensePaymentRepository.create({
        weddingId: wId,
        expenseId: eId,
        amountPaise,
        dueAt: payload.dueAt ? new Date(payload.dueAt) : undefined,
        status,
        paidAt: paidAtDate,
        paidBy: {
          type: payload.paidBy.type,
          userId: payerUserIdObj,
          name: payerName,
        },
        paymentMethod: payload.paymentMethod || undefined,
        receiptMediaId: payload.receiptMediaId ? new Types.ObjectId(payload.receiptMediaId) : undefined,
        notes: payload.notes || undefined,
        createdBy: uId,
      });

      let vendorName: string | undefined = undefined;
      if (expense.vendorId) {
        const v = await VendorRepository.findByIdAndWeddingId({ weddingId, vendorId: expense.vendorId.toString() });
        vendorName = v?.name;
      }

      const creator = await User.findById(userId);

      return {
        success: true,
        data: toExpensePaymentDTO(payment, {
          expenseTitle: expense.title,
          vendorName,
          createdByName: creator?.name,
          payerName,
        }),
      };
    } catch (err: unknown) {
      console.error("Error creating payment:", err);
      return { success: false, error: "Failed to create payment", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Fetches payments for a specific expense or workspace-wide with filters.
   */
  static async getPayments(
    weddingId: string,
    userId: string,
    filters: Omit<ExpensePaymentFilterParams, "weddingId">
  ): Promise<{
    success: boolean;
    data?: ExpensePaymentDTO[];
    nextCursor?: string;
    hasMore?: boolean;
    totalCount?: number;
    error?: string;
    code?: string;
  }> {
    await connectToDatabase();

    const allowed = await ExpenseService.checkFinanceAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires finance permission", code: "FORBIDDEN" };
    }

    try {
      const { payments, nextCursor, hasMore, totalCount } = await ExpensePaymentRepository.findPaymentsByFilters({
        weddingId,
        ...filters,
      });

      // Enrich payments with expense title, vendor name, payer name
      const expenseIds = Array.from(new Set(payments.map((p) => p.expenseId.toString())));
      const payerUserIds = Array.from(
        new Set(payments.map((p) => p.paidBy.userId?.toString()).filter(Boolean) as string[])
      );

      const [expenses, payerUsers] = await Promise.all([
        expenseIds.length ? ExpenseRepository.findExpensesByIdsAndWeddingId({ weddingId, expenseIds }) : Promise.resolve([]),
        payerUserIds.length ? User.find({ _id: { $in: payerUserIds } }) : Promise.resolve([]),
      ]);

      const expenseMap = new Map(expenses.map((e) => [e._id.toString(), e]));
      const payerUserMap = new Map(payerUsers.map((u) => [u._id.toString(), u.name]));

      // Gather vendor names for expenses
      const vendorIds = Array.from(
        new Set(expenses.map((e) => e.vendorId?.toString()).filter(Boolean) as string[])
      );
      const vendors = vendorIds.length
        ? await VendorRepository.findVendorsByIdsAndWeddingId({ weddingId, vendorIds })
        : [];
      const vendorMap = new Map(vendors.map((v) => [v._id.toString(), v.name]));

      const dtos = payments.map((p) => {
        const exp = expenseMap.get(p.expenseId.toString());
        const vId = exp?.vendorId?.toString();
        const pUserId = p.paidBy.userId?.toString();

        return toExpensePaymentDTO(p, {
          expenseTitle: exp?.title,
          vendorName: vId ? vendorMap.get(vId) : undefined,
          payerName: p.paidBy.name || (pUserId ? payerUserMap.get(pUserId) : undefined),
        });
      });

      return { success: true, data: dtos, nextCursor, hasMore, totalCount };
    } catch (err: unknown) {
      console.error("Error fetching payments:", err);
      return { success: false, error: "Failed to fetch payments", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Updates an expense payment instalment.
   */
  static async updatePayment(
    weddingId: string,
    expenseId: string,
    paymentId: string,
    userId: string,
    payload: UpdatePaymentInput
  ): Promise<{ success: boolean; data?: ExpensePaymentDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await ExpenseService.checkFinanceAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires finance permission", code: "FORBIDDEN" };
    }

    const existingPayment = await ExpensePaymentRepository.findByIdAndWeddingId({ weddingId, paymentId });
    if (!existingPayment || existingPayment.expenseId.toString() !== expenseId) {
      return { success: false, error: "Payment not found", code: "NOT_FOUND" };
    }

    const updateData: UpdateExpensePaymentParams = {
      updatedBy: new Types.ObjectId(userId),
    };

    if (payload.amountPaise !== undefined && payload.amountPaise !== null) {
      updateData.amountPaise = Math.round(Number(payload.amountPaise));
    } else if (payload.amountRupees !== undefined && payload.amountRupees !== null) {
      updateData.amountPaise = parseAmountToPaise(payload.amountRupees);
    }

    if (payload.dueAt !== undefined) {
      updateData.dueAt = payload.dueAt ? new Date(payload.dueAt) : null;
    }

    if (payload.status !== undefined) {
      updateData.status = payload.status;
      if (payload.status === "PAID" && existingPayment.status !== "PAID") {
        updateData.paidAt = payload.paidAt ? new Date(payload.paidAt) : new Date();
      } else if (payload.status !== "PAID" && existingPayment.status === "PAID") {
        updateData.paidAt = null;
      }
    }

    if (payload.paidAt !== undefined) {
      updateData.paidAt = payload.paidAt ? new Date(payload.paidAt) : null;
    }

    if (payload.paymentMethod !== undefined) {
      updateData.paymentMethod = payload.paymentMethod;
    }

    if (payload.notes !== undefined) {
      updateData.notes = payload.notes;
    }

    if (payload.paidBy !== undefined) {
      let payerUserIdObj: Types.ObjectId | null = null;
      let payerName = payload.paidBy.name || undefined;

      if (payload.paidBy.type === "MEMBER") {
        if (!payload.paidBy.userId) {
          return { success: false, error: "userId is required for MEMBER payer type", code: "INVALID_PAYER" };
        }
        const member = await TeamMemberRepository.findByUserIdAndWeddingId({
          weddingId,
          userId: payload.paidBy.userId,
        });
        if (!member || member.status !== "ACTIVE") {
          return { success: false, error: "Payer is not an active member of this wedding workspace", code: "INVALID_PAYER" };
        }
        payerUserIdObj = new Types.ObjectId(payload.paidBy.userId);
        const pUser = await User.findById(payload.paidBy.userId);
        payerName = pUser?.name || "Team Member";
      } else if (payload.paidBy.type === "OTHER") {
        if (!payerName || !payerName.trim()) {
          return { success: false, error: "Payer name is required for OTHER payer type", code: "INVALID_PAYER" };
        }
      }

      updateData.paidBy = {
        type: payload.paidBy.type,
        userId: payerUserIdObj,
        name: payerName,
      };
    }

    try {
      const updated = await ExpensePaymentRepository.updateByIdAndWeddingId({
        weddingId,
        paymentId,
        updateData,
      });

      return { success: true, data: toExpensePaymentDTO(updated!) };
    } catch (err: unknown) {
      console.error("Error updating payment:", err);
      return { success: false, error: "Failed to update payment", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Deletes a payment instalment.
   */
  static async deletePayment(
    weddingId: string,
    expenseId: string,
    paymentId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await ExpenseService.checkFinanceAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires finance permission", code: "FORBIDDEN" };
    }

    try {
      const existingPayment = await ExpensePaymentRepository.findByIdAndWeddingId({ weddingId, paymentId });
      if (!existingPayment || existingPayment.expenseId.toString() !== expenseId) {
        return { success: false, error: "Payment not found", code: "NOT_FOUND" };
      }

      const deleted = await ExpensePaymentRepository.deleteByIdAndWeddingId({ weddingId, paymentId });
      if (!deleted) {
        return { success: false, error: "Payment not found", code: "NOT_FOUND" };
      }

      return { success: true };
    } catch (err: unknown) {
      console.error("Error deleting payment:", err);
      return { success: false, error: "Failed to delete payment", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Computes comprehensive workspace financial metrics and summary breakdown.
   */
  static async getFinanceSummary(
    weddingId: string,
    userId: string
  ): Promise<{ success: boolean; data?: FinanceSummaryDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await ExpenseService.checkFinanceAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires finance permission", code: "FORBIDDEN" };
    }

    try {
      const [expensesResult, paymentsResult] = await Promise.all([
        ExpenseRepository.findExpensesByFilters({ weddingId, limit: 500 }),
        ExpensePaymentRepository.findPaymentsByFilters({ weddingId, limit: 1000 }),
      ]);

      const activeExpenses = expensesResult.expenses.filter((e) => e.approvalStatus !== "REJECTED");
      const activeExpenseIds = new Set(activeExpenses.map((e) => e._id.toString()));

      let totalBudgetPaise = 0;
      let pendingApprovalCount = 0;
      const categoryMap = new Map<string, { total: number; count: number }>();

      for (const cat of EXPENSE_CATEGORIES) {
        categoryMap.set(cat, { total: 0, count: 0 });
      }

      for (const e of expensesResult.expenses) {
        if (e.approvalStatus === "PENDING") {
          pendingApprovalCount++;
        }
        if (e.approvalStatus !== "REJECTED") {
          totalBudgetPaise += e.totalAmountPaise;
          const currentCat = categoryMap.get(e.category) || { total: 0, count: 0 };
          categoryMap.set(e.category, {
            total: currentCat.total + e.totalAmountPaise,
            count: currentCat.count + 1,
          });
        }
      }

      let totalPaidPaise = 0;
      let totalOverduePaise = 0;
      let overduePaymentsCount = 0;
      let upcomingPaymentsCount = 0;

      const now = Date.now();
      const next7Days = now + 7 * 24 * 60 * 60 * 1000;

      const paidByExpenseMap = new Map<string, number>();
      const categoryPaidMap = new Map<string, number>();
      const payerMap = new Map<string, { type: "MEMBER" | "OTHER"; userId?: string; name: string; totalPaidPaise: number; count: number }>();

      for (const p of paymentsResult.payments) {
        const eId = p.expenseId.toString();
        // Only count payments belonging to non-rejected expenses
        if (!activeExpenseIds.has(eId)) continue;

        if (p.status === "PAID") {
          totalPaidPaise += p.amountPaise;
          paidByExpenseMap.set(eId, (paidByExpenseMap.get(eId) || 0) + p.amountPaise);

          // Payer breakdown
          const pKey = p.paidBy.type === "MEMBER" ? `MEMBER_${p.paidBy.userId?.toString()}` : `OTHER_${p.paidBy.name}`;
          const currentPayer = payerMap.get(pKey) || {
            type: p.paidBy.type,
            userId: p.paidBy.userId?.toString(),
            name: p.paidBy.name || "Team Member",
            totalPaidPaise: 0,
            count: 0,
          };
          payerMap.set(pKey, {
            ...currentPayer,
            totalPaidPaise: currentPayer.totalPaidPaise + p.amountPaise,
            count: currentPayer.count + 1,
          });
        } else if (p.status === "PENDING") {
          if (p.dueAt) {
            const dueTime = new Date(p.dueAt).getTime();
            if (dueTime < now) {
              totalOverduePaise += p.amountPaise;
              overduePaymentsCount++;
            } else if (dueTime >= now && dueTime <= next7Days) {
              upcomingPaymentsCount++;
            }
          }
        }
      }

      // Populate category paid amounts
      for (const e of activeExpenses) {
        const paidForExp = paidByExpenseMap.get(e._id.toString()) || 0;
        categoryPaidMap.set(e.category, (categoryPaidMap.get(e.category) || 0) + paidForExp);
      }

      let totalOutstandingPaise = 0;
      for (const e of activeExpenses) {
        const paidForExp = paidByExpenseMap.get(e._id.toString()) || 0;
        totalOutstandingPaise += Math.max(0, e.totalAmountPaise - paidForExp);
      }

      const categoriesBreakdown = Array.from(categoryMap.entries())
        .map(([cat, info]) => {
          const paidPaise = categoryPaidMap.get(cat) || 0;
          return {
            category: cat,
            totalAmountPaise: info.total,
            paidAmountPaise: paidPaise,
            outstandingAmountPaise: Math.max(0, info.total - paidPaise),
            count: info.count,
          };
        })
        .filter((c) => c.count > 0 || c.totalAmountPaise > 0);

      const payerBreakdown = Array.from(payerMap.values());

      return {
        success: true,
        data: {
          totalBudgetPaise,
          totalPaidPaise,
          totalOutstandingPaise,
          totalOverduePaise,
          overduePaymentsCount,
          upcomingPaymentsCount,
          pendingApprovalCount,
          categoriesBreakdown,
          payerBreakdown,
        },
      };
    } catch (err: unknown) {
      console.error("Error computing finance summary:", err);
      return { success: false, error: "Failed to compute finance summary", code: "INTERNAL_ERROR" };
    }
  }
}
