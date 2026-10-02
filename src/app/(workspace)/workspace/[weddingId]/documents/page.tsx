"use client";

import React, { useState, useEffect, use, Suspense, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { DocumentDTO, DocumentType } from "@/modules/documents/dto/document.dto";
import { uploadDocumentToVault, openDocumentAccessUrl } from "@/lib/utils/document-upload";

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  const k = 1024;
  const sizes = ["B", "KiB", "MiB", "GiB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function WorkspaceDocumentsPage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = use(params);
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-on-surface-variant flex flex-col items-center justify-center gap-2">
          <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p>Loading document vault...</p>
        </div>
      }
    >
      <DocumentsContent weddingId={weddingId} />
    </Suspense>
  );
}

function DocumentsContent({ weddingId }: { weddingId: string }) {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") || "";
  const urlDocumentId = searchParams.get("documentId") || "";
  const router = useRouter();
  const pathname = usePathname();

  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Highlight refs for URL-driven document reveal (derived, not state)
  const highlightedDocRef = useRef<HTMLDivElement | null>(null);
  const resolvedHighlightRef = useRef("");
  // Derived: card highlighted when URL param is present, list loaded, doc is in list
  const effectiveHighlightId = !loading && urlDocumentId && documents.some((d) => d.id === urlDocumentId) ? urlDocumentId : "";

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState<DocumentType>("CONTRACT");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      setError(null);
      try {
        const query = new URLSearchParams();
        if (selectedType) query.append("type", selectedType);
        if (eventId) {
          query.append("relatedType", "EVENT");
          query.append("relatedId", eventId);
        }

        const res = await fetch(`/api/v1/weddings/${weddingId}/documents?${query.toString()}`);
        const data = await res.json();
        if (isMounted && res.ok && data.success) {
          setDocuments(data.data || []);
        } else if (isMounted) {
          setError(data.error?.message || "Failed to load documents.");
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error("Error fetching documents:", err);
          setError("Failed to load documents.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [weddingId, selectedType, eventId]);

  // URL-driven document highlight: fetch document by ID when not in current list
  useEffect(() => {
    if (!urlDocumentId || loading || resolvedHighlightRef.current === urlDocumentId) return;
    resolvedHighlightRef.current = urlDocumentId;
    const found = documents.find((d) => d.id === urlDocumentId);
    if (found) return; // already in list – effectiveHighlightId derives automatically
    // Document filtered out – fetch by ID and prepend so it becomes visible
    const controller = new AbortController();
    fetch(`/api/v1/weddings/${weddingId}/documents/${urlDocumentId}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: { success: boolean; data?: DocumentDTO }) => {
        if (data.success && data.data) {
          setDocuments((prev) => [data.data!, ...prev.filter((d) => d.id !== data.data!.id)]);
          // effectiveHighlightId auto-derives once documents state updates
        }
      })
      .catch(() => {/* 403 / 404 – silently skip */});
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlDocumentId, loading, weddingId]);

  // Scroll highlighted document card into view (documents in deps so it fires after prepend)
  useEffect(() => {
    if (effectiveHighlightId && highlightedDocRef.current) {
      highlightedDocRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [effectiveHighlightId, documents]);

  // Auto-clear URL param after 3 s (highlight clears automatically once param removed)
  useEffect(() => {
    if (!effectiveHighlightId) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("documentId");
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : pathname, { scroll: false });
    }, 3000);
    return () => clearTimeout(timer);
  }, [effectiveHighlightId, searchParams, router, pathname]);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const newDoc = await uploadDocumentToVault({
        weddingId,
        file: selectedFile,
        title: uploadTitle.trim() || selectedFile.name,
        type: uploadType,
        relatedTo: eventId ? { type: "EVENT", id: eventId } : undefined,
        onProgress: (pct) => setUploadProgress(pct),
      });

      setDocuments((prev) => [newDoc, ...prev]);
      setUploadTitle("");
      setSelectedFile(null);
      setIsUploadModalOpen(false);
    } catch (err: unknown) {
      console.error("Error uploading document:", err);
      setError(err instanceof Error ? err.message : "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete document "${title}"?`)) return;

    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/documents/${documentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      } else {
        const data = await res.json();
        alert(data.error?.message || "Failed to delete document.");
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("Failed to delete document.");
    }
  };

  const categories = [
    { type: "", label: "All Documents" },
    { type: "CONTRACT", label: "Contracts & Agreements" },
    { type: "INVOICE", label: "Invoices" },
    { type: "RECEIPT", label: "Receipts" },
    { type: "QUOTATION", label: "Quotations" },
    { type: "MENU", label: "Catering Menus" },
    { type: "OTHER", label: "Other Vault Documents" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6 text-on-surface antialiased font-body-md">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-primary-container px-2.5 py-0.5 rounded-full bg-primary-fixed font-bold">
              Document Vault
            </span>
            {eventId && (
              <span className="font-label-sm text-[11px] uppercase tracking-wider text-secondary px-2.5 py-0.5 rounded-full bg-secondary-container font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">event</span>
                <span>Filtered by Ceremony Context</span>
              </span>
            )}
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl tracking-tight font-bold text-on-surface">
            Documents &amp; Contracts Vault
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant">
            Secure workspace storage for contracts, invoices, vendor quotes &amp; ceremonial menus
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setIsUploadModalOpen(true);
          }}
          className="h-10 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-body-sm text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer self-start lg:self-auto"
          type="button"
        >
          <span className="material-symbols-outlined text-[19px]">upload_file</span>
          <span>Upload Document</span>
        </button>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat.type}
            onClick={() => setSelectedType(cat.type)}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedType === cat.type
                ? "bg-primary-container text-on-primary shadow-xs"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-error">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-on-surface-variant flex flex-col items-center justify-center gap-2">
          <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p>Loading document vault...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 bg-surface-container-lowest rounded-2xl border border-surface-container-high text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container mx-auto">
            <span className="material-symbols-outlined text-[24px]">folder_open</span>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-on-surface">No documents in vault</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Upload contracts, vendor proposals, or catering menus to keep them organized.
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold shadow-xs transition-colors"
          >
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              ref={doc.id === effectiveHighlightId ? (el) => { highlightedDocRef.current = el; } : undefined}
              id={`document-${doc.id}`}
              className={`p-4 rounded-2xl bg-surface-container-lowest border shadow-xs flex flex-col justify-between space-y-4 hover:border-primary-container/40 transition-all ${
                doc.id === effectiveHighlightId
                  ? "border-primary/60 ring-2 ring-primary/40"
                  : "border-surface-container-high/60"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary-container font-bold text-[10px] uppercase tracking-wider">
                    {doc.type}
                  </span>
                  <div className="flex items-center gap-1">
                    {doc.isUnavailable ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Unavailable
                      </span>
                    ) : (
                      <button
                        onClick={() => openDocumentAccessUrl(weddingId, doc)}
                        className="p-1 text-primary-container hover:bg-primary-fixed rounded transition-colors"
                        title="View / Download Document"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      className="p-1 text-on-surface-variant hover:text-error transition-colors"
                      title="Delete document"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-sm text-on-surface leading-snug">{doc.title}</h3>
                <p className="text-[11px] text-on-surface-variant">
                  Uploaded by {doc.uploaderName || "Team Member"} on {new Date(doc.createdAt).toLocaleDateString()}
                </p>
                {doc.relatedTo && (
                  <div className="text-[10px] text-on-surface-variant/80 font-medium">
                    Bound to {doc.relatedTo.type} #{doc.relatedTo.id.slice(-6)}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-surface-container-high/40 flex items-center justify-between text-xs">
                <span className="text-secondary font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  {doc.isUnavailable ? "Legacy Record" : "Vault Verified"}
                </span>
                <span className="text-on-surface-variant flex items-center gap-1 font-medium text-[11px]">
                  <span>{doc.mimeType?.includes("pdf") ? "PDF" : doc.mimeType || "File"}</span>
                  {doc.fileSize && <span>({formatBytes(doc.fileSize)})</span>}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Direct Binary Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container-high space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container-high/60 pb-3">
              <h2 className="font-headline-sm text-base font-bold text-on-surface">Upload Document</h2>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Select Document File (PDF or Image, max 10 MiB) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/jpeg,image/png,image/webp,image/gif,image/heic"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    if (file && !uploadTitle) {
                      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                  className="w-full px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leela Palace Acoustic Contract 2027"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container text-on-surface font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Document Category
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as DocumentType)}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-surface-container-high rounded-lg text-on-surface font-medium"
                >
                  <option value="CONTRACT">Contract &amp; Agreement</option>
                  <option value="INVOICE">Invoice</option>
                  <option value="RECEIPT">Receipt</option>
                  <option value="QUOTATION">Quotation &amp; Proposal</option>
                  <option value="MENU">Catering Menu</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-on-surface-variant">
                    <span>Uploading file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container-high/60">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-surface-container-high text-on-surface font-semibold hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {uploading && <span className="w-3.5 h-3.5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />}
                  <span>Upload to Vault</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
