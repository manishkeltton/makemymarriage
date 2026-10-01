import { DocumentDTO, DocumentType, DocumentRelatedType } from "@/modules/documents/dto/document.dto";

export interface UploadDocumentParams {
  weddingId: string;
  file: File;
  title: string;
  type?: DocumentType;
  relatedTo?: {
    type: DocumentRelatedType;
    id: string;
  };
  onProgress?: (progressPct: number) => void;
}

export async function uploadDocumentToVault({
  weddingId,
  file,
  title,
  type = "OTHER",
  relatedTo,
  onProgress,
}: UploadDocumentParams): Promise<DocumentDTO> {
  // 1. Request upload intent
  const intentRes = await fetch(`/api/v1/weddings/${weddingId}/documents/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: title.trim() || file.name,
      type,
      mimeType: file.type || "application/pdf",
      sizeBytes: file.size,
      relatedTo,
    }),
  });

  const intentData = await intentRes.json();
  if (!intentRes.ok || !intentData.success) {
    throw new Error(intentData.error?.message || "Failed to generate document upload intent");
  }

  const { uploadUrl, uploadMethod, uploadFields, objectKey } = intentData.data;

  // 2. Perform direct binary upload with progress tracking
  const formData = new FormData();
  if (uploadFields) {
    Object.entries(uploadFields).forEach(([k, v]) => formData.append(k, v as string));
  }
  formData.append("file", file);

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(uploadMethod || "POST", uploadUrl);
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        const pct = Math.round((evt.loaded / evt.total) * 100);
        onProgress(pct);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Binary file upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during document upload"));
    xhr.send(formData);
  });

  // 3. Complete and seal document record
  const createRes = await fetch(`/api/v1/weddings/${weddingId}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: title.trim() || file.name,
      type,
      uploadKey: uploadFields?.key || objectKey,
      objectKey,
      mimeType: file.type || "application/pdf",
      fileSize: file.size,
      relatedTo,
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok || !createData.success) {
    throw new Error(createData.error?.message || "Failed to finalize document creation");
  }

  return createData.data;
}

export async function openDocumentAccessUrl(weddingId: string, doc: DocumentDTO): Promise<void> {
  if (doc.isUnavailable || !doc.fileKey) {
    alert("This document is unavailable or missing underlying binary storage file.");
    return;
  }

  try {
    const res = await fetch(`/api/v1/weddings/${weddingId}/documents/${doc.id}/access-url`);
    const data = await res.json();
    if (res.ok && data.success && data.data?.accessUrl) {
      window.open(data.data.accessUrl, "_blank");
    } else {
      alert(data.error?.message || "Document file is unavailable or access link expired.");
    }
  } catch (err) {
    console.error("Error opening document access URL:", err);
    alert("Failed to fetch document access link.");
  }
}
