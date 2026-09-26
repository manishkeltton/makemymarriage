import mongoose, { Schema, Document, Types } from "mongoose";
import {
  WEBSITE_STATUSES,
  WEBSITE_THEMES,
  SECTION_TYPES,
  WebsiteStatus,
  WebsiteTheme,
  SectionType,
} from "../constants/wedding-site.constants";

export { WEBSITE_STATUSES, WEBSITE_THEMES, SECTION_TYPES };
export type { WebsiteStatus, WebsiteTheme, SectionType };

export interface IWebsiteSection {
  id: string;
  type: SectionType;
  enabled: boolean;
  order: number;
  config: Record<string, unknown>;
}

export interface IWeddingSite extends Document {
  _id: Types.ObjectId;
  weddingId: Types.ObjectId;
  slug: string;
  status: WebsiteStatus;
  theme: WebsiteTheme;
  locale: "en" | "hi";
  seo: {
    title?: string;
    description?: string;
    noIndex: boolean;
  };
  style: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  sections: IWebsiteSection[];
  publishedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteSectionSchema = new Schema<IWebsiteSection>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true, enum: SECTION_TYPES },
    enabled: { type: Boolean, default: true },
    order: { type: Number, required: true },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const WeddingSiteSchema = new Schema<IWeddingSite>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: [true, "weddingId is required"],
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      required: [true, "Website slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      minlength: [3, "Slug must be at least 3 characters"],
      maxlength: [50, "Slug cannot exceed 50 characters"],
      match: [/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"],
    },
    status: {
      type: String,
      required: true,
      enum: WEBSITE_STATUSES,
      default: "DRAFT",
      index: true,
    },
    theme: {
      type: String,
      required: true,
      enum: WEBSITE_THEMES,
      default: "ROYAL_GOLD",
    },
    locale: {
      type: String,
      required: true,
      enum: ["en", "hi"],
      default: "en",
    },
    seo: {
      title: { type: String, trim: true, maxlength: 200 },
      description: { type: String, trim: true, maxlength: 500 },
      noIndex: { type: Boolean, default: false },
    },
    style: {
      primaryColor: { type: String, trim: true, maxlength: 20 },
      secondaryColor: { type: String, trim: true, maxlength: 20 },
      fontFamily: { type: String, trim: true, maxlength: 100 },
    },
    sections: [WebsiteSectionSchema],
    publishedAt: { type: Date },
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

export const WeddingSiteModel =
  mongoose.models.WeddingSite ||
  mongoose.model<IWeddingSite>("WeddingSite", WeddingSiteSchema, "wedding_sites");
