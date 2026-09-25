import mongoose, { Schema, Document, Types } from "mongoose";

export type StoredPaymentStatus = "PENDING" | "PAID";
export type DerivedPaymentStatus = "PENDING" | "PAID" | "OVERDUE";
export type PayerType = "MEMBER" | "OTHER";

export interface IExpensePayment extends Document {
  _id: Types.ObjectId;
  weddingId: Types.ObjectId;
  expenseId: Types.ObjectId;
  amountPaise: number;
  currency: "INR";
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
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpensePaymentSchema = new Schema<IExpensePayment>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: [true, "weddingId is required"],
      index: true,
    },
    expenseId: {
      type: Schema.Types.ObjectId,
      ref: "Expense",
      required: [true, "expenseId is required"],
      index: true,
    },
    amountPaise: {
      type: Number,
      required: [true, "amountPaise is required"],
      min: [1, "Payment amount must be greater than zero"],
      validate: {
        validator: (val: number) => Number.isInteger(val) && val > 0,
        message: "amountPaise must be a positive integer",
      },
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR"],
    },
    dueAt: {
      type: Date,
    },
    status: {
      type: String,
      required: [true, "Payment status is required"],
      enum: ["PENDING", "PAID"],
      default: "PENDING",
    },
    paidAt: {
      type: Date,
    },
    paidBy: {
      type: {
        type: String,
        required: [true, "Payer type is required"],
        enum: ["MEMBER", "OTHER"],
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      name: {
        type: String,
        trim: true,
        maxlength: [200, "Payer name cannot exceed 200 characters"],
      },
    },
    paymentMethod: {
      type: String,
      trim: true,
      maxlength: [100, "Payment method cannot exceed 100 characters"],
    },
    receiptMediaId: {
      type: Schema.Types.ObjectId,
      ref: "Media",
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

// Indexes per Database Design document section 23
ExpensePaymentSchema.index({ weddingId: 1, expenseId: 1 });
ExpensePaymentSchema.index({ weddingId: 1, status: 1, dueAt: 1 });
ExpensePaymentSchema.index({ weddingId: 1, paidAt: -1 });
ExpensePaymentSchema.index({ weddingId: 1, "paidBy.userId": 1 });

export const ExpensePaymentModel =
  mongoose.models.ExpensePayment ||
  mongoose.model<IExpensePayment>("ExpensePayment", ExpensePaymentSchema, "expense_payments");
