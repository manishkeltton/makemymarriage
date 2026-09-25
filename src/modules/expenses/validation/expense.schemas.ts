import { z } from "zod";
import { EXPENSE_CATEGORIES } from "../models/expense.model";
import { rupeesToPaise } from "@/lib/utils/money";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, "Invalid ObjectId format");

export const createExpenseSchema = z.object({
  title: z.string().trim().min(1, "Expense title is required").max(200, "Title is too long"),
  category: z.enum(EXPENSE_CATEGORIES, { message: "Invalid expense category" }),
  eventId: objectIdSchema.optional().nullable(),
  vendorId: objectIdSchema.optional().nullable(),
  totalAmountRupees: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val !== undefined && val !== "" ? rupeesToPaise(val) : undefined)),
  totalAmountPaise: z.number().int().min(0, "Total amount cannot be negative").optional(),
  notes: z.string().trim().max(2000, "Notes are too long").optional(),
});

export const updateExpenseSchema = z.object({
  title: z.string().trim().min(1, "Expense title cannot be empty").max(200, "Title is too long").optional(),
  category: z.enum(EXPENSE_CATEGORIES, { message: "Invalid expense category" }).optional(),
  eventId: objectIdSchema.optional().nullable(),
  vendorId: objectIdSchema.optional().nullable(),
  totalAmountRupees: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => (val !== undefined && val !== null && val !== "" ? rupeesToPaise(val) : val === null ? null : undefined)),
  totalAmountPaise: z.number().int().min(0, "Total amount cannot be negative").optional().nullable(),
  notes: z.string().trim().max(2000, "Notes are too long").optional().nullable(),
});

export const approveExpenseSchema = z.object({
  approvalStatus: z.enum(["APPROVED", "REJECTED", "PENDING"], { message: "Invalid approval status" }),
  note: z.string().trim().max(1000, "Approval note is too long").optional(),
});

export const createPaymentSchema = z
  .object({
    amountRupees: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val !== undefined && val !== "" ? rupeesToPaise(val) : undefined)),
    amountPaise: z.number().int().min(1, "Payment amount must be greater than zero").optional(),
    dueAt: z.string().datetime({ message: "dueAt must be a valid ISO 8601 date string" }).optional().nullable(),
    status: z.enum(["PENDING", "PAID"]).optional().default("PENDING"),
    paidAt: z.string().datetime({ message: "paidAt must be a valid ISO 8601 date string" }).optional().nullable(),
    paidBy: z.object({
      type: z.enum(["MEMBER", "OTHER"], { message: "Invalid payer type" }),
      userId: objectIdSchema.optional().nullable(),
      name: z.string().trim().max(200, "Payer name is too long").optional().nullable(),
    }),
    paymentMethod: z.string().trim().max(100, "Payment method is too long").optional(),
    receiptMediaId: objectIdSchema.optional().nullable(),
    notes: z.string().trim().max(2000, "Notes are too long").optional(),
  })
  .refine((data) => {
    const amt = data.amountPaise ?? (data.amountRupees !== undefined ? Number(data.amountRupees) : 0);
    return amt > 0;
  }, { message: "Payment amount must be greater than zero", path: ["amountRupees"] })
  .refine((data) => {
    if (data.paidBy.type === "MEMBER") {
      return Boolean(data.paidBy.userId);
    }
    return true;
  }, { message: "userId is required for MEMBER payer type", path: ["paidBy", "userId"] });

export const updatePaymentSchema = z.object({
  amountRupees: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => (val !== undefined && val !== null && val !== "" ? rupeesToPaise(val) : val === null ? null : undefined)),
  amountPaise: z.number().int().min(1, "Payment amount must be greater than zero").optional().nullable(),
  dueAt: z.string().datetime({ message: "dueAt must be a valid ISO 8601 date string" }).optional().nullable(),
  status: z.enum(["PENDING", "PAID"]).optional(),
  paidAt: z.string().datetime({ message: "paidAt must be a valid ISO 8601 date string" }).optional().nullable(),
  paidBy: z
    .object({
      type: z.enum(["MEMBER", "OTHER"]),
      userId: objectIdSchema.optional().nullable(),
      name: z.string().trim().max(200).optional().nullable(),
    })
    .optional(),
  paymentMethod: z.string().trim().max(100).optional().nullable(),
  receiptMediaId: objectIdSchema.optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export type CreateExpenseInput = z.input<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.input<typeof updateExpenseSchema>;
export type ApproveExpenseInput = z.input<typeof approveExpenseSchema>;
export type CreatePaymentInput = z.input<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.input<typeof updatePaymentSchema>;
