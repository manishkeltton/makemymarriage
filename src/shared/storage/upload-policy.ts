export const CLOUDINARY_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const CLOUDINARY_VIDEO_MAX_BYTES = 100 * 1024 * 1024;

const MIME_TYPES = new Map<string, { resourceType: "image" | "video" | "raw"; format: string }>([
  ["image/jpeg", { resourceType: "image", format: "jpg" }],
  ["image/png", { resourceType: "image", format: "png" }],
  ["image/webp", { resourceType: "image", format: "webp" }],
  ["image/gif", { resourceType: "image", format: "gif" }],
  ["image/heic", { resourceType: "image", format: "heic" }],
  ["video/mp4", { resourceType: "video", format: "mp4" }],
  ["video/webm", { resourceType: "video", format: "webm" }],
  ["video/quicktime", { resourceType: "video", format: "mov" }],
  ["audio/mpeg", { resourceType: "video", format: "mp3" }],
  ["audio/mp4", { resourceType: "video", format: "m4a" }],
  ["audio/ogg", { resourceType: "video", format: "ogg" }],
  ["audio/wav", { resourceType: "video", format: "wav" }],
  ["application/pdf", { resourceType: "raw", format: "pdf" }],
]);

export function uploadPolicy(mimeType: string, sizeBytes: number) {
  const normalizedMime = mimeType.toLowerCase();
  const asset = MIME_TYPES.get(normalizedMime);
  if (!asset) throw new Error("Unsupported file type");
  const maxBytes = asset.resourceType === "video" ? CLOUDINARY_VIDEO_MAX_BYTES : CLOUDINARY_IMAGE_MAX_BYTES;
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > maxBytes) {
    throw new Error(`File exceeds the ${maxBytes / 1024 / 1024} MB upload limit`);
  }
  return { ...asset, mimeType: normalizedMime, maxBytes };
}

