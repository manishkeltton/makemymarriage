import { uploadPolicy } from "@/shared/storage/upload-policy";

export interface SignedUpload {
  uploadUrl: string;
  uploadMethod: "POST";
  uploadFields: Record<string, string>;
}

export function validateUploadFile(file: File) {
  return uploadPolicy(file.type, file.size);
}

export async function uploadToCloudinary(intent: SignedUpload, file: File) {
  const form = new FormData();
  for (const [key, value] of Object.entries(intent.uploadFields)) form.append(key, value);
  form.append("file", file);

  const response = await fetch(intent.uploadUrl, { method: intent.uploadMethod, body: form });
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(result?.error?.message || "Cloudinary upload failed");
  }
}

