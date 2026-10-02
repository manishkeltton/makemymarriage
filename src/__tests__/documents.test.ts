import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import { DocumentService } from "../modules/documents/services/document.service";
import { DocumentRepository } from "../modules/documents/repositories/document.repository";
import { DocumentModel, IDocument } from "../modules/documents/models/document.model";
import { MediaModel } from "../modules/media/models/media.model";
import { StorageService } from "../modules/documents/services/storage.service";
import { EntitlementService } from "../modules/billing/services/entitlement.service";
import { TeamAuthorization } from "../modules/team/authorization/team.auth";
import { EventRepository } from "../modules/events/repositories/event.repository";
import { ExpenseRepository } from "../modules/expenses/repositories/expense.repository";
import { documentIntentSchema, createDocumentSchema } from "../modules/documents/validation/document.schemas";
import { toDocumentDTO } from "../modules/documents/dto/document.dto";
import { AppError } from "../shared/errors/app-error";

vi.mock("../lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("../lib/db/models/User", () => ({
  User: {
    findById: vi.fn().mockResolvedValue({ _id: "user123", name: "Ananya Sharma" }),
    find: vi.fn().mockResolvedValue([{ _id: "user123", name: "Ananya Sharma" }]),
  },
}));

vi.mock("../modules/team/authorization/team.auth", () => ({
  TeamAuthorization: {
    requireWeddingMembership: vi.fn(),
  },
}));

