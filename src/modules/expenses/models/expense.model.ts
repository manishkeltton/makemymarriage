import mongoose, { Schema, Document, Types } from "mongoose";

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
  "OTHER",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type ExpenseApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface IExpense extends Document {
  _id: Types.ObjectId;
  weddingId: Types.ObjectId;
  eventId?: Types.ObjectId;
  vendorId?: Types.ObjectId;
  title: string;
  category: ExpenseCategory;
  totalAmountPaise: number;
  currency: "INR";
  approvalStatus: ExpenseApprovalStatus;
  approval?: {
    decidedBy?: Types.ObjectId;
    decidedAt?: Date;
    note?: string;
  };
  notes?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: [true, "weddingId is required"],
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
    },
    title: {
      type: String,
      required: [true, "Expense title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    category: {
      type: String,
      required: [true, "Expense category is required"],
      enum: EXPENSE_CATEGORIES,
      trim: true,
    },
    totalAmountPaise: {
      type: Number,
      required: [true, "totalAmountPaise is required"],
      min: [0, "Total amount cannot be negative"],
      validate: {
        validator: (val: number) => Number.isInteger(val) && val >= 0,
        message: "totalAmountPaise must be a non-negative integer",
      },
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR"],
    },
    approvalStatus: {
      type: String,
      default: "PENDING",
      enum: ["PENDING", "APPROVED", "REJECTED"],
    },
    approval: {
      decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
      decidedAt: { type: Date },
      note: { type: String, trim: true, maxlength: 1000 },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "createdBy is required"],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per Database Design document section 22
ExpenseSchema.index({ weddingId: 1, eventId: 1 });
ExpenseSchema.index({ weddingId: 1, vendorId: 1 });
ExpenseSchema.index({ weddingId: 1, category: 1 });
ExpenseSchema.index({ weddingId: 1, approvalStatus: 1 });
ExpenseSchema.index({ weddingId: 1, createdAt: -1 });

export const ExpenseModel =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema, "expenses");
