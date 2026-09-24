import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IGeneralLocation {
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

export interface IWedding extends Document {
  title: string;
  bride: {
    name: string;
  };
  groom: {
    name: string;
  };
  primaryWeddingDate: Date;
  generalLocation?: IGeneralLocation;
  coverMediaId?: Types.ObjectId;
  status: "PLANNING" | "COMPLETED" | "ARCHIVED";
  preferredLanguage: "en" | "hi";
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GeneralLocationSchema = new Schema<IGeneralLocation>(
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

const WeddingSchema = new Schema<IWedding>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    bride: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
    },
    groom: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
    },
    primaryWeddingDate: {
      type: Date,
      required: true,
      index: true,
    },
    generalLocation: {
      type: GeneralLocationSchema,
      default: undefined,
    },
    coverMediaId: {
      type: Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
    status: {
      type: String,
      enum: ["PLANNING", "COMPLETED", "ARCHIVED"],
      default: "PLANNING",
      index: true,
    },
    preferredLanguage: {
      type: String,
      enum: ["en", "hi"],
      default: "en",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Wedding: Model<IWedding> =
  mongoose.models.Wedding || mongoose.model<IWedding>("Wedding", WeddingSchema);
