import { z } from "zod";
import { AppError } from "@/shared/errors/app-error";

type Pagination = { nextCursor: string | null; hasMore: boolean };
export function success<T>(data: T, status = 200, meta?: Pagination): Response {
  return Response.json(
    { success: true, data, ...(meta ? { meta } : {}) },
    { status },
  );
}
export function noContent(): Response {
  return new Response(null, { status: 204 });
}
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof z.ZodError) {
    const fields: Record<string, string[]> = Object.create(null);
    for (const issue of error.issues) {
      const path = issue.path.join(".") || "_root";
      (fields[path] ??= []).push(issue.message);
    }
    return new AppError("VALIDATION_ERROR", "Request validation failed", 400, {
      fields,
    });
  }
  return new AppError("INTERNAL_ERROR", "An unexpected error occurred", 500);
}

export function errorResponse(error: AppError, requestId: string): Response {
  return Response.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
      },
    },
    { status: error.status },
  );
}
