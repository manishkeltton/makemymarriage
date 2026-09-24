import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type EventType =
  | "ROKA"
  | "ENGAGEMENT"
  | "TILAK"
  | "MEHENDI"
  | "HALDI"
  | "SANGEET"
  | "WEDDING"
  | "RECEPTION"
  | "CUSTOM";

export interface IEventVenue {
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  locality?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
  placeId?: string;
}

export interface IEvent extends Document {
  weddingId: Types.ObjectId;
  name: string;
  description?: string;
  type?: EventType;
  startAt: Date;
  endAt?: Date;
  venue?: IEventVenue;
  dressCode?: string;
  coverMediaId?: Types.ObjectId;
  notes?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventVenueSchema = new Schema<IEventVenue>(
  {
    name: { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    locality: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    mapUrl: { type: String, trim: true },
    placeId: { type: String, trim: true },
  },
  { _id: false }
);

const EventSchema = new Schema<IEvent>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "ROKA",
        "ENGAGEMENT",
        "TILAK",
        "MEHENDI",
        "HALDI",
        "SANGEET",
        "WEDDING",
        "RECEPTION",
        "CUSTOM",
      ],
      default: "CUSTOM",
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
    },
    venue: {
      type: EventVenueSchema,
      default: undefined,
    },
    dressCode: {
      type: String,
      trim: true,
    },
    coverMediaId: {
      type: Schema.Types.ObjectId,
      ref: "Media",
      default: null,
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
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes specified in Database Design
EventSchema.index({ weddingId: 1, startAt: 1 });
EventSchema.index({ weddingId: 1, name: 1 });

export const EventModel: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);
