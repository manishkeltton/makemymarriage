import "server-only";
import { randomUUID } from "node:crypto";
import { getLoggingEnv } from "@/shared/config/env";

type Level = "debug" | "info" | "warn" | "error";
type LogFields = {
  requestId?: string;
  method?: string;
  route?: string;
  status?: number;
  durationMs?: number;
  userId?: string;
  weddingId?: string;
  errorCode?: string;
  errorKind?:
    | "application"
    | "validation"
    | "type"
    | "range"
    | "syntax"
    | "error"
    | "non-error";
};
const levels: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export function requestId(value: string | null): string {
  return value && /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : randomUUID();
}

export function log(level: Level, event: string, fields: LogFields = {}): void {
  const minimum = getLoggingEnv().LOG_LEVEL;
  if (levels[level] < levels[minimum]) return;
  // Explicit allowlist: never serialize requests, URLs, error objects, or arbitrary fields.
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event,
    requestId: fields.requestId,
    method: fields.method,
    route: fields.route,
    status: fields.status,
    durationMs: fields.durationMs,
    userId: fields.userId,
    weddingId: fields.weddingId,
    errorCode: fields.errorCode,
    errorKind: fields.errorKind,
  };
  const write = level === "error" ? console.error : console.log;
  write(JSON.stringify(record));
}
