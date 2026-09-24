import { connectToDatabase } from "../db/connect";
import { RateLimit } from "../db/models/RateLimit";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

/**
 * Basic MongoDB-backed rate limiter for API routes.
 * Relies on a TTL index on `expiresAt` for automatic cleanup.
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  await connectToDatabase();

  const key = `${action}:${identifier}`;
  const now = new Date();
  
  // Find or create rate limit record
  let record = await RateLimit.findOne({ key });
  
  if (!record) {
    record = await RateLimit.create({
      key,
      count: 1,
      expiresAt: new Date(now.getTime() + windowMs),
    });
    
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - 1),
      reset: record.expiresAt,
    };
  }
  
  // If record exists but is expired (and TTL hasn't cleaned it yet)
  if (record.expiresAt < now) {
    record.count = 1;
    record.expiresAt = new Date(now.getTime() + windowMs);
    await record.save();
    
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - 1),
      reset: record.expiresAt,
    };
  }
  
  // Increment count
  record.count += 1;
  await record.save();
  
  return {
    success: record.count <= limit,
    limit,
    remaining: Math.max(0, limit - record.count),
    reset: record.expiresAt,
  };
}
