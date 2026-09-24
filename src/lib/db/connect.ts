import mongoose from "mongoose";

function getMongoUri(): string {
  return (
    process.env.MONGODB_URI ||
    "mongodb+srv://kumarmanishgkv_db_user:rOBMahKdCKNV1jZd@makemymarriagecluster0.v60kxkl.mongodb.net"
  );
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
  if (cached!.conn && mongoose.connection.readyState === 1) {
    return cached!.conn;
  }

  const uri = getMongoUri();

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      dbName: process.env.MONGODB_DB_NAME || "MakeMyMarriageDB",
      serverSelectionTimeoutMS: 15000,
    };

    const connectWithRetry = async (retries = 3, delay = 1000): Promise<typeof mongoose> => {
      try {
        return await mongoose.connect(uri, opts);
      } catch (err) {
        if (retries > 0) {
          await new Promise((res) => setTimeout(res, delay));
          return connectWithRetry(retries - 1, delay * 1.5);
        }
        throw err;
      }
    };

    cached!.promise = connectWithRetry();
  }
  
  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}
