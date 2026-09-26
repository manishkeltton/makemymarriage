"use client";

import React, { useState, useEffect } from "react";
import { GuestHouseholdDTO } from "@/modules/guests/dto/guest.dto";

interface GuestDetailDrawerProps {
  isOpen: boolean;
  weddingId: string;
  household: GuestHouseholdDTO | null;
  onClose: () => void;
  onHouseholdUpdated: () => void;
  onOpenAccessLinkModal?: (household: GuestHouseholdDTO) => void;
}

export function GuestDetailDrawer({
  isOpen,
  weddingId,
  household,
  onClose,
  onHouseholdUpdated,
  onOpenAccessLinkModal,
}: GuestDetailDrawerProps) {
  const [rsvpStatus, setRsvpStatus] = useState<"AWAITING" | "ATTENDING" | "NOT_ATTENDING">("AWAITING");
  const [attendingCount, setAttendingCount] = useState<number>(1);
  const [updatingRsvp, setUpdatingRsvp] = useState(false);

  useEffect(() => {
    const initDrawer = () => {
      if (household) {
        setRsvpStatus(household.rsvp?.status || "AWAITING");
        setAttendingCount(
          household.rsvp?.attendingCount ?? (household.rsvp?.status === "ATTENDING" ? household.totalInvited : 1)
        );
      }
    };
    void Promise.resolve().then(initDrawer);
  }, [household]);

  if (!isOpen || !household) return null;

  const handleUpdateRsvp = async (newStatus: "AWAITING" | "ATTENDING" | "NOT_ATTENDING") => {
    setUpdatingRsvp(true);
    try {
      const count = newStatus === "ATTENDING" ? Math.min(Math.max(1, attendingCount), household.totalInvited) : 0;
      const res = await fetch(`/api/v1/weddings/${weddingId}/guests/${household.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rsvp: {
            status: newStatus,
            attendingCount: count,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onHouseholdUpdated();
      } else {
        alert(data.error?.message || "Failed to update RSVP status.");
      }
    } catch (err: unknown) {
      console.error("Error updating RSVP:", err);
      alert("Failed to update RSVP status.");
    } finally {
      setUpdatingRsvp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-on-surface/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface-container-lowest h-full shadow-2xl border-l border-surface-container-high flex flex-col">
        {/* Drawer Header */}
        <div className="p-6 border-b border-surface-container-high flex items-start justify-between bg-surface-container-low">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-primary-container/40 text-on-primary-container text-xs font-bold uppercase tracking-wider">
                {household.side} SIDE
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  household.rsvp.status === "ATTENDING"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : household.rsvp.status === "NOT_ATTENDING"
                    ? "bg-error-container text-on-error-container"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {household.rsvp.status}
              </span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-on-surface mt-1">{household.householdName}</h2>
            <p className="text-xs text-on-surface-variant">Primary Contact: {household.primaryContact.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container">
              <div className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Total Passes</div>
              <div className="text-2xl font-bold font-mono text-on-surface mt-0.5">{household.totalInvited}</div>
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container">
              <div className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Attending Guests</div>
              <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                {household.rsvp.status === "ATTENDING" ? household.rsvp.attendingCount : 0}
              </div>
            </div>
          </div>

          {/* Organiser Manual RSVP Control */}
          <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-container space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Organiser Manual RSVP Update
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={updatingRsvp}
                  onClick={() => handleUpdateRsvp("ATTENDING")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    rsvpStatus === "ATTENDING"
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                      : "bg-surface border-outline/30 text-on-surface hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  }`}
                >
                  ✓ Attending
                </button>
                <button
                  type="button"
                  disabled={updatingRsvp}
                  onClick={() => handleUpdateRsvp("NOT_ATTENDING")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    rsvpStatus === "NOT_ATTENDING"
                      ? "bg-error text-white border-error shadow-xs"
                      : "bg-surface border-outline/30 text-on-surface hover:bg-error-container/30"
                  }`}
                >
                  ✕ Declined
                </button>
                <button
                  type="button"
                  disabled={updatingRsvp}
                  onClick={() => handleUpdateRsvp("AWAITING")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    rsvpStatus === "AWAITING"
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-surface border-outline/30 text-on-surface hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  }`}
                >
                  ? Awaiting
                </button>
              </div>

              {rsvpStatus === "ATTENDING" && (
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs text-on-surface-variant font-medium">Attending Count:</span>
                  <input
                    type="number"
                    min="1"
                    max={household.totalInvited}
                    value={attendingCount}
                    onChange={(e) => setAttendingCount(parseInt(e.target.value, 10) || 1)}
                    className="w-20 px-2.5 py-1 bg-surface border border-outline/30 rounded-lg text-sm font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateRsvp("ATTENDING")}
                    className="px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary/90"
                  >
                    Set Count
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Primary Contact Information</h3>
            <div className="p-3 bg-surface-container-low rounded-xl text-sm space-y-1">
              <div><span className="font-semibold">Name:</span> {household.primaryContact.name}</div>
              {household.primaryContact.email && <div><span className="font-semibold">Email:</span> {household.primaryContact.email}</div>}
              {household.primaryContact.phone && <div><span className="font-semibold">Phone:</span> {household.primaryContact.phone}</div>}
            </div>
          </div>

          {/* Household Members List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Household Members ({household.members?.length || 0})
            </h3>
            {household.members && household.members.length > 0 ? (
              <div className="divide-y divide-surface-container-high border border-surface-container-high rounded-xl overflow-hidden text-sm">
                {household.members.map((m, idx) => (
                  <div key={idx} className="p-3 bg-surface-container-lowest flex items-center justify-between">
                    <span className="font-medium text-on-surface">{m.name}</span>
                    <span className="text-xs text-on-surface-variant">Pass #{idx + 1}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-on-surface-variant italic p-3 bg-surface-container-low rounded-xl">
                No individual member names recorded.
              </div>
            )}
          </div>

          {/* Share Access Link Button */}
          {onOpenAccessLinkModal && (
            <button
              onClick={() => onOpenAccessLinkModal(household)}
              className="w-full py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-base">qr_code_2</span>
              Generate / Share Digital Invitation & QR Code
            </button>
          )}

          {/* Notes */}
          {household.notes && (
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Internal Notes</h3>
              <p className="p-3 bg-surface-container-low rounded-xl text-xs text-on-surface-variant whitespace-pre-wrap">
                {household.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
