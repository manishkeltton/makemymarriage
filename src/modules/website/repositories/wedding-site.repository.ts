import { Types } from "mongoose";
import { WeddingSiteModel, IWeddingSite, IWebsiteSection, WebsiteStatus, WebsiteTheme } from "../models/wedding-site.model";

export interface CreateWeddingSiteParams {
  weddingId: Types.ObjectId;
  slug: string;
  status?: WebsiteStatus;
  theme?: WebsiteTheme;
  locale?: "en" | "hi";
  seo?: {
    title?: string;
    description?: string;
    noIndex?: boolean;
  };
  style?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  sections?: IWebsiteSection[];
  createdBy: Types.ObjectId;
}

export interface UpdateWeddingSiteParams {
  slug?: string;
  status?: WebsiteStatus;
  theme?: WebsiteTheme;
  locale?: "en" | "hi";
  seo?: {
    title?: string;
    description?: string;
    noIndex?: boolean;
  };
  style?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  sections?: IWebsiteSection[];
  publishedAt?: Date | null;
  updatedBy?: Types.ObjectId;
}

export class WeddingSiteRepository {
  static async create(params: CreateWeddingSiteParams): Promise<IWeddingSite> {
    const site = new WeddingSiteModel({
      weddingId: params.weddingId,
      slug: params.slug.toLowerCase().trim(),
      status: params.status || "DRAFT",
      theme: params.theme || "ROYAL_GOLD",
      locale: params.locale || "en",
      seo: params.seo || { noIndex: false },
      style: params.style || {},
      sections: params.sections || [],
      createdBy: params.createdBy,
    });
    return await site.save();
  }

  static async findByWeddingId(weddingId: string): Promise<IWeddingSite | null> {
    if (!Types.ObjectId.isValid(weddingId)) return null;
    return await WeddingSiteModel.findOne({ weddingId: new Types.ObjectId(weddingId) }).exec();
  }

  static async findBySlug(slug: string): Promise<IWeddingSite | null> {
    if (!slug || !slug.trim()) return null;
    return await WeddingSiteModel.findOne({ slug: slug.toLowerCase().trim() }).exec();
  }

  static async isSlugAvailable(slug: string, excludeWeddingId?: string): Promise<boolean> {
    if (!slug || !slug.trim()) return false;
    const cleanSlug = slug.toLowerCase().trim();

    const query: Record<string, unknown> = { slug: cleanSlug };
    if (excludeWeddingId && Types.ObjectId.isValid(excludeWeddingId)) {
      query.weddingId = { $ne: new Types.ObjectId(excludeWeddingId) };
    }

    const count = await WeddingSiteModel.countDocuments(query).exec();
    return count === 0;
  }

  static async updateByWeddingId({
    weddingId,
    updateData,
  }: {
    weddingId: string;
    updateData: UpdateWeddingSiteParams;
  }): Promise<IWeddingSite | null> {
    if (!Types.ObjectId.isValid(weddingId)) return null;

    const setPayload: Record<string, unknown> = {};

    if (updateData.slug !== undefined) setPayload.slug = updateData.slug.toLowerCase().trim();
    if (updateData.status !== undefined) setPayload.status = updateData.status;
    if (updateData.theme !== undefined) setPayload.theme = updateData.theme;
    if (updateData.locale !== undefined) setPayload.locale = updateData.locale;

    if (updateData.seo !== undefined) {
      if (updateData.seo.title !== undefined) setPayload["seo.title"] = updateData.seo.title;
      if (updateData.seo.description !== undefined) setPayload["seo.description"] = updateData.seo.description;
      if (updateData.seo.noIndex !== undefined) setPayload["seo.noIndex"] = updateData.seo.noIndex;
    }

    if (updateData.style !== undefined) {
      if (updateData.style.primaryColor !== undefined) setPayload["style.primaryColor"] = updateData.style.primaryColor;
      if (updateData.style.secondaryColor !== undefined) setPayload["style.secondaryColor"] = updateData.style.secondaryColor;
      if (updateData.style.fontFamily !== undefined) setPayload["style.fontFamily"] = updateData.style.fontFamily;
    }

    if (updateData.sections !== undefined) setPayload.sections = updateData.sections;
    if (updateData.publishedAt !== undefined) setPayload.publishedAt = updateData.publishedAt;
    if (updateData.updatedBy !== undefined) setPayload.updatedBy = updateData.updatedBy;

    return await WeddingSiteModel.findOneAndUpdate(
      { weddingId: new Types.ObjectId(weddingId) },
      { $set: setPayload },
      { new: true, runValidators: true }
    ).exec();
  }

  static async deleteByWeddingId(weddingId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(weddingId)) return false;
    const result = await WeddingSiteModel.deleteOne({ weddingId: new Types.ObjectId(weddingId) }).exec();
    return result.deletedCount > 0;
  }
}
