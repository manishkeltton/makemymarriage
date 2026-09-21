import "server-only";
import mongoose from "mongoose";
import { getDatabaseEnv } from "@/shared/config/env";

type ConnectionCache = { pending: Promise<typeof mongoose> | null };
const globalDatabase = globalThis as typeof globalThis & {
  mongooseCache?: ConnectionCache;
};
const cache = (globalDatabase.mongooseCache ??= { pending: null });

export async function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!cache.pending) {
    const env = getDatabaseEnv();
    cache.pending = mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      autoIndex: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
  }
  try {
    return await cache.pending;
  } finally {
    cache.pending = null;
  }
}
