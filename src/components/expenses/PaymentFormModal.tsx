"use client";

import React, { useState, useEffect } from "react";
import { ExpenseDTO, ExpensePaymentDTO } from "@/modules/expenses/dto/expense.dto";
import { TeamMemberDTO } from "@/modules/team/dto/team.dto";
import { paiseToRupees } from "@/lib/utils/money";

interface PaymentFormModalProps {
  isOpen: boolean;
  weddingId: string;
  expense: ExpenseDTO;
  payment?: ExpensePaymentDTO | null;
  teamMembers: TeamMemberDTO[];
  onClose: () => void;
  onSuccess: (savedPayment: ExpensePaymentDTO) => void;
}

export function PaymentFormModal({
  isOpen,
  weddingId,
  expense,
  payment,
  teamMembers,
  onClose,
  onSuccess,
}: PaymentFormModalProps) {
  const [amountRupees, setAmountRupees] = useState("");
  const [dueAtDate, setDueAtDate] = useState("");
  const [status, setStatus] = useState<"PENDING" | "PAID">("PAID");
  const [paidAtDate, setPaidAtDate] = useState("");
  const [payerType, setPayerType] = useState<"MEMBER" | "OTHER">("MEMBER");
  const [payerUserId, setPayerUserId] = useState("");
  const [payerOtherName, setPayerOtherName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer / UPI");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initForm = () => {
      if (payment) {
        setAmountRupees(String(paiseToRupees(payment.amountPaise)));
        setDueAtDate(payment.dueAt ? payment.dueAt.slice(0, 10) : "");
        setStatus(payment.status || "PAID");
        setPaidAtDate(payment.paidAt ? payment.paidAt.slice(0, 10) : "");
        setPayerType(payment.paidBy?.type || "MEMBER");
        setPayerUserId(payment.paidBy?.userId || "");
        setPayerOtherName(payment.paidBy?.name || "");
        setPaymentMethod(payment.paymentMethod || "Bank Transfer / UPI");
        setNotes(payment.notes || "");
      } else {
        // Default amount is remaining outstanding
        const defaultRupees = expense.outstandingAmountPaise
          ? paiseToRupees(expense.outstandingAmountPaise)
          : paiseToRupees(expense.totalAmountPaise);
        setAmountRupees(defaultRupees > 0 ? String(defaultRupees) : "");
        setDueAtDate("");
        setStatus("PAID");
        setPaidAtDate(new Date().toISOString().slice(0, 10));
        setPayerType("MEMBER");
        setPayerUserId(teamMembers.length > 0 ? teamMembers[0].userId : "");
        setPayerOtherName("");
        setPaymentMethod("Bank Transfer / UPI");
        setNotes("");
      }
      setError(null);
    };
    void Promise.resolve().then(initForm);
  }, [payment, expense, isOpen, teamMembers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountRupees);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid positive payment amount");
      return;
    }

    if (payerType === "MEMBER" && !payerUserId) {
      setError("Please select the team member who paid");
      return;
    }

    if (payerType === "OTHER" && !payerOtherName.trim()) {
      setError("Please enter the name of the payer");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        amountRupees: parsedAmount,
        dueAt: dueAtDate ? new Date(dueAtDate).toISOString() : undefined,
        status,
        paidAt: status === "PAID" && paidAtDate ? new Date(paidAtDate).toISOString() : undefined,
        paidBy: {
          type: payerType,
          userId: payerType === "MEMBER" ? payerUserId : undefined,
          name: payerType === "OTHER" ? payerOtherName.trim() : undefined,
        },
        paymentMethod: paymentMethod.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const url = payment
        ? `/api/v1/weddings/${weddingId}/expenses/${expense.id}/payments/${payment.id}`
        : `/api/v1/weddings/${weddingId}/expenses/${expense.id}/payments`;
      const method = payment ? "PATCH" : "POST";

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
        setError(data.error?.message || data.error || "Failed to save payment.");
      }
    } catch (err: unknown) {
      console.error("Error saving payment:", err);
      setError("Failed to save payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-container-high my-8 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b border-surface-container-high">
          <div>
            <h2 className="text-xl font-bold font-serif text-on-surface">
              {payment ? "Edit Payment Record" : "Record Payment / Schedule Instalment"}
            </h2>
            <p className="text-xs text-on-surface-variant truncate max-w-sm mt-0.5">
              Expense: <span className="font-semibold text-on-surface">{expense.title}</span>
            </p>
          </div>
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
                Payment Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "PENDING" | "PAID")}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold"
              >
                <option value="PAID">PAID (Recorded Payment)</option>
                <option value="PENDING">PENDING (Scheduled Instalment)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="e.g. 50000"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {status === "PAID" ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Paid Date
                </label>
                <input
                  type="date"
                  value={paidAtDate}
                  onChange={(e) => setPaidAtDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueAtDate}
                  onChange={(e) => setDueAtDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="Bank Transfer / UPI">Bank Transfer / UPI</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Payer Attribution Section */}
          <div className="p-4 bg-surface-container-low rounded-xl border border-surface-container-high space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Who Paid / Responsible Payer *
            </label>

            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-on-surface">
                <input
                  type="radio"
                  name="payerType"
                  value="MEMBER"
                  checked={payerType === "MEMBER"}
                  onChange={() => setPayerType("MEMBER")}
                  className="text-primary focus:ring-primary"
                />
                Team / Family Member
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-on-surface">
                <input
                  type="radio"
                  name="payerType"
                  value="OTHER"
                  checked={payerType === "OTHER"}
                  onChange={() => setPayerType("OTHER")}
                  className="text-primary focus:ring-primary"
                />
                Other External Payer
              </label>
            </div>

            {payerType === "MEMBER" ? (
              <div>
                <select
                  value={payerUserId}
                  onChange={(e) => setPayerUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select Member...</option>
                  {teamMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.userName} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="e.g. Groom's Uncle / Relative"
                  value={payerOtherName}
                  onChange={(e) => setPayerOtherName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Payment Notes & Transaction Ref
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Advance paid via Google Pay. Ref: UPI/32871..."
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
              {payment ? "Save Changes" : status === "PAID" ? "Record Payment" : "Schedule Instalment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
