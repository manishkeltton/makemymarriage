import mongoose, { Schema, Document, Types } from "mongoose";

export const VENDOR_CATEGORIES = [
  "VENUE",
  "CATERER",
  "PHOTOGRAPHER",
  "VIDEOGRAPHER",
  "DECORATOR",
  "DJ",
  "CHOREOGRAPHER",
  "MAKEUP_ARTIST",
  "MEHENDI_ARTIST",
  "PANDIT",
  "INVITATION_DESIGNER",
  "ENTERTAINMENT",
  "OTHER",
] as const;

export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

export interface IVendor extends Document {
  _id: Types.ObjectId;
  weddingId: Types.ObjectId;
  name: string;
  category: VendorCategory;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  socialUrl?: string;
  eventIds?: Types.ObjectId[];
  agreedAmountPaise?: number;
  currency: "INR";
  notes?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: [true, "weddingId is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Vendor name is required"],
      trim: true,
      maxlength: [200, "Vendor name cannot exceed 200 characters"],
    },
    category: {
      type: String,
      required: [true, "Vendor category is required"],
      enum: VENDOR_CATEGORIES,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [200, "Contact person name cannot exceed 200 characters"],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [50, "Phone number cannot exceed 50 characters"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [1000, "Address cannot exceed 1000 characters"],
    },
    website: {
      type: String,
      trim: true,
      maxlength: [500, "Website URL cannot exceed 500 characters"],
    },
    socialUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Social profile URL cannot exceed 500 characters"],
    },
    eventIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    agreedAmountPaise: {
      type: Number,
      min: [0, "Agreed amount cannot be negative"],
      validate: {
        validator: (val: number) => val === undefined || val === null || (Number.isInteger(val) && val >= 0),
        message: "agreedAmountPaise must be a non-negative integer",
      },
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR"],
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

// Compound indexes as per Database Design document section 20
VendorSchema.index({ weddingId: 1, category: 1 });
VendorSchema.index({ weddingId: 1, name: 1 });

export const VendorModel =
  mongoose.models.Vendor || mongoose.model<IVendor>("Vendor", VendorSchema, "vendors");
