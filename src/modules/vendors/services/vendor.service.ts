import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { VendorRepository, VendorFilterParams, UpdateVendorParams } from "../repositories/vendor.repository";
import { VendorDTO, toVendorDTO } from "../dto/vendor.dto";
import { CreateVendorInput, UpdateVendorInput } from "../validation/vendor.schemas";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { EventRepository } from "@/modules/events/repositories/event.repository";
import { ExpenseRepository } from "@/modules/expenses/repositories/expense.repository";
import { ExpensePaymentRepository } from "@/modules/expenses/repositories/expense-payment.repository";
import { parseAmountToPaise } from "@/lib/utils/money";

export class VendorService {
  /**
   * Helper to check vendor access permission (`vendors` permission or ADMIN).
   */
  private static async checkVendorAccess(weddingId: string, userId: string): Promise<boolean> {
    const hasPermission = await TeamAuthorization.requireWeddingPermission(weddingId, userId, "vendors");
    if (hasPermission) return true;

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    return Boolean(member && member.status === "ACTIVE" && member.role === "ADMIN");
  }

  /**
   * Fetches vendors for a wedding workspace with filtering and enriched event / financial DTOs.
   */
  static async getVendors(
    weddingId: string,
    userId: string,
    filters: Omit<VendorFilterParams, "weddingId">
  ): Promise<{
    success: boolean;
    data?: VendorDTO[];
    nextCursor?: string;
    hasMore?: boolean;
    totalCount?: number;
    error?: string;
    code?: string;
  }> {
    await connectToDatabase();

    const allowed = await VendorService.checkVendorAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires vendor permission", code: "FORBIDDEN" };
    }