vi.mock("../modules/billing/services/entitlement.service", () => ({
  EntitlementService: {
    assertCanUploadMedia: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../modules/documents/services/storage.service", () => ({
  StorageService: {
    objectKey: vi.fn((path, mime) => `cloudinary:${path}.${mime.includes("pdf") ? "pdf" : "jpg"}`),
    uploadUrl: vi.fn().mockResolvedValue({
      uploadUrl: "https://api.cloudinary.com/v1_1/demo/auto/upload",
      uploadMethod: "POST",
      uploadFields: { api_key: "123", signature: "sig123" },
    }),
    verifyAndSeal: vi.fn((uploadKey, objectKey, mime, size, expectedWeddingId) => {
      if (uploadKey !== objectKey) {
        throw new AppError("FORBIDDEN", "Upload key does not match the stored asset", 403);
      }
      if (expectedWeddingId && !objectKey.includes(`weddings/${expectedWeddingId}/`)) {
        throw new AppError("FORBIDDEN", "Object key does not belong to this wedding workspace", 403);
      }
      return Promise.resolve(true);
    }),
    accessUrl: vi.fn().mockResolvedValue("https://res.cloudinary.com/demo/image/upload/s--signed--/sample.pdf"),
    remove: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("../modules/events/repositories/event.repository", () => ({
  EventRepository: {
    findByIdAndWeddingId: vi.fn(),
  },
}));

vi.mock("../modules/tasks/repositories/task.repository", () => ({
  TaskRepository: {
    findByIdAndWeddingId: vi.fn(),
  },
}));

vi.mock("../modules/vendors/repositories/vendor.repository", () => ({
  VendorRepository: {
    findByIdAndWeddingId: vi.fn(),
  },
}));

vi.mock("../modules/expenses/repositories/expense.repository", () => ({
  ExpenseRepository: {
    findByIdAndWeddingId: vi.fn(),
  },
}));

vi.mock("../modules/documents/models/document.model", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../modules/documents/models/document.model")>();
  return {
    ...actual,
    DocumentModel: {
      findOne: vi.fn().mockResolvedValue(null),
      countDocuments: vi.fn().mockResolvedValue(0),
    },
  };
});

vi.mock("../modules/media/models/media.model", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../modules/media/models/media.model")>();
  return {
    ...actual,
    MediaModel: {
      countDocuments: vi.fn().mockResolvedValue(0),
    },
  };
});

describe("V1 Documents & Attachments Vault Integration Tests", () => {
  const fakeWeddingId = new Types.ObjectId().toString();
  const fakeUserId = new Types.ObjectId().toString();
  const fakeDocId = new Types.ObjectId().toString();
  const fakeEntityId = new Types.ObjectId().toString();

  const mockAdminMember = {
    userId: fakeUserId,
    weddingId: fakeWeddingId,
    role: "ADMIN",
    status: "ACTIVE",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Zod Validation Schemas", () => {
    it("should validate a valid document intent input", () => {
      const input = {
        title: "Leela Palace Contract",
        type: "CONTRACT",
        mimeType: "application/pdf",
        sizeBytes: 1048576,
        relatedTo: {
          type: "VENDOR",
          id: fakeEntityId,
        },
      };
      const result = documentIntentSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty document title or invalid size in intent schema", () => {
      const invalidInput = {
        title: "   ",
        mimeType: "application/pdf",
        sizeBytes: -100,
      };
      const result = documentIntentSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should validate create document completion payload", () => {
      const input = {
        title: "Catering Deposit Invoice",
        type: "INVOICE",
        uploadKey: "weddings/w123/docs/123.pdf",
        objectKey: "cloudinary:weddings/w123/docs/123.pdf",
        mimeType: "application/pdf",
        fileSize: 524288,
        relatedTo: {
          type: "EXPENSE",
          id: fakeEntityId,
        },
      };
      const result = createDocumentSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("2. Document DTO & Legacy File Handling", () => {
    it("should calculate isUnavailable: true for legacy document records lacking Cloudinary binary key", () => {
      const legacyDoc = {
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        type: "OTHER",
        title: "Legacy Text Note",
        uploadedBy: new Types.ObjectId(fakeUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as IDocument;

      const dto = toDocumentDTO(legacyDoc);
      expect(dto.isUnavailable).toBe(true);
      expect(dto.accessUrl).toBeNull();
    });

    it("should calculate isUnavailable: false when valid binary file key is present", () => {
      const validDoc = {
        _id: new Types.ObjectId(),
        weddingId: new Types.ObjectId(fakeWeddingId),
        type: "CONTRACT",
        title: "Signed Venue Contract",
        fileKey: "cloudinary:weddings/123/docs/venue.pdf",
        mimeType: "application/pdf",
        fileSize: 204800,
        uploadedBy: new Types.ObjectId(fakeUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as IDocument;

      const dto = toDocumentDTO(validDoc);
      expect(dto.isUnavailable).toBe(false);
    });
  });

  describe("3. Document Upload Intent & Entitlements", () => {
    it("should generate upload intent for authorized team member", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(mockAdminMember as never);

      const result = await DocumentService.generateUploadIntent({
        weddingId: fakeWeddingId,
        userId: fakeUserId,
        payload: {
          title: "Haldi Decor Quotation",
          type: "QUOTATION",
          mimeType: "application/pdf",
          sizeBytes: 200000,
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.uploadUrl).toBeDefined();
      expect(result.data?.objectKey).toBeDefined();
      expect(EntitlementService.assertCanUploadMedia).toHaveBeenCalledWith(fakeWeddingId, 200000, "application/pdf");
    });

    it("should reject upload intent if caller is not a wedding workspace member", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(null);

      const result = await DocumentService.generateUploadIntent({
        weddingId: fakeWeddingId,
        userId: fakeUserId,
        payload: {
          title: "Unauthorized Upload",
          type: "OTHER",
          mimeType: "application/pdf",
          sizeBytes: 100000,
        },
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("FORBIDDEN");
    });
  });

  describe("4. Document Creation & 4 Attachment Contexts (Same-Wedding Validation)", () => {
    it("should create document linked to EVENT after verifying Cloudinary seal", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(mockAdminMember as never);
      (EventRepository.findByIdAndWeddingId as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: fakeEntityId });
      (DocumentModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const mockCreatedDoc = {
        _id: new Types.ObjectId(fakeDocId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        type: "MENU",
        relatedTo: { type: "EVENT", id: new Types.ObjectId(fakeEntityId) },
        title: "Sangeet Ceremonial Menu",
        fileKey: `cloudinary:weddings/${fakeWeddingId}/docs/sangeet.pdf`,
        mimeType: "application/pdf",
        fileSize: 400000,
        uploadedBy: new Types.ObjectId(fakeUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(DocumentRepository, "create").mockResolvedValue(mockCreatedDoc as unknown as IDocument);

      const result = await DocumentService.createDocument({
        weddingId: fakeWeddingId,
        userId: fakeUserId,
        payload: {
          title: "Sangeet Ceremonial Menu",
          type: "MENU",
          uploadKey: `cloudinary:weddings/${fakeWeddingId}/docs/sangeet.pdf`,
          objectKey: `cloudinary:weddings/${fakeWeddingId}/docs/sangeet.pdf`,
          mimeType: "application/pdf",
          fileSize: 400000,
          relatedTo: { type: "EVENT", id: fakeEntityId },
        },
      });

      expect(result.success).toBe(true);
      expect(StorageService.verifyAndSeal).toHaveBeenCalledWith(
        `cloudinary:weddings/${fakeWeddingId}/docs/sangeet.pdf`,
        `cloudinary:weddings/${fakeWeddingId}/docs/sangeet.pdf`,
        "application/pdf",
        400000,
        fakeWeddingId
      );
      expect(EventRepository.findByIdAndWeddingId).toHaveBeenCalledWith({
        weddingId: fakeWeddingId,
        eventId: fakeEntityId,
      });
      expect(result.data?.relatedTo?.type).toBe("EVENT");
    });

    it("should reject document creation if referenced EXPENSE belongs to a different wedding", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(mockAdminMember as never);
      (ExpenseRepository.findByIdAndWeddingId as ReturnType<typeof vi.fn>).mockResolvedValue(null); // Not found in this wedding!

      const result = await DocumentService.createDocument({
        weddingId: fakeWeddingId,
        userId: fakeUserId,
        payload: {
          title: "Foreign Expense Receipt",
          type: "RECEIPT",
          uploadKey: `cloudinary:weddings/${fakeWeddingId}/docs/receipt.jpg`,
          objectKey: `cloudinary:weddings/${fakeWeddingId}/docs/receipt.jpg`,
          mimeType: "image/jpeg",
          fileSize: 150000,
          relatedTo: { type: "EXPENSE", id: fakeEntityId },
        },
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("INVALID_REFERENCE");
    });
  });

  describe("5. Signed Access URLs", () => {
    it("should return a signed access URL for valid document file", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(mockAdminMember as never);

      const mockDoc = {
        _id: new Types.ObjectId(fakeDocId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        fileKey: "cloudinary:weddings/123/docs/contract.pdf",
      };

      vi.spyOn(DocumentRepository, "findByIdAndWeddingId").mockResolvedValue(mockDoc as unknown as IDocument);

      const result = await DocumentService.getDocumentAccessUrl({
        weddingId: fakeWeddingId,
        documentId: fakeDocId,
        userId: fakeUserId,
      });

      expect(result.success).toBe(true);
      expect(result.data?.accessUrl).toBe("https://res.cloudinary.com/demo/image/upload/s--signed--/sample.pdf");
      expect(result.data?.isUnavailable).toBe(false);
      expect(StorageService.accessUrl).toHaveBeenCalledWith("cloudinary:weddings/123/docs/contract.pdf");
    });
  });

  describe("6. Reference-Aware Deletion", () => {
    it("should delete document and call StorageService.remove when fileKey is unreferenced elsewhere", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(mockAdminMember as never);

      const mockTargetDoc = {
        _id: new Types.ObjectId(fakeDocId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        fileKey: "cloudinary:weddings/123/docs/unique.pdf",
        uploadedBy: new Types.ObjectId(fakeUserId),
      };

      vi.spyOn(DocumentRepository, "findByIdAndWeddingId").mockResolvedValue(mockTargetDoc as unknown as IDocument);
      vi.spyOn(DocumentRepository, "deleteByIdAndWeddingId").mockResolvedValue(true);

      (DocumentModel.countDocuments as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (MediaModel.countDocuments as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const result = await DocumentService.deleteDocument({
        weddingId: fakeWeddingId,
        documentId: fakeDocId,
        userId: fakeUserId,
      });

      expect(result.success).toBe(true);
      expect(StorageService.remove).toHaveBeenCalledWith("cloudinary:weddings/123/docs/unique.pdf");
    });

    it("should delete document record but PRESERVE Cloudinary asset if fileKey is shared with another document", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(mockAdminMember as never);

      const mockTargetDoc = {
        _id: new Types.ObjectId(fakeDocId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        fileKey: "cloudinary:weddings/123/docs/shared.pdf",
        uploadedBy: new Types.ObjectId(fakeUserId),
      };

      vi.spyOn(DocumentRepository, "findByIdAndWeddingId").mockResolvedValue(mockTargetDoc as unknown as IDocument);
      vi.spyOn(DocumentRepository, "deleteByIdAndWeddingId").mockResolvedValue(true);

      // Shared reference exists in DocumentModel!
      (DocumentModel.countDocuments as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const result = await DocumentService.deleteDocument({
        weddingId: fakeWeddingId,
        documentId: fakeDocId,
        userId: fakeUserId,
      });

      expect(result.success).toBe(true);
      expect(StorageService.remove).not.toHaveBeenCalled();
    });
  });

  describe("7. Regression Tests for Security & Reliability Findings", () => {
    it("DOCUMENTS-P1-01: should reject document creation if objectKey belongs to a different wedding tenant", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(mockAdminMember as never);

      const otherWeddingId = new Types.ObjectId().toString();
      const crossTenantObjectKey = StorageService.objectKey(`weddings/${otherWeddingId}/documents/secret.pdf`, "application/pdf");

      const result = await DocumentService.createDocument({
        weddingId: fakeWeddingId,
        userId: fakeUserId,
        payload: {
          title: "Hijacked Secret Contract",
          type: "CONTRACT",
          uploadKey: crossTenantObjectKey,
          objectKey: crossTenantObjectKey,
          mimeType: "application/pdf",
          fileSize: 1048576,
        },
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("FORBIDDEN");
      expect(result.error).toContain("does not belong to this wedding workspace");
    });
  });

  describe("8. Document Single-Record Retrieval (getDocumentById)", () => {
    it("SRN-001: should return document DTO when found and authorized", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(mockAdminMember as never);

      const mockDoc = {
        _id: new Types.ObjectId(fakeDocId),
        weddingId: new Types.ObjectId(fakeWeddingId),
        title: "Catering Contract",
        type: "CONTRACT",
        fileKey: "cloudinary:weddings/123/docs/contract.pdf",
        mimeType: "application/pdf",
        fileSize: 2048576,
        uploadedBy: new Types.ObjectId(fakeUserId),
        parentType: "NONE",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(DocumentRepository, "findByIdAndWeddingId").mockResolvedValue(mockDoc as unknown as IDocument);

      const result = await DocumentService.getDocumentById({
        weddingId: fakeWeddingId,
        documentId: fakeDocId,
        userId: fakeUserId,
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(fakeDocId);
      expect(result.data?.title).toBe("Catering Contract");
    });

    it("SRN-001: should return NOT_FOUND error when document does not exist", async () => {
      vi.spyOn(TeamAuthorization, "requireWeddingMembership").mockResolvedValue(mockAdminMember as never);
      vi.spyOn(DocumentRepository, "findByIdAndWeddingId").mockResolvedValue(null);

      const result = await DocumentService.getDocumentById({
        weddingId: fakeWeddingId,
        documentId: fakeDocId,
        userId: fakeUserId,
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("NOT_FOUND");
    });
  });
});
