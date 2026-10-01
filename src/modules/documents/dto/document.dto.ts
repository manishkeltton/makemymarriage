import { IDocument, DocumentType, DocumentRelatedType } from "../models/document.model";
export type { DocumentType, DocumentRelatedType };

export interface DocumentDTO {
  id: string;
  weddingId: string;
  type: DocumentType;
  relatedTo?: {
    type: DocumentRelatedType;
    id: string;
  };
  mediaId?: string;
  title: string;
  fileKey?: string;
  mimeType?: string;
  fileSize?: number;
  uploadedBy: string;
  uploaderName?: string;
  accessUrl?: string | null;
  isUnavailable?: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toDocumentDTO(
  doc: IDocument,
  options?: { uploaderName?: string; accessUrl?: string | null; isUnavailable?: boolean }
): DocumentDTO {
  const d = doc.toObject ? doc.toObject() : doc;

  const key = d.fileKey || doc.fileKey;
  const isUnavailable = options?.isUnavailable ?? (!key || (!key.startsWith("cloudinary:") && !process.env.R2_BUCKET_NAME));

  return {
    id: (d._id || doc._id).toString(),
    weddingId: (d.weddingId || doc.weddingId).toString(),
    type: (d.type || doc.type || "OTHER") as DocumentType,
    relatedTo: d.relatedTo && d.relatedTo.id
      ? {
          type: d.relatedTo.type as DocumentRelatedType,
          id: d.relatedTo.id.toString(),
        }
      : undefined,
    mediaId: d.mediaId || doc.mediaId ? (d.mediaId || doc.mediaId).toString() : undefined,
    title: d.title || doc.title,
    fileKey: key || undefined,
    mimeType: d.mimeType || doc.mimeType || undefined,
    fileSize: d.fileSize || doc.fileSize || undefined,
    uploadedBy: (d.uploadedBy || doc.uploadedBy).toString(),
    uploaderName: options?.uploaderName,
    accessUrl: options?.accessUrl ?? null,
    isUnavailable,
    createdAt:
      (d.createdAt || doc.createdAt) instanceof Date
        ? (d.createdAt || doc.createdAt).toISOString()
        : new Date(d.createdAt || doc.createdAt).toISOString(),
    updatedAt:
      (d.updatedAt || doc.updatedAt) instanceof Date
        ? (d.updatedAt || doc.updatedAt).toISOString()
        : new Date(d.updatedAt || doc.updatedAt).toISOString(),
  };
}
