import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/makemymarriage";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached!.conn) {
    return cached!.conn;
  }

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/makemymarriage";

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      dbName: process.env.MONGODB_DB_NAME || "MakeMyMarriageDB",
      serverSelectionTimeoutMS: 10000,
    };

    cached!.promise = mongoose.connect(uri, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}
