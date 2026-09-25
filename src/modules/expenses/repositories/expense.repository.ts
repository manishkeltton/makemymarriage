import { Types } from "mongoose";
import { ExpenseModel, IExpense, ExpenseCategory, ExpenseApprovalStatus } from "../models/expense.model";

export interface CreateExpenseParams {
  weddingId: Types.ObjectId;
  eventId?: Types.ObjectId;
  vendorId?: Types.ObjectId;
  title: string;
  category: ExpenseCategory;
  totalAmountPaise: number;
  approvalStatus?: ExpenseApprovalStatus;
  notes?: string;
  createdBy: Types.ObjectId;
}

export interface UpdateExpenseParams {
  title?: string;
  category?: ExpenseCategory;
  eventId?: Types.ObjectId | null;
  vendorId?: Types.ObjectId | null;
  totalAmountPaise?: number;
  approvalStatus?: ExpenseApprovalStatus;
  approval?: {
    decidedBy?: Types.ObjectId;
    decidedAt?: Date;
    note?: string;
  };
  notes?: string | null;
  updatedBy?: Types.ObjectId;
}

export interface ExpenseFilterParams {
  weddingId: string | Types.ObjectId;
  category?: ExpenseCategory;
  eventId?: string;
  vendorId?: string;
  approvalStatus?: ExpenseApprovalStatus;
  q?: string;
  limit?: number;
  cursor?: string;
  sort?: "title" | "category" | "createdAt" | "totalAmountPaise";
  order?: "asc" | "desc";
}

export class ExpenseRepository {
  /**
   * Creates a new Expense document.
   */
  static async create(params: CreateExpenseParams): Promise<IExpense> {
    const doc = new ExpenseModel({
      weddingId: params.weddingId,
      eventId: params.eventId,
      vendorId: params.vendorId,
      title: params.title,
      category: params.category,
      totalAmountPaise: params.totalAmountPaise,
      currency: "INR",
      approvalStatus: params.approvalStatus || "PENDING",
      notes: params.notes,
      createdBy: params.createdBy,
    });

    return await doc.save();
  }

  /**
   * Finds expenses with filters and cursor pagination.
   */
  static async findExpensesByFilters(
    params: ExpenseFilterParams
  ): Promise<{ expenses: IExpense[]; nextCursor?: string; hasMore: boolean; totalCount: number }> {
    const wId = typeof params.weddingId === "string" ? new Types.ObjectId(params.weddingId) : params.weddingId;
    const limit = Math.min(Math.max(params.limit || 50, 1), 100);

    const query: Record<string, unknown> = { weddingId: wId };

    if (params.category) {
      query.category = params.category;
    }

    if (params.eventId && Types.ObjectId.isValid(params.eventId)) {
      query.eventId = new Types.ObjectId(params.eventId);
    }

    if (params.vendorId && Types.ObjectId.isValid(params.vendorId)) {
      query.vendorId = new Types.ObjectId(params.vendorId);
    }

    if (params.approvalStatus) {
      query.approvalStatus = params.approvalStatus;
    }

    if (params.q && params.q.trim()) {
      const searchRegex = new RegExp(params.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ title: searchRegex }, { category: searchRegex }];
    }

    if (params.cursor && Types.ObjectId.isValid(params.cursor)) {
      query._id = { $gt: new Types.ObjectId(params.cursor) };
    }

    const sortField = params.sort || "createdAt";
    const sortOrder = params.order === "asc" ? 1 : -1;
    const sortObj: Record<string, 1 | -1> = { [sortField]: sortOrder, _id: 1 };

    const totalCount = await ExpenseModel.countDocuments(query);
    const expenses = await ExpenseModel.find(query)
      .sort(sortObj)
      .limit(limit + 1)
      .exec();

    let hasMore = false;
    let nextCursor: string | undefined = undefined;

    if (expenses.length > limit) {
      hasMore = true;
      expenses.pop();
      const lastItem = expenses[expenses.length - 1];
      nextCursor = lastItem._id.toString();
    }

    return { expenses, nextCursor, hasMore, totalCount };
  }

  /**
   * Finds an expense by ID strictly scoped to weddingId.
   */
  static async findByIdAndWeddingId({
    weddingId,
    expenseId,
  }: {
    weddingId: string | Types.ObjectId;
    expenseId: string | Types.ObjectId;
  }): Promise<IExpense | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(expenseId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const eId = typeof expenseId === "string" ? new Types.ObjectId(expenseId) : expenseId;

    return await ExpenseModel.findOne({ _id: eId, weddingId: wId }).exec();
  }

  /**
   * Finds multiple expenses by IDs strictly scoped to weddingId.
   */
  static async findExpensesByIdsAndWeddingId({
    weddingId,
    expenseIds,
  }: {
    weddingId: string | Types.ObjectId;
    expenseIds: (string | Types.ObjectId)[];
  }): Promise<IExpense[]> {
    if (!Types.ObjectId.isValid(weddingId) || !expenseIds.length) {
      return [];
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const validIds = expenseIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => (typeof id === "string" ? new Types.ObjectId(id) : id));

    return await ExpenseModel.find({ _id: { $in: validIds }, weddingId: wId }).exec();
  }

  /**
   * Updates an expense document strictly scoped to weddingId and expenseId.
   */
  static async updateByIdAndWeddingId({
    weddingId,
    expenseId,
    updateData,
  }: {
    weddingId: string | Types.ObjectId;
    expenseId: string | Types.ObjectId;
    updateData: UpdateExpenseParams;
  }): Promise<IExpense | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(expenseId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const eId = typeof expenseId === "string" ? new Types.ObjectId(expenseId) : expenseId;

    return await ExpenseModel.findOneAndUpdate(
      { _id: eId, weddingId: wId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Deletes an expense document strictly scoped to weddingId and expenseId.
   */
  static async deleteByIdAndWeddingId({
    weddingId,
    expenseId,
  }: {
    weddingId: string | Types.ObjectId;
    expenseId: string | Types.ObjectId;
  }): Promise<boolean> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(expenseId)) {
      return false;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const eId = typeof expenseId === "string" ? new Types.ObjectId(expenseId) : expenseId;

    const res = await ExpenseModel.deleteOne({ _id: eId, weddingId: wId }).exec();
    return res.deletedCount > 0;
  }

  /**
   * Unlinks vendorId from all expenses of a wedding when vendor is deleted.
   */
  static async unlinkVendorFromExpenses({
    weddingId,
    vendorId,
  }: {
    weddingId: string | Types.ObjectId;
    vendorId: string | Types.ObjectId;
  }): Promise<number> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(vendorId)) {
      return 0;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const vId = typeof vendorId === "string" ? new Types.ObjectId(vendorId) : vendorId;

    const res = await ExpenseModel.updateMany(
      { weddingId: wId, vendorId: vId },
      { $unset: { vendorId: 1 } }
    ).exec();

    return res.modifiedCount;
  }
}
