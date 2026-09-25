"use client";

import React, { useState, useEffect } from "react";
import { ExpenseDTO, EXPENSE_CATEGORIES } from "@/modules/expenses/dto/expense.dto";
import { EventDTO } from "@/modules/events/dto/event.dto";
import { VendorDTO } from "@/modules/vendors/dto/vendor.dto";
import { paiseToRupees } from "@/lib/utils/money";

interface ExpenseFormModalProps {
  isOpen: boolean;
  weddingId: string;
  expense?: ExpenseDTO | null;
  events: EventDTO[];
  vendors: VendorDTO[];
  onClose: () => void;
  onSuccess: (savedExpense: ExpenseDTO) => void;
}

export function ExpenseFormModal({
  isOpen,
  weddingId,
  expense,
  events,
  vendors,
  onClose,
  onSuccess,
}: ExpenseFormModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("DECORATION");
  const [eventId, setEventId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [totalAmountRupees, setTotalAmountRupees] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initForm = () => {
      if (expense) {
        setTitle(expense.title || "");
        setCategory(expense.category || "DECORATION");
        setEventId(expense.eventId || "");
        setVendorId(expense.vendorId || "");
        setTotalAmountRupees(
          expense.totalAmountPaise !== undefined ? String(paiseToRupees(expense.totalAmountPaise)) : ""
        );
        setNotes(expense.notes || "");
      } else {
        setTitle("");
        setCategory("DECORATION");
        setEventId("");
        setVendorId("");
        setTotalAmountRupees("");
        setNotes("");
      }
      setError(null);
    };
    void Promise.resolve().then(initForm);
  }, [expense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Expense title is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        category,
        eventId: eventId || undefined,
        vendorId: vendorId || undefined,
        totalAmountRupees: totalAmountRupees.trim() ? parseFloat(totalAmountRupees) : 0,
        notes: notes.trim() || undefined,
      };

      const url = expense
        ? `/api/v1/weddings/${weddingId}/expenses/${expense.id}`
        : `/api/v1/weddings/${weddingId}/expenses`;
      const method = expense ? "PATCH" : "POST";

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
        setError(data.error?.message || data.error || "Failed to save expense details.");
      }
    } catch (err: unknown) {
      console.error("Error saving expense:", err);
      setError("Failed to save expense details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-container-high my-8 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b border-surface-container-high">
          <h2 className="text-xl font-bold font-serif text-on-surface">
            {expense ? "Edit Expense Details" : "Add New Expense"}
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
              Expense Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mandap Floral Decor & Stage Setup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Total Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="e.g. 150000"
                value={totalAmountRupees}
                onChange={(e) => setTotalAmountRupees(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Linked Ceremony (Optional)
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="">None / General</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Linked Vendor (Optional)
              </label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="">None</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Notes & Description
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Initial quote for stage drapes and entrance arch."
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
              {expense ? "Save Changes" : "Create Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
