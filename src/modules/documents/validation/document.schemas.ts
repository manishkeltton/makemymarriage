import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, "Invalid ObjectId format");

export const documentIntentSchema = z.object({
  title: z.string().trim().min(1, "Document title is required").max(200, "Title is too long"),
  type: z
    .enum(["CONTRACT", "INVOICE", "RECEIPT", "QUOTATION", "MENU", "OTHER"])
    .optional()
    .default("OTHER"),
  mimeType: z.string().trim().min(1, "MIME type is required"),
  sizeBytes: z.number().int().positive("Size must be positive"),
  relatedTo: z
    .object({
      type: z.enum(["EVENT", "TASK", "VENDOR", "EXPENSE"]),
      id: objectIdSchema,
    })
    .optional(),
});

export type DocumentIntentInput = z.infer<typeof documentIntentSchema>;

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, "Document title is required").max(200, "Title is too long"),
  type: z
    .enum(["CONTRACT", "INVOICE", "RECEIPT", "QUOTATION", "MENU", "OTHER"])
    .optional()
    .default("OTHER"),
  uploadKey: z.string().trim().min(1, "Upload key is required"),
  objectKey: z.string().trim().min(1, "Object key is required"),
  mimeType: z.string().trim().min(1, "MIME type is required"),
  fileSize: z.number().int().positive("File size must be positive"),
  relatedTo: z
    .object({
      type: z.enum(["EVENT", "TASK", "VENDOR", "EXPENSE"]),
      id: objectIdSchema,
    })
    .optional(),
  mediaId: objectIdSchema.optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
