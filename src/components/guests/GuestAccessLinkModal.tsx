"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GuestHouseholdDTO } from "@/modules/guests/dto/guest.dto";

interface GuestAccessLinkModalProps {
  isOpen: boolean;
  weddingId: string;
  household: GuestHouseholdDTO | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GuestAccessLinkModal({
  isOpen,
  weddingId,
  household,
  onClose,
  onSuccess,
}: GuestAccessLinkModalProps) {
  const [accessUrl, setAccessUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccessLink = useCallback(async () => {
    if (!household) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/guests/${household.id}/access-link`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.accessUrl) {
        setAccessUrl(data.data.accessUrl);
      } else {
        setError(data.error?.message || "Failed to generate access link.");
      }
    } catch (err: unknown) {
      console.error("Error generating guest access link:", err);
      setError("Failed to generate access link.");
    } finally {
      setLoading(false);
    }
  }, [weddingId, household]);

  useEffect(() => {
    if (isOpen && household) {
      void Promise.resolve().then(() => {
        void fetchAccessLink();
      });
    }
  }, [isOpen, household, fetchAccessLink]);

  if (!isOpen || !household) return null;

  const handleCopyLink = () => {
    if (!accessUrl) return;
    navigator.clipboard.writeText(accessUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleMarkSent = async () => {
    setMarkingSent(true);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/guests/${household.id}/mark-invitation-sent`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (onSuccess) onSuccess();
      } else {
        alert(data.error?.message || "Failed to mark invitation sent.");
      }
    } catch (err: unknown) {
      console.error("Error marking invitation sent:", err);
      alert("Failed to mark invitation sent.");
    } finally {
      setMarkingSent(false);
    }
  };

  const qrImageUrl = accessUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(accessUrl)}`
    : "";

  return (
    <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container-high space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-surface-container-high">
          <div>
            <h3 className="text-lg font-bold font-serif text-on-surface">Invitation Link & QR</h3>
            <p className="text-xs text-on-surface-variant">{household.householdName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center text-on-surface-variant gap-3">
            <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
            <span className="text-sm font-medium">Generating secure invitation link...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {/* QR Code Container */}
            {qrImageUrl && (
              <div className="flex flex-col items-center justify-center p-4 bg-surface-container-low rounded-2xl border border-surface-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageUrl}
                  alt={`QR Code for ${household.householdName}`}
                  className="w-44 h-44 rounded-xl border border-white shadow-sm"
                />
                <p className="text-[11px] text-on-surface-variant mt-2 text-center">
                  Scan QR code with smartphone camera to open Digital RSVP
                </p>
              </div>
            )}

            {/* Copyable Link Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Shareable Invitation Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={accessUrl || ""}
                  className="flex-1 px-3 py-2 bg-surface-container-low border border-outline/30 rounded-xl text-xs font-mono text-on-surface"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copied ? "check" : "content_copy"}
                  </span>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="pt-2 border-t border-surface-container flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Invitation Delivery Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md ${
                    household.invitationStatus === "SENT"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {household.invitationStatus}
                </span>
              </div>

              {household.invitationStatus === "NOT_SENT" && (
                <button
                  type="button"
                  onClick={handleMarkSent}
                  disabled={markingSent}
                  className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">mark_email_read</span>
                  Mark Invitation as Sent
                </button>
              )}

              <button
                type="button"
                onClick={fetchAccessLink}
                className="w-full py-1.5 text-on-surface-variant hover:text-primary rounded-xl text-xs font-medium hover:bg-surface-container transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">autorenew</span>
                Reissue / Rotate Access Token
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
