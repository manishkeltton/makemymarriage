import { Types } from "mongoose";
import { VendorModel, IVendor, VendorCategory } from "../models/vendor.model";

export interface CreateVendorParams {
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
  notes?: string;
  createdBy: Types.ObjectId;
}

export interface UpdateVendorParams {
  name?: string;
  category?: VendorCategory;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;
  socialUrl?: string | null;
  eventIds?: Types.ObjectId[];
  agreedAmountPaise?: number | null;
  notes?: string | null;
  updatedBy?: Types.ObjectId;
}

export interface VendorFilterParams {
  weddingId: string | Types.ObjectId;
  category?: VendorCategory;
  eventId?: string;
  q?: string;
  limit?: number;
  cursor?: string;
  sort?: "name" | "category" | "createdAt" | "agreedAmountPaise";
  order?: "asc" | "desc";
}

export class VendorRepository {
  /**
   * Creates a new Vendor document.
   */
  static async create(params: CreateVendorParams): Promise<IVendor> {
    const doc = new VendorModel({
      weddingId: params.weddingId,
      name: params.name,
      category: params.category,
      contactPerson: params.contactPerson,
      phone: params.phone,
      email: params.email,
      address: params.address,
      website: params.website,
      socialUrl: params.socialUrl,
      eventIds: params.eventIds || [],
      agreedAmountPaise: params.agreedAmountPaise,
      currency: "INR",
      notes: params.notes,
      createdBy: params.createdBy,
    });

    return await doc.save();
  }

  /**
   * Finds vendors with filters and cursor-based pagination.
   */
  static async findVendorsByFilters(
    params: VendorFilterParams
  ): Promise<{ vendors: IVendor[]; nextCursor?: string; hasMore: boolean; totalCount: number }> {
    const wId = typeof params.weddingId === "string" ? new Types.ObjectId(params.weddingId) : params.weddingId;
    const limit = Math.min(Math.max(params.limit || 50, 1), 100);

    const query: Record<string, unknown> = { weddingId: wId };

    if (params.category) {
      query.category = params.category;
    }

    if (params.eventId && Types.ObjectId.isValid(params.eventId)) {
      query.eventIds = new Types.ObjectId(params.eventId);
    }

    if (params.q && params.q.trim()) {
      const searchRegex = new RegExp(params.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ name: searchRegex }, { contactPerson: searchRegex }, { category: searchRegex }];
    }

    if (params.cursor && Types.ObjectId.isValid(params.cursor)) {
      query._id = { $gt: new Types.ObjectId(params.cursor) };
    }

    const sortField = params.sort || "name";
    const sortOrder = params.order === "desc" ? -1 : 1;
    const sortObj: Record<string, 1 | -1> = { [sortField]: sortOrder, _id: 1 };

    const totalCount = await VendorModel.countDocuments(query);
    const vendors = await VendorModel.find(query)
      .sort(sortObj)
      .limit(limit + 1)
      .exec();

    let hasMore = false;
    let nextCursor: string | undefined = undefined;

    if (vendors.length > limit) {
      hasMore = true;
      vendors.pop();
      const lastItem = vendors[vendors.length - 1];
      nextCursor = lastItem._id.toString();
    }

    return { vendors, nextCursor, hasMore, totalCount };
  }

  /**
   * Finds a vendor by ID strictly scoped to weddingId.
   */
  static async findByIdAndWeddingId({
    weddingId,
    vendorId,
  }: {
    weddingId: string | Types.ObjectId;
    vendorId: string | Types.ObjectId;
  }): Promise<IVendor | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(vendorId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const vId = typeof vendorId === "string" ? new Types.ObjectId(vendorId) : vendorId;

    return await VendorModel.findOne({ _id: vId, weddingId: wId }).exec();
  }

  /**
   * Finds multiple vendors by IDs strictly scoped to weddingId.
   */
  static async findVendorsByIdsAndWeddingId({
    weddingId,
    vendorIds,
  }: {
    weddingId: string | Types.ObjectId;
    vendorIds: (string | Types.ObjectId)[];
  }): Promise<IVendor[]> {
    if (!Types.ObjectId.isValid(weddingId) || !vendorIds.length) {
      return [];
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const validVendorIds = vendorIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => (typeof id === "string" ? new Types.ObjectId(id) : id));

    return await VendorModel.find({ _id: { $in: validVendorIds }, weddingId: wId }).exec();
  }

  /**
   * Updates a vendor document strictly scoped to weddingId and vendorId.
   */
  static async updateByIdAndWeddingId({
    weddingId,
    vendorId,
    updateData,
  }: {
    weddingId: string | Types.ObjectId;
    vendorId: string | Types.ObjectId;
    updateData: UpdateVendorParams;
  }): Promise<IVendor | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(vendorId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const vId = typeof vendorId === "string" ? new Types.ObjectId(vendorId) : vendorId;

    return await VendorModel.findOneAndUpdate(
      { _id: vId, weddingId: wId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Deletes a vendor document strictly scoped to weddingId and vendorId.
   */
  static async deleteByIdAndWeddingId({
    weddingId,
    vendorId,
  }: {
    weddingId: string | Types.ObjectId;
    vendorId: string | Types.ObjectId;
  }): Promise<boolean> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(vendorId)) {
      return false;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const vId = typeof vendorId === "string" ? new Types.ObjectId(vendorId) : vendorId;

    const res = await VendorModel.deleteOne({ _id: vId, weddingId: wId }).exec();
    return res.deletedCount > 0;
  }

  /**
   * Counts active vendors in a wedding.
   */
  static async countVendors(weddingId: string | Types.ObjectId): Promise<number> {
    if (!Types.ObjectId.isValid(weddingId)) return 0;
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    return await VendorModel.countDocuments({ weddingId: wId });
  }
}
