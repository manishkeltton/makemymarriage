"use client";

import React, { useState, useEffect } from "react";
import { VendorDTO, VENDOR_CATEGORIES } from "@/modules/vendors/dto/vendor.dto";
import { EventDTO } from "@/modules/events/dto/event.dto";
import { paiseToRupees } from "@/lib/utils/money";

interface VendorFormModalProps {
  isOpen: boolean;
  weddingId: string;
  vendor?: VendorDTO | null;
  events: EventDTO[];
  onClose: () => void;
  onSuccess: (savedVendor: VendorDTO) => void;
}

export function VendorFormModal({
  isOpen,
  weddingId,
  vendor,
  events,
  onClose,
  onSuccess,
}: VendorFormModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("PHOTOGRAPHER");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [agreedAmountRupees, setAgreedAmountRupees] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initForm = () => {
      if (vendor) {
        setName(vendor.name || "");
        setCategory(vendor.category || "PHOTOGRAPHER");
        setContactPerson(vendor.contactPerson || "");
        setPhone(vendor.phone || "");
        setEmail(vendor.email || "");
        setAddress(vendor.address || "");
        setWebsite(vendor.website || "");
        setSocialUrl(vendor.socialUrl || "");
        setSelectedEventIds(vendor.eventIds || []);
        setAgreedAmountRupees(
          vendor.agreedAmountPaise !== undefined ? String(paiseToRupees(vendor.agreedAmountPaise)) : ""
        );
        setNotes(vendor.notes || "");
      } else {
        setName("");
        setCategory("PHOTOGRAPHER");
        setContactPerson("");
        setPhone("");
        setEmail("");
        setAddress("");
        setWebsite("");
        setSocialUrl("");
        setSelectedEventIds([]);
        setAgreedAmountRupees("");
        setNotes("");
      }
      setError(null);
    };
    void Promise.resolve().then(initForm);
  }, [vendor, isOpen]);

  if (!isOpen) return null;

  const toggleEventSelection = (eventId: string) => {
    if (selectedEventIds.includes(eventId)) {
      setSelectedEventIds(selectedEventIds.filter((id) => id !== eventId));
    } else {
      setSelectedEventIds([...selectedEventIds, eventId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vendor name is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        category,
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        website: website.trim() || undefined,
        socialUrl: socialUrl.trim() || undefined,
        eventIds: selectedEventIds,
        agreedAmountRupees: agreedAmountRupees.trim() ? parseFloat(agreedAmountRupees) : undefined,
        notes: notes.trim() || undefined,
      };

      const url = vendor
        ? `/api/v1/weddings/${weddingId}/vendors/${vendor.id}`
        : `/api/v1/weddings/${weddingId}/vendors`;
      const method = vendor ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.error?.message || data.error || "Failed to save vendor details.");
      }
    } catch (err: unknown) {
      console.error("Error saving vendor:", err);
      setError("Failed to save vendor details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-surface-container-high my-8 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b border-surface-container-high">
          <h2 className="text-xl font-bold font-serif text-on-surface">
            {vendor ? "Edit Vendor Details" : "Add Vendor"}
          </h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-error-container text-on-error-container rounded-xl text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Business / Vendor Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Royal Decorators & Events"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                {VENDOR_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Agreed Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 250000"
                value={agreedAmountRupees}
                onChange={(e) => setAgreedAmountRupees(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Contact Person
              </label>
              <input
                type="text"
                placeholder="e.g. Amit Kumar"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. vendor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Website / Portfolio Link
              </label>
              <input
                type="url"
                placeholder="e.g. https://instagram.com/..."
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Associated Ceremonies
            </label>
            {events.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No ceremonies created yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {events.map((ev) => {
                  const selected = selectedEventIds.includes(ev.id);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => toggleEventSelection(ev.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selected
                          ? "bg-primary text-on-primary border-primary shadow-xs"
                          : "bg-surface-container-low text-on-surface border-outline/30 hover:bg-surface-container"
                      }`}
                    >
                      {selected && <span className="material-symbols-outlined text-xs mr-1">check</span>}
                      {ev.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Notes & Contract Terms
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Includes stage lighting, floral arches, and 2 shadow assistants."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          <div className="pt-4 border-t border-surface-container-high flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-outline/30 hover:bg-surface-container-high text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              {vendor ? "Save Changes" : "Create Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
