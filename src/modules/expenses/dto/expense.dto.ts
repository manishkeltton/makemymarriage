import { IExpense } from "../models/expense.model";
import { IExpensePayment, DerivedPaymentStatus } from "../models/expense-payment.model";

export const EXPENSE_CATEGORIES = [
  "VENUE",
  "CATERING",
  "DECORATION",
  "PHOTOGRAPHY",
  "MAKEUP",
  "CLOTHING",
  "JEWELLERY",
  "ENTERTAINMENT",
  "INVITATION",
  "GIFTS",
  "CEREMONY",
  "TRANSPORT",
  "MISCELLANEOUS",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type ExpenseApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ExpenseDTO {
  id: string;
  weddingId: string;
  eventId?: string;
  vendorId?: string;
  title: string;
  category: string;
  totalAmountPaise: number;
  currency: "INR";
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  approval?: {
    decidedBy?: string;
    decidedByName?: string;
    decidedAt?: string;
    note?: string;
  };
  notes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;

  // Enriched & derived fields
  eventName?: string;
  vendorName?: string;
  createdByName?: string;
  paidAmountPaise?: number;
  outstandingAmountPaise?: number;
  paymentStatus?: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  paymentsCount?: number;
  documentsCount?: number;
}

export interface ExpensePaymentDTO {
  id: string;
  weddingId: string;
  expenseId: string;
  amountPaise: number;
  currency: "INR";
  dueAt?: string;
  status: "PENDING" | "PAID";
  effectiveStatus: DerivedPaymentStatus;
  paidAt?: string;
  paidBy: {
    type: "MEMBER" | "OTHER";
    userId?: string;
    name?: string;
  };
  paymentMethod?: string;
  receiptMediaId?: string;
  notes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;

  // Enriched fields
  expenseTitle?: string;
  vendorName?: string;
  createdByName?: string;
  payerName?: string;
}

export interface CategoryBreakdownDTO {
  category: string;
  totalAmountPaise: number;
  paidAmountPaise: number;
  outstandingAmountPaise: number;
  count: number;
}

export interface PayerBreakdownDTO {
  type: "MEMBER" | "OTHER";
  userId?: string;
  name: string;
  totalPaidPaise: number;
  count: number;
}

export interface FinanceSummaryDTO {
  totalBudgetPaise: number;
  totalPaidPaise: number;
  totalOutstandingPaise: number;
  totalOverduePaise: number;
  overduePaymentsCount: number;
  upcomingPaymentsCount: number;
  pendingApprovalCount: number;
  categoriesBreakdown: CategoryBreakdownDTO[];
  payerBreakdown: PayerBreakdownDTO[];
}

/**
 * Computes derived effective payment status (OVERDUE when PENDING and dueAt < now).
 */
export function getEffectivePaymentStatus(
  status: "PENDING" | "PAID",
  dueAt?: Date | string | null
): DerivedPaymentStatus {
  if (status === "PAID") return "PAID";
  if (dueAt) {
    const dueTime = new Date(dueAt).getTime();
    if (!isNaN(dueTime) && dueTime < Date.now()) {
      return "OVERDUE";
    }
  }
  return "PENDING";
}

export function toExpenseDTO(
  expense: IExpense,
  extra?: {
    eventName?: string;
    vendorName?: string;
    createdByName?: string;
    decidedByName?: string;
    paidAmountPaise?: number;
    paymentsCount?: number;
    documentsCount?: number;
    hasOverduePayment?: boolean;
  }
): ExpenseDTO {
  const paidPaise = extra?.paidAmountPaise ?? 0;
  const totalPaise = expense.totalAmountPaise;
  const outstandingPaise = Math.max(0, totalPaise - paidPaise);

  let pStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE" = "UNPAID";
  if (paidPaise >= totalPaise && totalPaise > 0) {
    pStatus = "PAID";
  } else if (paidPaise > 0) {
    pStatus = "PARTIAL";
  } else if (extra?.hasOverduePayment) {
    pStatus = "OVERDUE";
  }

  return {
    id: expense._id.toString(),
    weddingId: expense.weddingId.toString(),
    eventId: expense.eventId ? expense.eventId.toString() : undefined,
    vendorId: expense.vendorId ? expense.vendorId.toString() : undefined,
    title: expense.title,
    category: expense.category,
    totalAmountPaise: expense.totalAmountPaise,
    currency: expense.currency || "INR",
    approvalStatus: expense.approvalStatus || "PENDING",
    approval: expense.approval
      ? {
          decidedBy: expense.approval.decidedBy ? expense.approval.decidedBy.toString() : undefined,
          decidedByName: extra?.decidedByName,
          decidedAt: expense.approval.decidedAt ? expense.approval.decidedAt.toISOString() : undefined,
          note: expense.approval.note || undefined,
        }
      : undefined,
    notes: expense.notes || undefined,
    createdBy: expense.createdBy.toString(),
    updatedBy: expense.updatedBy ? expense.updatedBy.toString() : undefined,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
    eventName: extra?.eventName,
    vendorName: extra?.vendorName,
    createdByName: extra?.createdByName,
    paidAmountPaise: paidPaise,
    outstandingAmountPaise: outstandingPaise,
    paymentStatus: pStatus,
    paymentsCount: extra?.paymentsCount ?? 0,
    documentsCount: extra?.documentsCount ?? 0,
  };
}

export function toExpensePaymentDTO(
  payment: IExpensePayment,
  extra?: {
    expenseTitle?: string;
    vendorName?: string;
    createdByName?: string;
    payerName?: string;
  }
): ExpensePaymentDTO {
  const effectiveStatus = getEffectivePaymentStatus(payment.status, payment.dueAt);

  return {
    id: payment._id.toString(),
    weddingId: payment.weddingId.toString(),
    expenseId: payment.expenseId.toString(),
    amountPaise: payment.amountPaise,
    currency: payment.currency || "INR",
    dueAt: payment.dueAt ? payment.dueAt.toISOString() : undefined,
    status: payment.status,
    effectiveStatus,
    paidAt: payment.paidAt ? payment.paidAt.toISOString() : undefined,
    paidBy: {
      type: payment.paidBy.type,
      userId: payment.paidBy.userId ? payment.paidBy.userId.toString() : undefined,
      name: payment.paidBy.name || extra?.payerName || undefined,
    },
    paymentMethod: payment.paymentMethod || undefined,
    receiptMediaId: payment.receiptMediaId ? payment.receiptMediaId.toString() : undefined,
    notes: payment.notes || undefined,
    createdBy: payment.createdBy.toString(),
    updatedBy: payment.updatedBy ? payment.updatedBy.toString() : undefined,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    expenseTitle: extra?.expenseTitle,
    vendorName: extra?.vendorName,
    createdByName: extra?.createdByName,
    payerName: extra?.payerName || payment.paidBy.name,
  };
}