    try {
      const { vendors, nextCursor, hasMore, totalCount } = await VendorRepository.findVendorsByFilters({
        weddingId,
        ...filters,
      });

      // Gather event & financial data for enrichment
      const allEvents = await EventRepository.findEventsByWeddingId({ weddingId });
      const eventMap = new Map(allEvents.map((e) => [e._id.toString(), e.name]));

      // Gather expense and payment totals per vendor
      const [expenses, payments] = await Promise.all([
        ExpenseRepository.findExpensesByFilters({ weddingId }),
        ExpensePaymentRepository.findPaymentsByFilters({ weddingId, status: "PAID" }),
      ]);

      const paidByExpenseId = new Map<string, number>();
      for (const p of payments.payments) {
        const expId = p.expenseId.toString();
        paidByExpenseId.set(expId, (paidByExpenseId.get(expId) || 0) + p.amountPaise);
      }

      const vendorExpensesMap = new Map<string, number>();
      const vendorPaidMap = new Map<string, number>();

      for (const exp of expenses.expenses) {
        if (exp.vendorId) {
          const vId = exp.vendorId.toString();
          if (exp.approvalStatus !== "REJECTED") {
            vendorExpensesMap.set(vId, (vendorExpensesMap.get(vId) || 0) + exp.totalAmountPaise);
            const paidForExp = paidByExpenseId.get(exp._id.toString()) || 0;
            vendorPaidMap.set(vId, (vendorPaidMap.get(vId) || 0) + paidForExp);
          }
        }
      }

      const dtos = vendors.map((v) => {
        const vId = v._id.toString();
        const linkedEvents = (v.eventIds || [])
          .map((id) => {
            const idStr = id.toString();
            const name = eventMap.get(idStr);
            return name ? { id: idStr, name } : null;
          })
          .filter(Boolean) as Array<{ id: string; name: string }>;

        const agreedPaise = v.agreedAmountPaise || 0;
        const totalExpensesPaise = vendorExpensesMap.get(vId) || 0;
        const totalPaidPaise = vendorPaidMap.get(vId) || 0;
        const baseTarget = agreedPaise > 0 ? agreedPaise : totalExpensesPaise;
        const totalOutstandingPaise = Math.max(0, baseTarget - totalPaidPaise);

        return toVendorDTO(v, {
          events: linkedEvents,
          financials: {
            agreedAmountPaise: agreedPaise,
            totalExpensesPaise,
            totalPaidPaise,
            totalOutstandingPaise,
          },
        });
      });

      return { success: true, data: dtos, nextCursor, hasMore, totalCount };
    } catch (err: unknown) {
      console.error("Error fetching vendors:", err);
      return { success: false, error: "Failed to fetch vendors", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Fetches a single vendor by ID.
   */
  static async getVendorById(
    weddingId: string,
    vendorId: string,
    userId: string
  ): Promise<{ success: boolean; data?: VendorDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await VendorService.checkVendorAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires vendor permission", code: "FORBIDDEN" };
    }

    try {
      const vendor = await VendorRepository.findByIdAndWeddingId({ weddingId, vendorId });
      if (!vendor) {
        return { success: false, error: "Vendor not found", code: "NOT_FOUND" };
      }

      const allEvents = await EventRepository.findEventsByWeddingId({ weddingId });
      const eventMap = new Map(allEvents.map((e) => [e._id.toString(), e.name]));

      const linkedEvents = (vendor.eventIds || [])
        .map((id) => {
          const idStr = id.toString();
          const name = eventMap.get(idStr);
          return name ? { id: idStr, name } : null;
        })
        .filter(Boolean) as Array<{ id: string; name: string }>;

      // Calculate vendor financials
      const expenses = await ExpenseRepository.findExpensesByFilters({ weddingId, vendorId });
      const activeExpenses = expenses.expenses.filter((e) => e.approvalStatus !== "REJECTED");
      const activeExpIds = activeExpenses.map((e) => e._id.toString());

      let totalExpensesPaise = 0;
      for (const e of activeExpenses) {
        totalExpensesPaise += e.totalAmountPaise;
      }

      let totalPaidPaise = 0;
      if (activeExpIds.length > 0) {
        const payments = await ExpensePaymentRepository.findPaymentsByFilters({ weddingId, status: "PAID" });
        for (const p of payments.payments) {
          if (activeExpIds.includes(p.expenseId.toString())) {
            totalPaidPaise += p.amountPaise;
          }
        }
      }

      const agreedPaise = vendor.agreedAmountPaise || 0;
      const baseTarget = agreedPaise > 0 ? agreedPaise : totalExpensesPaise;
      const totalOutstandingPaise = Math.max(0, baseTarget - totalPaidPaise);

      return {
        success: true,
        data: toVendorDTO(vendor, {
          events: linkedEvents,
          financials: {
            agreedAmountPaise: agreedPaise,
            totalExpensesPaise,
            totalPaidPaise,
            totalOutstandingPaise,
          },
        }),
      };
    } catch (err: unknown) {
      console.error("Error fetching vendor by ID:", err);
      return { success: false, error: "Failed to fetch vendor", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Creates a vendor with same-wedding event reference validation.
   */
  static async createVendor(
    weddingId: string,
    userId: string,
    payload: CreateVendorInput
  ): Promise<{ success: boolean; data?: VendorDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await VendorService.checkVendorAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires vendor permission", code: "FORBIDDEN" };
    }

    // Validate eventIds belong to the same wedding workspace
    const eventObjectIds: Types.ObjectId[] = [];
    if (payload.eventIds && payload.eventIds.length > 0) {
      const validEvents = await EventRepository.findEventsByWeddingId({ weddingId });
      const validEventIdSet = new Set(validEvents.map((e) => e._id.toString()));

      for (const eId of payload.eventIds) {
        if (!validEventIdSet.has(eId)) {
          return {
            success: false,
            error: "One or more referenced events do not belong to this wedding workspace",
            code: "INVALID_EVENT",
          };
        }
        eventObjectIds.push(new Types.ObjectId(eId));
      }
    }

    try {
      const wId = new Types.ObjectId(weddingId);
      const uId = new Types.ObjectId(userId);

      const agreedPaise = parseAmountToPaise(
        payload.agreedAmountRupees,
        payload.agreedAmountPaise
      );

      const vendor = await VendorRepository.create({
        weddingId: wId,
        name: payload.name,
        category: payload.category,
        contactPerson: payload.contactPerson || undefined,
        phone: payload.phone || undefined,
        email: payload.email || undefined,
        address: payload.address || undefined,
        website: payload.website || undefined,
        socialUrl: payload.socialUrl || undefined,
        eventIds: eventObjectIds,
        agreedAmountPaise: agreedPaise,
        notes: payload.notes || undefined,
        createdBy: uId,
      });

      return { success: true, data: toVendorDTO(vendor) };
    } catch (err: unknown) {
      console.error("Error creating vendor:", err);
      return { success: false, error: "Failed to create vendor", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Updates a vendor document.
   */
  static async updateVendor(
    weddingId: string,
    vendorId: string,
    userId: string,
    payload: UpdateVendorInput
  ): Promise<{ success: boolean; data?: VendorDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await VendorService.checkVendorAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires vendor permission", code: "FORBIDDEN" };
    }

    const existing = await VendorRepository.findByIdAndWeddingId({ weddingId, vendorId });
    if (!existing) {
      return { success: false, error: "Vendor not found", code: "NOT_FOUND" };
    }

    const updateData: UpdateVendorParams = {
      updatedBy: new Types.ObjectId(userId),
    };

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.category !== undefined) updateData.category = payload.category;
    if (payload.contactPerson !== undefined) updateData.contactPerson = payload.contactPerson;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.email !== undefined) updateData.email = payload.email;
    if (payload.address !== undefined) updateData.address = payload.address;
    if (payload.website !== undefined) updateData.website = payload.website;
    if (payload.socialUrl !== undefined) updateData.socialUrl = payload.socialUrl;
    if (payload.notes !== undefined) updateData.notes = payload.notes;

    if (payload.agreedAmountPaise !== undefined && payload.agreedAmountPaise !== null) {
      updateData.agreedAmountPaise = Math.round(Number(payload.agreedAmountPaise));
    } else if (payload.agreedAmountRupees !== undefined && payload.agreedAmountRupees !== null) {
      updateData.agreedAmountPaise = parseAmountToPaise(payload.agreedAmountRupees);
    } else if (payload.agreedAmountPaise === null || payload.agreedAmountRupees === null) {
      updateData.agreedAmountPaise = null;
    }

    if (payload.eventIds !== undefined) {
      const validEvents = await EventRepository.findEventsByWeddingId({ weddingId });
      const validEventIdSet = new Set(validEvents.map((e) => e._id.toString()));

      const eventObjectIds: Types.ObjectId[] = [];
      for (const eId of payload.eventIds) {
        if (!validEventIdSet.has(eId)) {
          return {
            success: false,
            error: "One or more referenced events do not belong to this wedding workspace",
            code: "INVALID_EVENT",
          };
        }
        eventObjectIds.push(new Types.ObjectId(eId));
      }
      updateData.eventIds = eventObjectIds;
    }

    try {
      const updated = await VendorRepository.updateByIdAndWeddingId({
        weddingId,
        vendorId,
        updateData,
      });

      return { success: true, data: toVendorDTO(updated!) };
    } catch (err: unknown) {
      console.error("Error updating vendor:", err);
      return { success: false, error: "Failed to update vendor", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Deletes a vendor document.
   */
  static async deleteVendor(
    weddingId: string,
    vendorId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    await connectToDatabase();

    const allowed = await VendorService.checkVendorAccess(weddingId, userId);
    if (!allowed) {
      return { success: false, error: "Access denied: requires vendor permission", code: "FORBIDDEN" };
    }

    try {
      const deleted = await VendorRepository.deleteByIdAndWeddingId({ weddingId, vendorId });
      if (!deleted) {
        return { success: false, error: "Vendor not found", code: "NOT_FOUND" };
      }

      // Unlink vendorId from associated expenses
      await ExpenseRepository.unlinkVendorFromExpenses({ weddingId, vendorId });

      return { success: true };
    } catch (err: unknown) {
      console.error("Error deleting vendor:", err);
      return { success: false, error: "Failed to delete vendor", code: "INTERNAL_ERROR" };
    }
  }
}
