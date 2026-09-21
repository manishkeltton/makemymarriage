import "server-only";
import { z } from "zod";
import { AppError } from "@/shared/errors/app-error";
import { log, requestId } from "@/shared/logging/logger";
import { errorResponse, normalizeError } from "./responses";

// Fixed categories only: error.name/message/stack/cause may contain secrets.
function errorKind(error: unknown) {
  if (error instanceof AppError) return "application";
  if (error instanceof z.ZodError) return "validation";
  if (error instanceof TypeError) return "type";
  if (error instanceof RangeError) return "range";
  if (error instanceof SyntaxError) return "syntax";
  return error instanceof Error ? "error" : "non-error";
}

// routeTemplate must be a static pattern, never request.url (which may contain tokens).
export async function withRequest(
  request: Request,
  routeTemplate: string,
  handle: (context: { requestId: string }) => Promise<Response>,
): Promise<Response> {
  const id = requestId(request.headers.get("X-Request-Id"));
  const started = performance.now();
  let response: Response;
  let errorCode: string | undefined;
  let diagnosticKind: ReturnType<typeof errorKind> | undefined;
  try {
    response = await handle({ requestId: id });
  } catch (error) {
    const normalized = normalizeError(error);
    response = errorResponse(normalized, id);
    errorCode = normalized.code;
    diagnosticKind = errorKind(error);
  }
  response.headers.set("X-Request-Id", id);
  response.headers.set("Cache-Control", "no-store");
  log(response.status >= 500 ? "error" : "info", "http.request", {
    requestId: id,
    method: request.method,
    route: routeTemplate,
    status: response.status,
    durationMs: Math.round(performance.now() - started),
    errorCode,
    errorKind: diagnosticKind,
  });
  return response;
}
