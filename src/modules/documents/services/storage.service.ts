import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppError } from "@/shared/errors/app-error";
import { uploadPolicy } from "@/shared/storage/upload-policy";

type ResourceType = "image" | "video" | "raw";
type CloudinaryKey = { resourceType: ResourceType; format: string; publicId: string };

function cloudinaryConfig() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new AppError("DEPENDENCY_UNAVAILABLE", "Cloudinary media storage is not configured", 503);
  }
  if (!/^[a-z0-9_-]+$/i.test(CLOUDINARY_CLOUD_NAME)) {
    throw new AppError("DEPENDENCY_UNAVAILABLE", "Cloudinary cloud name is invalid", 503);
  }
  return { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET };
}

function legacyR2Config() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    throw new AppError("DEPENDENCY_UNAVAILABLE", "Legacy R2 storage is not configured", 503);
  }
  return {
    bucket: R2_BUCKET_NAME,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
      maxAttempts: 2,
    }),
  };
}

function signature(params: Record<string, string>, secret: string) {
  const input = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${input}${secret}`).digest("hex");
}

function encodeKey(value: CloudinaryKey) {
  return `cloudinary:${Buffer.from(JSON.stringify(value)).toString("base64url")}`;
}

function parseKey(key: string): CloudinaryKey | null {
  if (!key.startsWith("cloudinary:")) return null;
  try {
    const parsed = JSON.parse(Buffer.from(key.slice(11), "base64url").toString("utf8")) as CloudinaryKey;
    if (!["image", "video", "raw"].includes(parsed.resourceType)) return null;
    if (!/^[a-z0-9]+$/i.test(parsed.format) || !parsed.publicId || parsed.publicId.includes("|")) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function cloudinaryJson(url: string, init: RequestInit, errorMessage: string) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) throw new AppError("MEDIA_NOT_READY", errorMessage, 409, body ?? undefined);
  return body ?? {};
}

export class StorageService {
  static objectKey(path: string, mimeType: string) {
    let policy: ReturnType<typeof uploadPolicy>;
    try {
      policy = uploadPolicy(mimeType, 1);
    } catch (error) {
      throw new AppError("VALIDATION_ERROR", error instanceof Error ? error.message : "Unsupported file type", 400);
    }
    const cleanPath = path.replace(/[^a-zA-Z0-9/_-]+/g, "-").replace(/-+$/g, "");
    const publicId = policy.resourceType === "raw" ? `${cleanPath}.${policy.format}` : cleanPath;
    return encodeKey({ resourceType: policy.resourceType, format: policy.format, publicId });
  }

  static async uploadUrl(key: string, mimeType: string, sizeBytes: number) {
    const parsed = parseKey(key);
    if (!parsed) throw new AppError("VALIDATION_ERROR", "Invalid Cloudinary object key", 400);
    let policy: ReturnType<typeof uploadPolicy>;
    try {
      policy = uploadPolicy(mimeType, sizeBytes);
    } catch (error) {
      throw new AppError("VALIDATION_ERROR", error instanceof Error ? error.message : "Invalid file", 400);
    }
    if (parsed.resourceType !== policy.resourceType || parsed.format !== policy.format) {
      throw new AppError("VALIDATION_ERROR", "File type does not match its storage key", 400);
    }
    const config = cloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const fields = {
      public_id: parsed.publicId,
      timestamp,
      type: "authenticated",
      overwrite: "false",
    };
    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/${parsed.resourceType}/upload`,
      uploadMethod: "POST" as const,
      uploadFields: { ...fields, api_key: config.apiKey, signature: signature(fields, config.apiSecret) },
    };
  }

  static async verifyAndSeal(
    uploadKey: string,
    objectKey: string,
    mimeType: string,
    sizeBytes: number,
    expectedWeddingId?: string
  ) {
    if (uploadKey !== objectKey) throw new AppError("FORBIDDEN", "Upload key does not match the stored asset", 403);
    const parsed = parseKey(objectKey);
    if (!parsed) throw new AppError("VALIDATION_ERROR", "Legacy pending uploads cannot be completed", 400);

    if (expectedWeddingId && !parsed.publicId.startsWith(`weddings/${expectedWeddingId}/`)) {
      throw new AppError("FORBIDDEN", "Object key does not belong to this wedding workspace", 403);
    }

    let policy: ReturnType<typeof uploadPolicy>;
    try {
      policy = uploadPolicy(mimeType, sizeBytes);
    } catch (error) {
      throw new AppError("VALIDATION_ERROR", error instanceof Error ? error.message : "Invalid file", 400);
    }
    const config = cloudinaryConfig();
    const basic = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");
    const url = `https://api.cloudinary.com/v1_1/${config.cloudName}/resources/${parsed.resourceType}/authenticated/${encodeURIComponent(parsed.publicId)}`;
    const asset = await cloudinaryJson(url, { headers: { Authorization: `Basic ${basic}` } }, "Upload could not be verified; retry after uploading");
    const actualPublicId = String(asset.public_id ?? "");
    const publicIdMatches = actualPublicId.length === parsed.publicId.length &&
      timingSafeEqual(Buffer.from(actualPublicId), Buffer.from(parsed.publicId));
    const formatMatches = policy.resourceType === "raw" || String(asset.format ?? "").toLowerCase() === policy.format;
    if (!publicIdMatches || asset.resource_type !== policy.resourceType || asset.type !== "authenticated" ||
        !formatMatches || Number(asset.bytes) !== sizeBytes) {
      throw new AppError("VALIDATION_ERROR", "Uploaded file metadata does not match the upload intent", 400);
    }
  }

  static async accessUrl(key: string) {
    const parsed = parseKey(key);
    if (!parsed) {
      const { client, bucket } = legacyR2Config();
      return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 60 });
    }
    const config = cloudinaryConfig();
    const now = Math.floor(Date.now() / 1000);
    const fields = {
      attachment: "false",
      expires_at: (now + 60).toString(),
      format: parsed.format,
      public_id: parsed.publicId,
      timestamp: now.toString(),
      type: "authenticated",
    };
    const query = new URLSearchParams({ ...fields, api_key: config.apiKey, signature: signature(fields, config.apiSecret) });
    return `https://api.cloudinary.com/v1_1/${config.cloudName}/${parsed.resourceType}/download?${query}`;
  }

  static async remove(key: string) {
    const parsed = parseKey(key);
    if (!parsed) {
      const { client, bucket } = legacyR2Config();
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return;
    }
    const config = cloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const fields = { public_id: parsed.publicId, timestamp, type: "authenticated", invalidate: "true" };
    const body = new URLSearchParams({ ...fields, api_key: config.apiKey, signature: signature(fields, config.apiSecret) });
    const result = await cloudinaryJson(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/${parsed.resourceType}/destroy`,
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body },
      "Cloudinary asset could not be deleted"
    );
    if (result.result !== "ok" && result.result !== "not found") {
      throw new AppError("INTERNAL_ERROR", "Cloudinary asset could not be deleted", 502);
    }
  }
}
