import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { DocumentRepository } from "../repositories/document.repository";
import { DocumentRelatedType } from "../models/document.model";
import { DocumentDTO, toDocumentDTO } from "../dto/document.dto";
import { CreateDocumentInput } from "../validation/document.schemas";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { EventRepository } from "@/modules/events/repositories/event.repository";
import { TaskRepository } from "@/modules/tasks/repositories/task.repository";

export class DocumentService {
  /**
   * Creates a document in a wedding workspace.
   */
  static async createDocument({
    weddingId,
    userId,
    payload,
  }: {
    weddingId: string;
    userId: string;
    payload: CreateDocumentInput;
  }): Promise<{ success: boolean; data?: DocumentDTO; error?: string; code?: string }> {
    await connectToDatabase();

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    if (!member) {
      return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
    }

    // Same-wedding reference validation for relatedTo entity
    if (payload.relatedTo) {
      const { type, id } = payload.relatedTo;
      if (type === "EVENT") {
        const validEvent = await EventRepository.findByIdAndWeddingId({ weddingId, eventId: id });
        if (!validEvent) {
          return { success: false, error: "Referenced event does not belong to this wedding", code: "INVALID_REFERENCE" };
        }
      } else if (type === "TASK") {
        const validTask = await TaskRepository.findByIdAndWeddingId({ weddingId, taskId: id });
        if (!validTask) {
          return { success: false, error: "Referenced task does not belong to this wedding", code: "INVALID_REFERENCE" };
        }
      }
    }

    try {
      const wId = new Types.ObjectId(weddingId);
      const uId = new Types.ObjectId(userId);

      const doc = await DocumentRepository.create({
        weddingId: wId,
        type: payload.type || "OTHER",
        relatedTo: payload.relatedTo
          ? {
              type: payload.relatedTo.type,
              id: new Types.ObjectId(payload.relatedTo.id),
            }
          : undefined,
        mediaId: payload.mediaId ? new Types.ObjectId(payload.mediaId) : undefined,
        title: payload.title,
        fileKey: payload.fileKey,
        mimeType: payload.mimeType,
        fileSize: payload.fileSize,
        uploadedBy: uId,
      });

      const uploaderDoc = await User.findById(userId);
      return {
        success: true,
        data: toDocumentDTO(doc, { uploaderName: uploaderDoc?.name || "Team Member" }),
      };
    } catch (err: unknown) {
      console.error("Error creating document:", err);
      return { success: false, error: "Failed to create document", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Fetches documents for a wedding workspace with filtering.
   */
  static async getDocuments({
    weddingId,
    userId,
    type,
    relatedType,
    relatedId,
  }: {
    weddingId: string;
    userId: string;
    type?: string;
    relatedType?: string;
    relatedId?: string;
  }): Promise<{ success: boolean; data?: DocumentDTO[]; error?: string; code?: string }> {
    await connectToDatabase();

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    if (!member) {
      return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
    }

    try {
      const docs = await DocumentRepository.findDocumentsByFilters({
        weddingId,
        type: type as "CONTRACT" | "INVOICE" | "RECEIPT" | "QUOTATION" | "MENU" | "OTHER" | undefined,
        relatedType: relatedType as DocumentRelatedType | undefined,
        relatedId,
      });

      // Populate uploader names
      const uploaderIds = Array.from(new Set(docs.map((d) => d.uploadedBy.toString())));
      const uploaders = await User.find({ _id: { $in: uploaderIds } });
      const uploaderMap = new Map(uploaders.map((u) => [u._id.toString(), u.name]));

      const dtos = docs.map((d) =>
        toDocumentDTO(d, { uploaderName: uploaderMap.get(d.uploadedBy.toString()) || "Team Member" })
      );

      return { success: true, data: dtos };
    } catch (err: unknown) {
      console.error("Error fetching documents:", err);
      return { success: false, error: "Failed to fetch documents", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Deletes a document from a wedding workspace.
   */
  static async deleteDocument({
    weddingId,
    documentId,
    userId,
  }: {
    weddingId: string;
    documentId: string;
    userId: string;
  }): Promise<{ success: boolean; error?: string; code?: string }> {
    await connectToDatabase();

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    if (!member) {
      return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
    }

    try {
      const targetDoc = await DocumentRepository.findByIdAndWeddingId({ weddingId, documentId });
      if (!targetDoc) {
        return { success: false, error: "Document not found", code: "NOT_FOUND" };
      }

      // Check permissions: Admin/Manager or uploader
      if (
        member.role !== "ADMIN" &&
        member.role !== "MANAGER" &&
        targetDoc.uploadedBy.toString() !== userId
      ) {
        return { success: false, error: "Only admins, managers, or the uploader can delete this document", code: "FORBIDDEN" };
      }

      const deleted = await DocumentRepository.deleteByIdAndWeddingId({ weddingId, documentId });
      if (!deleted) {
        return { success: false, error: "Failed to delete document", code: "NOT_FOUND" };
      }

      return { success: true };
    } catch (err: unknown) {
      console.error("Error deleting document:", err);
      return { success: false, error: "Failed to delete document", code: "INTERNAL_ERROR" };
    }
  }
}
