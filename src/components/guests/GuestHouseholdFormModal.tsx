"use client";

import React, { useState, useEffect } from "react";
import { GuestHouseholdDTO } from "@/modules/guests/dto/guest.dto";

interface GuestHouseholdFormModalProps {
  isOpen: boolean;
  weddingId: string;
  household?: GuestHouseholdDTO | null;
  onClose: () => void;
  onSuccess: (savedHousehold: GuestHouseholdDTO) => void;
}

export function GuestHouseholdFormModal({
  isOpen,
  weddingId,
  household,
  onClose,
  onSuccess,
}: GuestHouseholdFormModalProps) {
  const [householdName, setHouseholdName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [side, setSide] = useState<"BRIDE" | "GROOM" | "BOTH">("BOTH");
  const [totalInvited, setTotalInvited] = useState<number>(2);
  const [notes, setNotes] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [newMemberName, setNewMemberName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initForm = () => {
      if (household) {
        setHouseholdName(household.householdName || "");
        setContactName(household.primaryContact?.name || "");
        setContactEmail(household.primaryContact?.email || "");
        setContactPhone(household.primaryContact?.phone || "");
        setSide(household.side || "BOTH");
        setTotalInvited(household.totalInvited || 2);
        setNotes(household.notes || "");
        setMembers((household.members || []).map((m) => m.name));
      } else {
        setHouseholdName("");
        setContactName("");
        setContactEmail("");
        setContactPhone("");
        setSide("BOTH");
        setTotalInvited(2);
        setNotes("");
        setMembers([]);
      }
      setNewMemberName("");
      setError(null);
    };
    void Promise.resolve().then(initForm);
  }, [household, isOpen]);

  if (!isOpen) return null;

  const handleAddMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
    if (members.includes(name)) return;
    setMembers([...members, name]);
    setNewMemberName("");
    if (members.length + 1 > totalInvited) {
      setTotalInvited(members.length + 1);
    }
  };

  const handleRemoveMember = (idx: number) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdName.trim()) {
      setError("Household name is required");
      return;
    }
    if (!contactName.trim()) {
      setError("Primary contact name is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        householdName: householdName.trim(),
        primaryContact: {
          name: contactName.trim(),
          email: contactEmail.trim() || undefined,
          phone: contactPhone.trim() || undefined,
        },
        side,
        members: members.map((name) => ({ name })),
        totalInvited: Math.max(1, totalInvited),
        notes: notes.trim() || undefined,
      };

      const url = household
        ? `/api/v1/weddings/${weddingId}/guests/${household.id}`
        : `/api/v1/weddings/${weddingId}/guests`;
      const method = household ? "PATCH" : "POST";

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
        setError(data.error?.message || data.error || "Failed to save guest household.");
      }
    } catch (err: unknown) {
      console.error("Error saving guest household:", err);
      setError("Failed to save guest household.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-container-high my-8 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b border-surface-container-high">
          <h2 className="text-xl font-bold font-serif text-on-surface">
            {household ? "Edit Guest Household" : "Add Guest Household"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Household / Family Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sharma Family"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Guest Side *
              </label>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as "BRIDE" | "GROOM" | "BOTH")}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="BRIDE">Bride Side</option>
                <option value="GROOM">Groom Side</option>
                <option value="BOTH">Both Sides / Common</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Primary Contact Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. rahul@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. +91 9876543210"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Total Invited Passes *
              </label>
              <input
                type="number"
                required
                min="1"
                value={totalInvited}
                onChange={(e) => setTotalInvited(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
              />
            </div>
          </div>

          {/* Household Members Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Household Members / Attendees
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add member name (e.g. Neha Sharma)"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
                className="flex-1 px-3.5 py-2 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="px-3 py-2 bg-surface-container-high hover:bg-surface-container text-on-surface rounded-xl text-xs font-bold"
              >
                Add Member
              </button>
            </div>
            {members.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-surface-container-low rounded-xl border border-outline/20">
                {members.map((m, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-container/40 text-on-primary-container text-xs font-medium"
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="hover:text-error transition-colors text-sm"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Internal Notes & Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Requires ground floor accommodation near venue."
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
              {household ? "Save Changes" : "Create Household"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
