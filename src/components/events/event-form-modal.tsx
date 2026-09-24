"use client";

import React, { useState, useEffect } from "react";
import { EventDTO } from "@/modules/events/dto/event.dto";

type EventType = EventDTO["type"];

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  weddingId: string;
  eventToEdit?: EventDTO | null;
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "ROKA", label: "Roka" },
  { value: "ENGAGEMENT", label: "Engagement" },
  { value: "TILAK", label: "Tilak" },
  { value: "MEHENDI", label: "Mehendi" },
  { value: "HALDI", label: "Haldi" },
  { value: "SANGEET", label: "Sangeet" },
  { value: "WEDDING", label: "Wedding / Phere" },
  { value: "RECEPTION", label: "Reception" },
  { value: "CUSTOM", label: "Custom Function" },
];

function formatISOToDateTimeLocal(isoString?: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function EventFormModal({
  isOpen,
  onClose,
  onSuccess,
  weddingId,
  eventToEdit,
}: EventFormModalProps) {
  const isEdit = Boolean(eventToEdit);

  const [name, setName] = useState("");
  const [type, setType] = useState<EventType>("CUSTOM");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [venueName, setVenueName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [dressCode, setDressCode] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (eventToEdit) {
      setName(eventToEdit.name || "");
      setType(eventToEdit.type || "CUSTOM");
      setDescription(eventToEdit.description || "");
      setStartAt(formatISOToDateTimeLocal(eventToEdit.startAt));
      setEndAt(formatISOToDateTimeLocal(eventToEdit.endAt));
      setVenueName(eventToEdit.venue?.name || "");
      setAddressLine1(eventToEdit.venue?.addressLine1 || "");
      setCity(eventToEdit.venue?.city || "");
      setState(eventToEdit.venue?.state || "");
      setCountry(eventToEdit.venue?.country || "India");
      setDressCode(eventToEdit.dressCode || "");
      setNotes(eventToEdit.notes || "");
    } else {
      // Default to today at 18:00
      const now = new Date();
      now.setHours(18, 0, 0, 0);
      setName("");
      setType("CUSTOM");
      setDescription("");
      setStartAt(formatISOToDateTimeLocal(now.toISOString()));
      setEndAt("");
      setVenueName("");
      setAddressLine1("");
      setCity("");
      setState("");
      setCountry("India");
      setDressCode("");
      setNotes("");
    }
    setError(null);
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Event name is required.");
      return;
    }
    if (!startAt) {
      setError("Start date and time is required.");
      return;
    }
    if (endAt && new Date(endAt).getTime() < new Date(startAt).getTime()) {
      setError("End time must be after or equal to start time.");
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        startAt: new Date(startAt).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        venue: {
          name: venueName.trim() || undefined,
          addressLine1: addressLine1.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          country: country.trim() || undefined,
        },
        dressCode: dressCode.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const url = isEdit
        ? `/api/v1/weddings/${weddingId}/events/${eventToEdit!.id}`
        : `/api/v1/weddings/${weddingId}/events`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to save event. Please check inputs.");
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Error submitting event form:", err);
      setError("Network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface-container-low border-b border-surface-container-high/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">
              {isEdit ? "edit_calendar" : "event"}
            </span>
            <h2 className="font-headline-sm text-lg font-bold text-on-surface">
              {isEdit ? "Edit Event" : "Create New Event"}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-error shrink-0 mt-0.5">
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          {/* Event Title & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Event Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sangeet Night, Cocktail Dinner, Phere"
                className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Event Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of ceremony timing, rituals, or expectations..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Start & End Date Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Start Date &amp; Time <span className="text-error">*</span>
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                End Date &amp; Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Venue Info */}
          <div className="pt-2 border-t border-surface-container-high/40 space-y-3">
            <span className="font-label-sm text-xs font-bold text-on-surface uppercase tracking-wider block">
              Venue &amp; Location
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. The Leela Palace, Grand Ballroom"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Street or Resort Address"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Udaipur"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Rajasthan"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. India"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          {/* Dress Code & Notes */}
          <div className="pt-2 border-t border-surface-container-high/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Dress Code
              </label>
              <input
                type="text"
                value={dressCode}
                onChange={(e) => setDressCode(e.target.value)}
                placeholder="e.g. Royal Ethnic / Traditional Kurta / Indo-Western"
                className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Internal Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Coordinators notes, muhurat timing, vendor instructions..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
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
              <span>{isEdit ? "Save Changes" : "Create Event"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
