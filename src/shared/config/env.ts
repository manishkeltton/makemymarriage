import "server-only";
import { z } from "zod";

const loggingSchema = z.object({
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});
const appSchema = loggingSchema.extend({
  APP_ORIGIN: z
    .url()
    .refine((value) => {
      let url: URL;
      try {
        url = new URL(value);
      } catch {
        return false;
      }
      return (
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        url.pathname === "/" &&
        !url.search &&
        !url.hash
      );
    })
    .transform((value) => new URL(value).origin),
});
const databaseSchema = z.object({
  MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\/\S+$/),
  MONGODB_DB_NAME: z.string().trim().min(1),
});

function parseEnv<T>(
  schema: z.ZodType<T>,
  source: Record<string, string | undefined>,
): T {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const names = [
      ...new Set(parsed.error.issues.map((issue) => issue.path.join("."))),
    ];
    throw new Error(`Invalid environment variables: ${names.join(", ")}`);
  }
  return parsed.data;
}

export function getAppEnv(
  source: Record<string, string | undefined> = process.env,
) {
  return parseEnv(appSchema, {
    ...source,
    APP_ORIGIN:
      source.APP_ORIGIN ??
      (source.NODE_ENV === "production" ? undefined : "http://localhost:3000"),
  });
}
export function getLoggingEnv(
  source: Record<string, string | undefined> = process.env,
) {
  return parseEnv(loggingSchema, source);
}
export function getDatabaseEnv(
  source: Record<string, string | undefined> = process.env,
) {
  return parseEnv(databaseSchema, source);
}
