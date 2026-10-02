import { Types } from "mongoose";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { DocumentRepository } from "../repositories/document.repository";
import { DocumentModel, DocumentRelatedType } from "../models/document.model";
import { DocumentDTO, toDocumentDTO } from "../dto/document.dto";
import { CreateDocumentInput, DocumentIntentInput } from "../validation/document.schemas";
import { TeamAuthorization } from "@/modules/team/authorization/team.auth";
import { EventRepository } from "@/modules/events/repositories/event.repository";
import { TaskRepository } from "@/modules/tasks/repositories/task.repository";
import { VendorRepository } from "@/modules/vendors/repositories/vendor.repository";
import { ExpenseRepository } from "@/modules/expenses/repositories/expense.repository";
import { StorageService } from "./storage.service";
import { uploadPolicy } from "@/shared/storage/upload-policy";
import { EntitlementService } from "@/modules/billing/services/entitlement.service";
import { MediaModel } from "@/modules/media/models/media.model";
import { AppError } from "@/shared/errors/app-error";

export class DocumentService {
  /**
   * Generates a signed upload intent for uploading a document file to Cloudinary.
   */
  static async generateUploadIntent({
    weddingId,
    userId,
    payload,
  }: {
    weddingId: string;
    userId: string;
    payload: DocumentIntentInput;
  }): Promise<{
    success: boolean;
    data?: {
      uploadUrl: string;
      uploadMethod: "POST";
      uploadFields: Record<string, string>;
      objectKey: string;
    };
    error?: string;
    code?: string;
  }> {
    await connectToDatabase();

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    if (!member) {
      return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
    }

    try {
      // Storage quota entitlement check
      await EntitlementService.assertCanUploadMedia(weddingId, payload.sizeBytes, payload.mimeType);

      // Validate file type & size (PDFs and supported images up to 10 MiB)
      const policy = uploadPolicy(payload.mimeType, payload.sizeBytes);

      if (policy.resourceType !== "raw" && policy.resourceType !== "image") {
        return {
          success: false,
          error: "Document Vault only accepts PDF documents and supported images",
          code: "VALIDATION_ERROR",
        };
      }

      const cleanPath = `weddings/${weddingId}/documents/${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const objectKey = StorageService.objectKey(cleanPath, payload.mimeType);
      const intent = await StorageService.uploadUrl(objectKey, payload.mimeType, payload.sizeBytes);

      return {
        success: true,
        data: {
          uploadUrl: intent.uploadUrl,
          uploadMethod: intent.uploadMethod,
          uploadFields: intent.uploadFields,
          objectKey,
        },
      };
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return { success: false, error: err.message, code: err.code };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : "Invalid upload parameters",
        code: "VALIDATION_ERROR",
      };
    }
  }

  /**
   * Creates a verified document record after successful Cloudinary binary upload.
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

    try {
      await EntitlementService.assertCanUploadMedia(weddingId, payload.fileSize, payload.mimeType);

      // Verify uploaded Cloudinary asset metadata and tenant path ownership
      await StorageService.verifyAndSeal(
        payload.uploadKey,
        payload.objectKey,
        payload.mimeType,
        payload.fileSize,
        weddingId
      );

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
        } else if (type === "VENDOR") {
          const validVendor = await VendorRepository.findByIdAndWeddingId({ weddingId, vendorId: id });
          if (!validVendor) {
            return { success: false, error: "Referenced vendor does not belong to this wedding", code: "INVALID_REFERENCE" };
          }
        } else if (type === "EXPENSE") {
          const validExpense = await ExpenseRepository.findByIdAndWeddingId({ weddingId, expenseId: id });
          if (!validExpense) {
            return { success: false, error: "Referenced expense does not belong to this wedding", code: "INVALID_REFERENCE" };
          }
        }
      }

      const wId = new Types.ObjectId(weddingId);
      const uId = new Types.ObjectId(userId);

      // Idempotency check: if document with objectKey already exists, return existing DTO
      const existingDoc = await DocumentModel.findOne({ weddingId: wId, fileKey: payload.objectKey });
      if (existingDoc) {
        const uploaderDoc = await User.findById(existingDoc.uploadedBy);
        return {
          success: true,
          data: toDocumentDTO(existingDoc, { uploaderName: uploaderDoc?.name || "Team Member" }),
        };
      }

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
        fileKey: payload.objectKey,
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
      if (err instanceof AppError) {
        return { success: false, error: err.message, code: err.code };
      }
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

      // Batch check parent access & orphan policy
      const eventParentIds = new Set<string>();
      const taskParentIds = new Set<string>();
      const vendorParentIds = new Set<string>();
      const expenseParentIds = new Set<string>();

      for (const d of docs) {
        if (d.relatedTo?.type === "EVENT" && d.relatedTo.id) {
          eventParentIds.add(d.relatedTo.id.toString());
        } else if (d.relatedTo?.type === "TASK" && d.relatedTo.id) {
          taskParentIds.add(d.relatedTo.id.toString());
        } else if (d.relatedTo?.type === "VENDOR" && d.relatedTo.id) {
          vendorParentIds.add(d.relatedTo.id.toString());
        } else if (d.relatedTo?.type === "EXPENSE" && d.relatedTo.id) {
          expenseParentIds.add(d.relatedTo.id.toString());
        }
      }

      const [canReadVendors, canReadFinance] = await Promise.all([
        TeamAuthorization.requireWeddingPermission(weddingId, userId, "vendors"),
        TeamAuthorization.requireWeddingPermission(weddingId, userId, "finance"),
      ]);

      const [eventsList, tasksList, vendorsList, expensesList] = await Promise.all([
        eventParentIds.size > 0
          ? EventRepository.findEventsByWeddingId({ weddingId })
          : [],
        taskParentIds.size > 0
          ? TaskRepository.findTasksByFilters({ weddingId, limit: 10000 }).then((r) => r.tasks)
          : [],
        vendorParentIds.size > 0 && canReadVendors
          ? VendorRepository.findVendorsByFilters({ weddingId, limit: 10000 }).then((r) => r.vendors)
          : [],
        expenseParentIds.size > 0 && canReadFinance
          ? ExpenseRepository.findExpensesByFilters({ weddingId, limit: 10000 }).then((r) => r.expenses)
          : [],
      ]);

      const parentMaps = {
        events: new Map(eventsList.map((e) => [e._id.toString(), e])),
        tasks: new Map(tasksList.map((t) => [t._id.toString(), t])),
        vendors: new Map(vendorsList.map((v) => [v._id.toString(), v])),
        expenses: new Map(expensesList.map((ex) => [ex._id.toString(), ex])),
      };

      const authorizedDocs = docs.filter((d) =>
        TeamAuthorization.canAccessDocument(member, d, parentMaps)
      );

      // Populate uploader names
      const uploaderIds = Array.from(new Set(authorizedDocs.map((d) => d.uploadedBy.toString())));
      const uploaders = await User.find({ _id: { $in: uploaderIds } });
      const uploaderMap = new Map(uploaders.map((u) => [u._id.toString(), u.name]));

      const dtos = authorizedDocs.map((d) =>
        toDocumentDTO(d, { uploaderName: uploaderMap.get(d.uploadedBy.toString()) || "Team Member" })
      );

      return { success: true, data: dtos };
    } catch (err: unknown) {
      console.error("Error fetching documents:", err);
      return { success: false, error: "Failed to fetch documents", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Fetches a single document by ID with parent access & tenant authorization verification.
   */
  static async getDocumentById({
    weddingId,
    documentId,
    userId,
  }: {
    weddingId: string;
    documentId: string;
    userId: string;
  }): Promise<{ success: boolean; data?: DocumentDTO; error?: string; code?: string }> {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(weddingId) || !Types.ObjectId.isValid(documentId) || !Types.ObjectId.isValid(userId)) {
      return { success: false, error: "Invalid ID format", code: "INVALID_ID" };
    }

    try {
      const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
      if (!member) {
        return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
      }

      const doc = await DocumentRepository.findByIdAndWeddingId({ weddingId, documentId });
      if (!doc) {
        return { success: false, error: "Document not found", code: "NOT_FOUND" };
      }

      // Verify parent access & orphan policy
      if (doc.relatedTo && doc.relatedTo.type && doc.relatedTo.id) {
        const parentIdStr = doc.relatedTo.id.toString();
        const parentType = doc.relatedTo.type;

        let isParentAccessible = false;

        if (parentType === "EVENT") {
          const parentEvent = await EventRepository.findByIdAndWeddingId({ weddingId, eventId: parentIdStr });
          if (parentEvent && TeamAuthorization.canAccessEventId(member, parentIdStr)) {
            isParentAccessible = true;
          }
        } else if (parentType === "TASK") {
          const parentTask = await TaskRepository.findByIdAndWeddingId({ weddingId, taskId: parentIdStr });
          if (parentTask && TeamAuthorization.canAccessTask(member, parentTask)) {
            isParentAccessible = true;
          }
        } else if (parentType === "VENDOR") {
          const parentVendor = await VendorRepository.findByIdAndWeddingId({ weddingId, vendorId: parentIdStr });
          if (parentVendor && TeamAuthorization.canAccessVendor(member, parentVendor)) {
            isParentAccessible = true;
          }
        } else if (parentType === "EXPENSE") {
          const parentExpense = await ExpenseRepository.findByIdAndWeddingId({ weddingId, expenseId: parentIdStr });
          if (parentExpense && TeamAuthorization.canAccessExpense(member, parentExpense)) {
            isParentAccessible = true;
          }
        }

        if (!isParentAccessible) {
          return { success: false, error: "Access denied to referenced document parent", code: "FORBIDDEN" };
        }
      }

      const uploader = await User.findById(doc.uploadedBy);

      return {
        success: true,
        data: toDocumentDTO(doc, { uploaderName: uploader?.name || "Team Member" }),
      };
    } catch (err: unknown) {
      console.error("Error fetching document by ID:", err);
      return { success: false, error: "Failed to fetch document", code: "INTERNAL_ERROR" };
    }
  }

  /**
   * Generates a short-lived signed access URL for viewing/downloading a document.
   */
  static async getDocumentAccessUrl({
    weddingId,
    documentId,
    userId,
  }: {
    weddingId: string;
    documentId: string;
    userId: string;
  }): Promise<{ success: boolean; data?: { accessUrl: string | null; isUnavailable: boolean }; error?: string; code?: string }> {
    await connectToDatabase();

    const member = await TeamAuthorization.requireWeddingMembership(weddingId, userId);
    if (!member) {
      return { success: false, error: "Access denied to wedding workspace", code: "FORBIDDEN" };
    }

    const doc = await DocumentRepository.findByIdAndWeddingId({ weddingId, documentId });
    if (!doc) {
      return { success: false, error: "Document not found", code: "NOT_FOUND" };
    }

    // Verify parent access & orphan policy
    if (doc.relatedTo && doc.relatedTo.type && doc.relatedTo.id) {
      const parentIdStr = doc.relatedTo.id.toString();
      const parentType = doc.relatedTo.type;

      let isParentAccessible = false;

      if (parentType === "EVENT") {
        const parentEvent = await EventRepository.findByIdAndWeddingId({ weddingId, eventId: parentIdStr });
        if (parentEvent && TeamAuthorization.canAccessEventId(member, parentIdStr)) {
          isParentAccessible = true;
        }
      } else if (parentType === "TASK") {
        const parentTask = await TaskRepository.findByIdAndWeddingId({ weddingId, taskId: parentIdStr });
        if (parentTask && TeamAuthorization.canAccessTask(member, parentTask)) {
          isParentAccessible = true;
        }
      } else if (parentType === "VENDOR") {
        const parentVendor = await VendorRepository.findByIdAndWeddingId({ weddingId, vendorId: parentIdStr });
        if (parentVendor && TeamAuthorization.canAccessVendor(member, parentVendor)) {
          isParentAccessible = true;
        }
      } else if (parentType === "EXPENSE") {
        const parentExpense = await ExpenseRepository.findByIdAndWeddingId({ weddingId, expenseId: parentIdStr });
        if (parentExpense && TeamAuthorization.canAccessExpense(member, parentExpense)) {
          isParentAccessible = true;
        }
      }

      if (!isParentAccessible) {
        return { success: false, error: "Access denied to referenced document parent", code: "FORBIDDEN" };
      }
    }

    if (!doc.fileKey || (!doc.fileKey.startsWith("cloudinary:") && !process.env.R2_BUCKET_NAME)) {
      return {
        success: true,
        data: { accessUrl: null, isUnavailable: true },
      };
    }

    try {
      const accessUrl = await StorageService.accessUrl(doc.fileKey);
      return {
        success: true,
        data: { accessUrl, isUnavailable: false },
      };
    } catch (err) {
      console.error("Error generating access URL for document:", err);
      return {
        success: true,
        data: { accessUrl: null, isUnavailable: true },
      };
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

      const fileKey = targetDoc.fileKey;

      const deleted = await DocumentRepository.deleteByIdAndWeddingId({ weddingId, documentId });
      if (!deleted) {
        return { success: false, error: "Failed to delete document", code: "NOT_FOUND" };
      }

      // Reference-aware asset cleanup: check if fileKey is referenced elsewhere before removing storage asset
      if (fileKey && fileKey.startsWith("cloudinary:")) {
        const otherDocsCount = await DocumentModel.countDocuments({ fileKey });
        const mediaCount = await MediaModel.countDocuments({ fileKey });
        if (otherDocsCount === 0 && mediaCount === 0) {
          try {
            await StorageService.remove(fileKey);
          } catch (err) {
            console.error("Error deleting underlying storage asset:", err);
          }
        }
      }

      return { success: true };
    } catch (err: unknown) {
      console.error("Error deleting document:", err);
      return { success: false, error: "Failed to delete document", code: "INTERNAL_ERROR" };
    }
  }
}
