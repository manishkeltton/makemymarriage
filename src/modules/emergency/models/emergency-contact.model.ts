import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IEmergencyContact extends Document {
  weddingId: Types.ObjectId;
  eventId?: Types.ObjectId;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  priority: number;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyContactSchema = new Schema<IEmergencyContact>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    priority: {
      type: Number,
      default: 0,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes matching Database Design #29
EmergencyContactSchema.index({ weddingId: 1, eventId: 1 });
EmergencyContactSchema.index({ weddingId: 1, priority: 1 });

export const EmergencyContactModel: Model<IEmergencyContact> =
  mongoose.models.EmergencyContact || mongoose.model<IEmergencyContact>("EmergencyContact", EmergencyContactSchema);

export type IssuePriority = "NORMAL" | "IMPORTANT" | "URGENT";
export type IssueStatus = "OPEN" | "RESOLVED";

export interface IEmergencyIssue extends Document {
  weddingId: Types.ObjectId;
  eventId?: Types.ObjectId;
  title: string;
  description?: string;
  priority: IssuePriority;
  assignedTo?: Types.ObjectId;
  emergencyContactId?: Types.ObjectId;
  status: IssueStatus;
  resolutionNotes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
}

const EmergencyIssueSchema = new Schema<IEmergencyIssue>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["NORMAL", "IMPORTANT", "URGENT"],
      default: "NORMAL",
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    emergencyContactId: {
      type: Schema.Types.ObjectId,
      ref: "EmergencyContact",
    },
    status: {
      type: String,
      enum: ["OPEN", "RESOLVED"],
      default: "OPEN",
      index: true,
    },
    resolutionNotes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

EmergencyIssueSchema.index({ weddingId: 1, status: 1 });

export const EmergencyIssueModel: Model<IEmergencyIssue> =
  mongoose.models.EmergencyIssue || mongoose.model<IEmergencyIssue>("EmergencyIssue", EmergencyIssueSchema);
