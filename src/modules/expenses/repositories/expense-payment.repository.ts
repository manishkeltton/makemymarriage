import { Types } from "mongoose";
import {
  ExpensePaymentModel,
  IExpensePayment,
  StoredPaymentStatus,
  PayerType,
} from "../models/expense-payment.model";

export interface CreateExpensePaymentParams {
  weddingId: Types.ObjectId;
  expenseId: Types.ObjectId;
  amountPaise: number;
  dueAt?: Date;
  status: StoredPaymentStatus;
  paidAt?: Date;
  paidBy: {
    type: PayerType;
    userId?: Types.ObjectId;
    name?: string;
  };
  paymentMethod?: string;
  receiptMediaId?: Types.ObjectId;
  notes?: string;
  createdBy: Types.ObjectId;
}

export interface UpdateExpensePaymentParams {
  amountPaise?: number;
  dueAt?: Date | null;
  status?: StoredPaymentStatus;
  paidAt?: Date | null;
  paidBy?: {
    type: PayerType;
    userId?: Types.ObjectId | null;
    name?: string | null;
  };
  paymentMethod?: string | null;
  receiptMediaId?: Types.ObjectId | null;
  notes?: string | null;
  updatedBy?: Types.ObjectId;
}

export interface ExpensePaymentFilterParams {
  weddingId: string | Types.ObjectId;
  expenseId?: string;
  status?: StoredPaymentStatus;
  payerUserId?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  paidBefore?: Date;
  paidAfter?: Date;
  limit?: number;
  cursor?: string;
  sort?: "dueAt" | "paidAt" | "createdAt" | "amountPaise";
  order?: "asc" | "desc";
}

export class ExpensePaymentRepository {
  /**
   * Creates a new ExpensePayment document.
   */
  static async create(params: CreateExpensePaymentParams): Promise<IExpensePayment> {
    const doc = new ExpensePaymentModel({
      weddingId: params.weddingId,
      expenseId: params.expenseId,
      amountPaise: params.amountPaise,
      currency: "INR",
      dueAt: params.dueAt,
      status: params.status || "PENDING",
      paidAt: params.paidAt || (params.status === "PAID" ? new Date() : undefined),
      paidBy: {
        type: params.paidBy.type,
        userId: params.paidBy.userId,
        name: params.paidBy.name,
      },
      paymentMethod: params.paymentMethod,
      receiptMediaId: params.receiptMediaId,
      notes: params.notes,
      createdBy: params.createdBy,
    });

    return await doc.save();
  }

  /**
   * Finds expense payments matching filters with cursor pagination.
   */
  static async findPaymentsByFilters(
    params: ExpensePaymentFilterParams
  ): Promise<{ payments: IExpensePayment[]; nextCursor?: string; hasMore: boolean; totalCount: number }> {
    const wId = typeof params.weddingId === "string" ? new Types.ObjectId(params.weddingId) : params.weddingId;
    const limit = Math.min(Math.max(params.limit || 50, 1), 100);

    const query: Record<string, unknown> = { weddingId: wId };

    if (params.expenseId && Types.ObjectId.isValid(params.expenseId)) {
      query.expenseId = new Types.ObjectId(params.expenseId);
    }

    if (params.status) {
      query.status = params.status;
    }

    if (params.payerUserId && Types.ObjectId.isValid(params.payerUserId)) {
      query["paidBy.userId"] = new Types.ObjectId(params.payerUserId);
    }

    if (params.dueBefore || params.dueAfter) {
      const dueAtQuery: { $lte?: Date; $gte?: Date } = {};
      if (params.dueBefore) dueAtQuery.$lte = params.dueBefore;
      if (params.dueAfter) dueAtQuery.$gte = params.dueAfter;
      query.dueAt = dueAtQuery;
    }

    if (params.paidBefore || params.paidAfter) {
      const paidAtQuery: { $lte?: Date; $gte?: Date } = {};
      if (params.paidBefore) paidAtQuery.$lte = params.paidBefore;
      if (params.paidAfter) paidAtQuery.$gte = params.paidAfter;
      query.paidAt = paidAtQuery;
    }

    if (params.cursor && Types.ObjectId.isValid(params.cursor)) {
      query._id = { $gt: new Types.ObjectId(params.cursor) };
    }

    const sortField = params.sort || "createdAt";
    const sortOrder = params.order === "asc" ? 1 : -1;
    const sortObj: Record<string, 1 | -1> = { [sortField]: sortOrder, _id: 1 };

    const totalCount = await ExpensePaymentModel.countDocuments(query);
    const payments = await ExpensePaymentModel.find(query)
      .sort(sortObj)
      .limit(limit + 1)
      .exec();

    let hasMore = false;
    let nextCursor: string | undefined = undefined;

    if (payments.length > limit) {
      hasMore = true;
      payments.pop();
      const lastItem = payments[payments.length - 1];
      nextCursor = lastItem._id.toString();
    }

    return { payments, nextCursor, hasMore, totalCount };
  }

