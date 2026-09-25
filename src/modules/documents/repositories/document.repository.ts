import { Types } from "mongoose";
import { DocumentModel, IDocument, DocumentType, DocumentRelatedType } from "../models/document.model";

export interface CreateDocumentParams {
  weddingId: Types.ObjectId;
  type?: DocumentType;
  relatedTo?: {
    type: DocumentRelatedType;
    id: Types.ObjectId;
  };
  mediaId?: Types.ObjectId;
  title: string;
  fileKey?: string;
  mimeType?: string;
  fileSize?: number;
  uploadedBy: Types.ObjectId;
}

export class DocumentRepository {
  /**
   * Creates a new document record.
   */
  static async create(params: CreateDocumentParams): Promise<IDocument> {
    const doc = new DocumentModel({
      weddingId: params.weddingId,
      type: params.type || "OTHER",
      relatedTo: params.relatedTo,
      mediaId: params.mediaId,
      title: params.title,
      fileKey: params.fileKey,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      uploadedBy: params.uploadedBy,
    });

    return await doc.save();
  }

  /**
   * Finds documents for a wedding filtered by type or relatedTo entity.
   */
  static async findDocumentsByFilters({
    weddingId,
    type,
    relatedType,
    relatedId,
  }: {
    weddingId: string | Types.ObjectId;
    type?: DocumentType;
    relatedType?: DocumentRelatedType;
    relatedId?: string | Types.ObjectId;
  }): Promise<IDocument[]> {
    if (!Types.ObjectId.isValid(weddingId)) return [];
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;

    const query: Record<string, unknown> = { weddingId: wId };

    if (type) {
      query.type = type;
    }

    if (relatedType && relatedId && Types.ObjectId.isValid(relatedId)) {
      query["relatedTo.type"] = relatedType;
      query["relatedTo.id"] = typeof relatedId === "string" ? new Types.ObjectId(relatedId) : relatedId;
    }

    return await DocumentModel.find(query).sort({ createdAt: -1 }).exec();
  }

  /**
   * Finds a single document by ID strictly scoped to weddingId.
   */
  static async findByIdAndWeddingId({
    weddingId,
    documentId,
  }: {
    weddingId: string | Types.ObjectId;
    documentId: string | Types.ObjectId;
  }): Promise<IDocument | null> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(documentId)) {
      return null;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const dId = typeof documentId === "string" ? new Types.ObjectId(documentId) : documentId;

    return await DocumentModel.findOne({ _id: dId, weddingId: wId }).exec();
  }

  /**
   * Finds multiple documents by IDs strictly scoped to weddingId.
   */
  static async findDocumentsByIdsAndWeddingId({
    weddingId,
    documentIds,
  }: {
    weddingId: string | Types.ObjectId;
    documentIds: (string | Types.ObjectId)[];
  }): Promise<IDocument[]> {
    if (!Types.ObjectId.isValid(weddingId) || !documentIds.length) {
      return [];
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const validIds = documentIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => (typeof id === "string" ? new Types.ObjectId(id) : id));

    return await DocumentModel.find({ _id: { $in: validIds }, weddingId: wId }).exec();
  }

  /**
   * Deletes a document strictly scoped by weddingId and documentId.
   */
  static async deleteByIdAndWeddingId({
    weddingId,
    documentId,
  }: {
    weddingId: string | Types.ObjectId;
    documentId: string | Types.ObjectId;
  }): Promise<boolean> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(documentId)) {
      return false;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const dId = typeof documentId === "string" ? new Types.ObjectId(documentId) : documentId;

    const res = await DocumentModel.deleteOne({ _id: dId, weddingId: wId }).exec();
    return res.deletedCount > 0;
  }

  /**
   * Counts documents related to an entity.
   */
  static async countDocumentsByRelatedId({
    weddingId,
    relatedType,
    relatedId,
  }: {
    weddingId: string | Types.ObjectId;
    relatedType: DocumentRelatedType;
    relatedId: string | Types.ObjectId;
  }): Promise<number> {
    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(relatedId)) {
      return 0;
    }
    const wId = typeof weddingId === "string" ? new Types.ObjectId(weddingId) : weddingId;
    const rId = typeof relatedId === "string" ? new Types.ObjectId(relatedId) : relatedId;

    return await DocumentModel.countDocuments({
      weddingId: wId,
      "relatedTo.type": relatedType,
      "relatedTo.id": rId,
    });
  }
}
