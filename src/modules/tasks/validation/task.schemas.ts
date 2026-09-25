import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, "Invalid ObjectId format");

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(200, "Title is too long"),
  description: z.string().trim().max(2000, "Description is too long").optional(),
  eventId: objectIdSchema.optional(),
  assignedTo: objectIdSchema.optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional().default("TODO"),
  dueAt: z
    .string()
    .datetime({ message: "dueAt must be a valid ISO 8601 date string" })
    .optional(),
  reminderAt: z
    .string()
    .datetime({ message: "reminderAt must be a valid ISO 8601 date string" })
    .optional(),
  dependencyIds: z.array(objectIdSchema).optional().default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title cannot be empty").max(200, "Title is too long").optional(),
  description: z.string().trim().max(2000, "Description is too long").optional().nullable(),
  eventId: objectIdSchema.optional().nullable(),
  assignedTo: objectIdSchema.optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
  dueAt: z
    .string()
    .datetime({ message: "dueAt must be a valid ISO 8601 date string" })
    .optional()
    .nullable(),
  reminderAt: z
    .string()
    .datetime({ message: "reminderAt must be a valid ISO 8601 date string" })
    .optional()
    .nullable(),
  dependencyIds: z.array(objectIdSchema).optional(),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment body is required").max(5000, "Comment is too long"),
  attachmentIds: z.array(objectIdSchema).optional().default([]),
});

export const generateChecklistSchema = z.object({
  duplicateHandling: z
    .enum(["SKIP_EXISTING", "REPLACE_EXISTING", "ALLOW_DUPLICATES"])
    .optional()
    .default("SKIP_EXISTING"),
  categories: z.array(z.string()).optional(),
});

export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type CreateTaskOutput = z.output<typeof createTaskSchema>;
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;
export type CreateCommentInput = z.input<typeof createCommentSchema>;
export type CreateCommentOutput = z.output<typeof createCommentSchema>;
export type GenerateChecklistInput = z.input<typeof generateChecklistSchema>;
