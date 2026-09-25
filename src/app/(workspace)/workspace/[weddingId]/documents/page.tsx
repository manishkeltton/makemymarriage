"use client";

import React, { useState, useEffect, use } from "react";
import { DocumentDTO } from "@/modules/documents/dto/document.dto";

export default function WorkspaceDocumentsPage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = use(params);

  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("CONTRACT");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      setError(null);
      try {
        const query = new URLSearchParams();
        if (selectedType) query.append("type", selectedType);

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
  }, [weddingId, selectedType]);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    setUploading(true);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadTitle.trim(),
          type: uploadType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDocuments((prev) => [data.data, ...prev]);
        setUploadTitle("");
        setIsUploadModalOpen(false);
      } else {
        setError(data.error?.message || "Failed to upload document.");
      }
    } catch (err) {
      console.error("Error uploading document:", err);
      setError("Network error occurred.");
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
      }
    } catch (err) {
      console.error("Error deleting document:", err);
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
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl tracking-tight font-bold text-on-surface">
            Documents &amp; Contracts Vault
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant">
            Secure workspace storage for contracts, invoices, vendor quotes &amp; ceremonial menus
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
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
              className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs flex flex-col justify-between space-y-4 hover:border-primary-container/40 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary-container font-bold text-[10px] uppercase tracking-wider">
                    {doc.type}
                  </span>
                  <button
                    onClick={() => handleDeleteDocument(doc.id, doc.title)}
                    className="p-1 text-on-surface-variant hover:text-error transition-colors"
                    title="Delete document"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
                <h3 className="font-bold text-sm text-on-surface leading-snug">{doc.title}</h3>
                <p className="text-[11px] text-on-surface-variant">
                  Uploaded by {doc.uploaderName || "Team Member"} on {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="pt-2 border-t border-surface-container-high/40 flex items-center justify-between text-xs">
                <span className="text-secondary font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Vault Verified
                </span>
                <span className="text-on-surface-variant flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  {doc.mimeType || "Document"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
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
                  onChange={(e) => setUploadType(e.target.value)}
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
                  disabled={uploading}
                  className="px-5 py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {uploading && <span className="w-3.5 h-3.5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />}
                  <span>Save to Vault</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
