"use client";

import React, { useState, useEffect } from "react";
import { TeamMemberDTO } from "@/modules/team/dto/team.dto";
import { EventDTO } from "@/modules/events/dto/event.dto";

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  weddingId: string;
  memberToEdit: TeamMemberDTO | null;
  weddingEvents: EventDTO[];
}

export function EditMemberModal({
  isOpen,
  onClose,
  onSuccess,
  weddingId,
  memberToEdit,
  weddingEvents,
}: EditMemberModalProps) {
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "ORGANISER">("ORGANISER");

  const [permissions, setPermissions] = useState({
    guests: true,
    vendors: true,
    finance: true,
    gallery: true,
    website: true,
    guestbook: true,
    emergency: true,
  });

  const [allEvents, setAllEvents] = useState(true);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (memberToEdit) {
      setRole(memberToEdit.role);
      setPermissions(memberToEdit.permissions);
      setAllEvents(memberToEdit.eventScope?.allEvents ?? true);
      setSelectedEventIds(memberToEdit.eventScope?.eventIds || []);
      setError(null);
    }
  }, [memberToEdit, isOpen]);

  if (!isOpen || !memberToEdit) return null;

  const handleRoleChange = (newRole: "ADMIN" | "MANAGER" | "ORGANISER") => {
    setRole(newRole);
    if (newRole === "ADMIN") {
      setPermissions({
        guests: true,
        vendors: true,
        finance: true,
        gallery: true,
        website: true,
        guestbook: true,
        emergency: true,
      });
      setAllEvents(true);
    }
  };

  const toggleEventId = (eventId: string) => {
    if (selectedEventIds.includes(eventId)) {
      setSelectedEventIds(selectedEventIds.filter((id) => id !== eventId));
    } else {
      setSelectedEventIds([...selectedEventIds, eventId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!allEvents && selectedEventIds.length === 0) {
      setError("Please select at least one ceremony for specific event scope.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        role,
        permissions,
        eventScope: {
          allEvents,
          eventIds: allEvents ? [] : selectedEventIds,
        },
      };

      const res = await fetch(`/api/v1/weddings/${weddingId}/members/${memberToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to update member access.");
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Error updating member access:", err);
      setError("Network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface-container-low border-b border-surface-container-high/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">
              admin_panel_settings
            </span>
            <div>
              <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                Edit Member Access
              </h2>
              <span className="text-xs text-on-surface-variant font-medium">
                {memberToEdit.userName} ({memberToEdit.userEmail})
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-error shrink-0 mt-0.5">
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          {/* Role Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Workspace Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "ADMIN" as const, label: "Admin", desc: "Full workspace & team access" },
                { id: "MANAGER" as const, label: "Manager", desc: "Full planning, no team edits" },
                { id: "ORGANISER" as const, label: "Organiser", desc: "Assigned ceremonies & duties" },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleChange(r.id)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    role === r.id
                      ? "border-primary-container bg-primary-fixed/20 text-on-surface shadow-xs"
                      : "border-surface-container-high bg-surface-container-low text-on-surface-variant hover:border-surface-container-highest"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-xs font-bold text-on-surface">
                      {r.label}
                    </span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        role === r.id
                          ? "border-primary-container bg-primary-container"
                          : "border-surface-container-highest"
                      }`}
                    >
                      {role === r.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-on-primary" />
                      )}
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant mt-1 leading-tight">
                    {r.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Functional Permissions */}
          <div className="pt-2 border-t border-surface-container-high/40 space-y-2">
            <span className="font-label-sm text-xs font-bold text-on-surface uppercase tracking-wider block">
              Functional Permissions
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { key: "guests", label: "Guests & RSVPs" },
                { key: "vendors", label: "Vendor Directory" },
                { key: "finance", label: "Expenses & Budget" },
                { key: "gallery", label: "Media & Albums" },
                { key: "website", label: "Wedding Site" },
                { key: "guestbook", label: "Guestbook" },
                { key: "emergency", label: "Emergency Contacts" },
              ].map((p) => (
                <label
                  key={p.key}
                  className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low border border-surface-container-high/50 cursor-pointer hover:bg-surface-container transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={permissions[p.key as keyof typeof permissions]}
                    onChange={(e) =>
                      setPermissions({
                        ...permissions,
                        [p.key]: e.target.checked,
                      })
                    }
                    disabled={role === "ADMIN"}
                    className="w-4 h-4 rounded text-primary-container border-surface-container-high focus:ring-primary-container"
                  />
                  <span className="text-xs text-on-surface font-medium">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Event Scope Selection */}
          <div className="pt-2 border-t border-surface-container-high/40 space-y-3">
            <span className="font-label-sm text-xs font-bold text-on-surface uppercase tracking-wider block">
              Event Scope Access
            </span>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface font-medium">
                <input
                  type="radio"
                  name="editEventScopeType"
                  checked={allEvents}
                  onChange={() => setAllEvents(true)}
                  disabled={role === "ADMIN"}
                  className="text-primary-container"
                />
                <span>All Wedding Ceremonies &amp; Functions</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface font-medium">
                <input
                  type="radio"
                  name="editEventScopeType"
                  checked={!allEvents}
                  onChange={() => setAllEvents(false)}
                  disabled={role === "ADMIN"}
                  className="text-primary-container"
                />
                <span>Specific Ceremonies Only</span>
              </label>
            </div>

            {!allEvents && (
              <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container-high/50 space-y-2">
                <span className="text-[11px] font-semibold text-on-surface-variant block">
                  Select Accessible Ceremonies:
                </span>
                {weddingEvents.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic">
                    No events created yet. Member will gain access when events are added.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {weddingEvents.map((ev) => (
                      <label
                        key={ev.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-surface-container text-xs text-on-surface cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEventIds.includes(ev.id)}
                          onChange={() => toggleEventId(ev.id)}
                          className="rounded text-primary-container"
                        />
                        <span className="truncate">{ev.name} ({ev.type})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-surface-container-high/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg border border-surface-container-high text-on-surface font-semibold text-xs hover:bg-surface-container-low transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary font-semibold text-xs hover:bg-primary shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
