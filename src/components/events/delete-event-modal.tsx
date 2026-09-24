"use client";

import React, { useState } from "react";

interface DeleteEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  weddingId: string;
  eventId: string;
  eventName: string;
}

export function DeleteEventModal({
  isOpen,
  onClose,
  onSuccess,
  weddingId,
  eventId,
  eventName,
}: DeleteEventModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/events/${eventId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to delete event.");
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Error deleting event:", err);
      setError("Network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high p-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-error-container/40 text-error flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[28px]">delete_forever</span>
        </div>

        <div className="text-center space-y-2">
          <h3 className="font-headline-sm text-lg font-bold text-on-surface">Delete Event</h3>
          <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-on-surface">“{eventName}”</span>? This action cannot be undone.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error-container/40 text-on-error-container text-xs text-center">
            {error}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg border border-surface-container-high text-on-surface font-semibold text-xs hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-error text-on-error font-semibold text-xs hover:bg-error/90 shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-on-error/30 border-t-on-error rounded-full animate-spin" />
            )}
            <span>Delete Event</span>
          </button>
        </div>
      </div>
    </div>
  );
}
