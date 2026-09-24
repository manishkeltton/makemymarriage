"use client";

import React, { useState } from "react";
import { TeamMemberDTO } from "@/modules/team/dto/team.dto";

interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  weddingId: string;
  memberToRemove: TeamMemberDTO | null;
}

export function RemoveMemberModal({
  isOpen,
  onClose,
  onSuccess,
  weddingId,
  memberToRemove,
}: RemoveMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !memberToRemove) return null;

  const handleRemove = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/members/${memberToRemove.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to remove member.");
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Error removing member:", err);
      setError("Network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high p-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-error-container/40 text-error flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[28px]">person_remove</span>
        </div>

        <div className="text-center space-y-2">
          <h3 className="font-headline-sm text-lg font-bold text-on-surface">Remove Team Member</h3>
          <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
            Are you sure you want to remove <span className="font-bold text-on-surface">“{memberToRemove.userName}”</span> ({memberToRemove.userEmail}) from this wedding workspace?
          </p>
          <p className="text-[11px] text-on-surface-variant italic">
            This only revokes their access to this specific wedding. Their MakeMyMarriage account remains unaffected.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error-container/40 text-on-error-container text-xs text-center border border-error/20">
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
            onClick={handleRemove}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-error text-on-error font-semibold text-xs hover:bg-error/90 shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-on-error/30 border-t-on-error rounded-full animate-spin" />
            )}
            <span>Remove Member</span>
          </button>
        </div>
      </div>
    </div>
  );
}
