import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, "Invalid ObjectId format");

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, "Document title is required").max(200, "Title is too long"),
  type: z
    .enum(["CONTRACT", "INVOICE", "RECEIPT", "QUOTATION", "MENU", "OTHER"])
    .optional()
    .default("OTHER"),
  relatedTo: z
    .object({
      type: z.enum(["EVENT", "TASK", "VENDOR", "EXPENSE"]),
      id: objectIdSchema,
    })
    .optional(),
  mediaId: objectIdSchema.optional(),
  fileKey: z.string().trim().optional(),
  mimeType: z.string().trim().optional(),
  fileSize: z.number().nonnegative().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
