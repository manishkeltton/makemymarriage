"use client";

import React, { useEffect, useState, use } from "react";
import { GuestbookEntryDTO } from "@/modules/guestbook/dto/guestbook.dto";

interface PageProps {
  params: Promise<{ weddingId: string }>;
}

export default function GuestbookPage({ params }: PageProps) {
  const { weddingId } = use(params);

  const [statusFilter, setStatusFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [entries, setEntries] = useState<GuestbookEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/guestbook?status=${statusFilter}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setEntries(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch guestbook entries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/weddings/${weddingId}/guestbook?status=${statusFilter}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && !ignore) setEntries(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch guestbook entries:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [weddingId, statusFilter]);

  const handleModerate = async (entryId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/guestbook/${entryId}/${action}`, {
        method: "POST",
      });
      if (res.ok) fetchEntries();
    } catch (err) {
      console.error("Moderation error:", err);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this wish entry?")) return;
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/guestbook/${entryId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchEntries();
    } catch (err) {
      console.error("Delete guestbook entry error:", err);
    }
  };

  return (
    <div className="space-y-space-md p-space-md max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-surface-container-high/60 shadow-xs">
        <h1 className="text-2xl font-bold tracking-tight text-primary font-headline">Guestbook &amp; Wishes</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Review guest wishes and video messages before they are displayed on your wedding website or invitation page.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-space-sm border-b border-surface-container-high pb-3">
        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            statusFilter === "PENDING"
              ? "bg-amber-100 text-amber-900 font-bold"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">pending</span>
          Pending Review
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("APPROVED")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            statusFilter === "APPROVED"
              ? "bg-emerald-100 text-emerald-900 font-bold"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Approved
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("REJECTED")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            statusFilter === "REJECTED"
              ? "bg-rose-100 text-rose-900 font-bold"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">cancel</span>
          Rejected
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[32px] animate-spin text-primary-container">progress_activity</span>
          Loading guestbook entries...
        </div>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-surface-container-high p-space-md">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">edit_note</span>
          <h3 className="text-sm font-semibold text-on-surface mt-2">No {statusFilter.toLowerCase()} wishes</h3>
          <p className="text-xs text-on-surface-variant mt-1">
            {statusFilter === "PENDING"
              ? "There are currently no guest wishes awaiting your review."
              : `No wishes marked as ${statusFilter.toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-surface-container-lowest rounded-2xl p-space-md border border-surface-container-high shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center font-bold text-xs">
                      {entry.guestName[0]?.toUpperCase() || "G"}
                    </div>
                    <span className="text-xs font-bold text-on-surface">{entry.guestName}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      entry.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : entry.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {entry.type}
                  </span>
                </div>

                {entry.text && (
                  <p className="text-xs text-on-surface-variant italic mt-3 bg-surface-container/50 p-3 rounded-xl border border-surface-container-high/40">
                    &ldquo;{entry.text}&rdquo;
                  </p>
                )}

                {entry.mediaAccessUrl && (
                  <div className="mt-3">
                    {entry.type === "VIDEO" ? (
                      <video src={entry.mediaAccessUrl} controls className="w-full rounded-xl max-h-48 object-cover" />
                    ) : (
                      <audio src={entry.mediaAccessUrl} controls className="w-full mt-2" />
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-surface-container-high text-xs">
                <span className="text-[11px] text-on-surface-variant">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1.5">
                  {entry.status !== "APPROVED" && (
                    <button
                      type="button"
                      onClick={() => handleModerate(entry.id, "approve")}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                  )}
                  {entry.status !== "REJECTED" && (
                    <button
                      type="button"
                      onClick={() => handleModerate(entry.id, "reject")}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-semibold hover:bg-amber-700"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="p-1 rounded text-rose-600 hover:bg-rose-100"
                    title="Delete Entry"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