  /**
   * Finds all payments belonging to a specific expense.
   */
  static async findPaymentsByExpenseId({
    weddingId,
    expenseId,
  }: {
    weddingId: string | Types.ObjectId;
    expenseId: string | Types.ObjectId;
  }): Promise<IExpensePayment[]> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(expenseId)) {
      return [];
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const eId = typeof expenseId === "string" ? new Types.ObjectId(expenseId) : expenseId;

    return await ExpensePaymentModel.find({ weddingId: wId, expenseId: eId })
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * Finds all payments belonging to multiple expense IDs.
   */
  static async findPaymentsByExpenseIds({
    weddingId,
    expenseIds,
  }: {
    weddingId: string | Types.ObjectId;
    expenseIds: (string | Types.ObjectId)[];
  }): Promise<IExpensePayment[]> {
    if (!Types.ObjectId.isValid(weddingId) || !expenseIds.length) {
      return [];
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const validIds = expenseIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => (typeof id === "string" ? new Types.ObjectId(id) : id));

    return await ExpensePaymentModel.find({ weddingId: wId, expenseId: { $in: validIds } })
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * Finds a payment by ID strictly scoped to weddingId.
   */
  static async findByIdAndWeddingId({
    weddingId,
    paymentId,
  }: {
    weddingId: string | Types.ObjectId;
    paymentId: string | Types.ObjectId;
  }): Promise<IExpensePayment | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(paymentId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const pId = typeof paymentId === "string" ? new Types.ObjectId(paymentId) : paymentId;

    return await ExpensePaymentModel.findOne({ _id: pId, weddingId: wId }).exec();
  }

  /**
   * Updates a payment document strictly scoped to weddingId and paymentId.
   */
  static async updateByIdAndWeddingId({
    weddingId,
    paymentId,
    updateData,
  }: {
    weddingId: string | Types.ObjectId;
    paymentId: string | Types.ObjectId;
    updateData: UpdateExpensePaymentParams;
  }): Promise<IExpensePayment | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(paymentId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const pId = typeof paymentId === "string" ? new Types.ObjectId(paymentId) : paymentId;

    return await ExpensePaymentModel.findOneAndUpdate(
      { _id: pId, weddingId: wId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Deletes a payment document strictly scoped to weddingId and paymentId.
   */
  static async deleteByIdAndWeddingId({
    weddingId,
    paymentId,
  }: {
    weddingId: string | Types.ObjectId;
    paymentId: string | Types.ObjectId;
  }): Promise<boolean> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(paymentId)) {
      return false;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const pId = typeof paymentId === "string" ? new Types.ObjectId(paymentId) : paymentId;

    const res = await ExpensePaymentModel.deleteOne({ _id: pId, weddingId: wId }).exec();
    return res.deletedCount > 0;
  }

  /**
   * Deletes all payments associated with an expense when the expense is deleted.
   */
  static async deletePaymentsByExpenseId({
    weddingId,
    expenseId,
  }: {
    weddingId: string | Types.ObjectId;
    expenseId: string | Types.ObjectId;
  }): Promise<number> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(expenseId)) {
      return 0;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const eId = typeof expenseId === "string" ? new Types.ObjectId(expenseId) : expenseId;

    const res = await ExpensePaymentModel.deleteMany({ weddingId: wId, expenseId: eId }).exec();
    return res.deletedCount;
  }
}
