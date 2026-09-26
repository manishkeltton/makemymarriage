import mongoose, { Schema, Document, Types } from "mongoose";

export const GUEST_SIDES = ["BRIDE", "GROOM", "BOTH"] as const;
export type GuestSide = (typeof GUEST_SIDES)[number];

export const INVITATION_STATUSES = ["NOT_SENT", "SENT"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const RSVP_STATUSES = ["AWAITING", "ATTENDING", "NOT_ATTENDING"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export interface IGuestHouseholdMember {
  _id?: Types.ObjectId;
  name: string;
}

export interface IGuestHousehold extends Document {
  _id: Types.ObjectId;
  weddingId: Types.ObjectId;
  householdName: string;
  primaryContact: {
    name: string;
    email?: string;
    phone?: string;
  };
  side: GuestSide;
  members: IGuestHouseholdMember[];
  totalInvited: number;
  invitationStatus: InvitationStatus;
  invitationSentAt?: Date;
  rsvp: {
    status: RsvpStatus;
    attendingCount?: number;
    respondedAt?: Date;
  };
  galleryAccess: boolean;
  notes?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GuestHouseholdSchema = new Schema<IGuestHousehold>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: [true, "weddingId is required"],
      index: true,
    },
    householdName: {
      type: String,
      required: [true, "Household name is required"],
      trim: true,
      maxlength: [200, "Household name cannot exceed 200 characters"],
    },
    primaryContact: {
      name: {
        type: String,
        required: [true, "Primary contact name is required"],
        trim: true,
        maxlength: [200, "Primary contact name cannot exceed 200 characters"],
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [254, "Email cannot exceed 254 characters"],
      },
      phone: {
        type: String,
        trim: true,
        maxlength: [50, "Phone number cannot exceed 50 characters"],
      },
    },
    side: {
      type: String,
      required: [true, "Guest side is required"],
      enum: GUEST_SIDES,
      default: "BOTH",
    },
    members: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: [200, "Member name cannot exceed 200 characters"],
        },
      },
    ],
    totalInvited: {
      type: Number,
      required: [true, "totalInvited is required"],
      min: [1, "totalInvited must be at least 1"],
      validate: {
        validator: (val: number) => Number.isInteger(val) && val >= 1,
        message: "totalInvited must be a positive integer",
      },
    },
    invitationStatus: {
      type: String,
      required: true,
      enum: INVITATION_STATUSES,
      default: "NOT_SENT",
    },
    invitationSentAt: {
      type: Date,
    },
    rsvp: {
      status: {
        type: String,
        required: true,
        enum: RSVP_STATUSES,
        default: "AWAITING",
      },
      attendingCount: {
        type: Number,
        min: [0, "attendingCount cannot be negative"],
        validate: {
          validator: function (this: IGuestHousehold, val: number) {
            if (val === undefined || val === null) return true;
            if (!Number.isInteger(val)) return false;
            if (this.rsvp?.status === "ATTENDING") {
              return val >= 1 && val <= this.totalInvited;
            }
            if (this.rsvp?.status === "NOT_ATTENDING") {
              return val === 0;
            }
            return val >= 0;
          },
          message: "attendingCount must be valid for current RSVP status and totalInvited",
        },
      },
      respondedAt: {
        type: Date,
      },
    },
    galleryAccess: {
      type: Boolean,
      default: true,
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

// Indexes per Database Design document section 18
GuestHouseholdSchema.index({ weddingId: 1, "rsvp.status": 1 });
GuestHouseholdSchema.index({ weddingId: 1, side: 1 });
GuestHouseholdSchema.index({ weddingId: 1, invitationStatus: 1 });
GuestHouseholdSchema.index({ weddingId: 1, householdName: 1 });

export const GuestHouseholdModel =
  mongoose.models.GuestHousehold ||
  mongoose.model<IGuestHousehold>("GuestHousehold", GuestHouseholdSchema, "guest_households");
