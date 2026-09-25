"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ExpenseDTO, ExpensePaymentDTO } from "@/modules/expenses/dto/expense.dto";
import { DocumentDTO } from "@/modules/documents/dto/document.dto";
import { TeamMemberDTO } from "@/modules/team/dto/team.dto";
import { formatINR } from "@/lib/utils/money";
import { PaymentFormModal } from "./PaymentFormModal";

interface ExpenseDetailDrawerProps {
  isOpen: boolean;
  weddingId: string;
  expense: ExpenseDTO | null;
  teamMembers: TeamMemberDTO[];
  onClose: () => void;
  onExpenseUpdated: () => void;
}

export function ExpenseDetailDrawer({
  isOpen,
  weddingId,
  expense,
  teamMembers,
  onClose,
  onExpenseUpdated,
}: ExpenseDetailDrawerProps) {
  const [payments, setPayments] = useState<ExpensePaymentDTO[]>([]);
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [approvalNote, setApprovalNote] = useState("");
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ExpensePaymentDTO | null>(null);

  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState<"CONTRACT" | "INVOICE" | "RECEIPT" | "OTHER">("INVOICE");
  const [newDocFileKey, setNewDocFileKey] = useState("");
  const [addingDoc, setAddingDoc] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!expense) return;
    setLoadingPayments(true);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/expenses/${expense.id}/payments`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPayments(data.data || []);
      }
    } catch (err: unknown) {
      console.error("Error fetching expense payments:", err);
    } finally {
      setLoadingPayments(false);
    }
  }, [weddingId, expense]);

  const fetchExpenseDocuments = useCallback(async () => {
    if (!expense) return;
    setLoadingDocs(true);
    try {
      const query = new URLSearchParams({
        relatedType: "EXPENSE",
        relatedId: expense.id,
      });
      const res = await fetch(`/api/v1/weddings/${weddingId}/documents?${query.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDocuments(data.data || []);
      }
    } catch (err: unknown) {
      console.error("Error fetching expense documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  }, [weddingId, expense]);

  useEffect(() => {
    if (isOpen && expense) {
      void (async () => {
        await Promise.all([fetchPayments(), fetchExpenseDocuments()]);
      })();
    }
  }, [isOpen, expense, fetchPayments, fetchExpenseDocuments]);

  if (!isOpen || !expense) return null;

  const handleApproval = async (status: "APPROVED" | "REJECTED") => {
    setApproving(true);
    setApprovalError(null);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/expenses/${expense.id}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus: status, note: approvalNote.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setApprovalNote("");
        onExpenseUpdated();
      } else {
        setApprovalError(data.error?.message || "Failed to update approval status.");
      }
    } catch (err: unknown) {
      console.error("Error updating approval status:", err);
      setApprovalError("Failed to update approval status.");
    } finally {
      setApproving(false);
    }
  };

  const handleAddPayment = () => {
    setEditingPayment(null);
    setIsPaymentModalOpen(true);
  };

  const handleEditPayment = (payment: ExpensePaymentDTO) => {
    setEditingPayment(payment);
    setIsPaymentModalOpen(true);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payment record?")) return;
    try {
      const res = await fetch(
        `/api/v1/weddings/${weddingId}/expenses/${expense.id}/payments/${paymentId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        fetchPayments();
        onExpenseUpdated();
      } else {
        alert(data.error?.message || "Failed to delete payment.");
      }
    } catch (err: unknown) {
      console.error("Error deleting payment:", err);
      alert("Failed to delete payment.");
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    setAddingDoc(true);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDocTitle.trim(),
          type: newDocType,
          relatedTo: {
            type: "EXPENSE",
            id: expense.id,
          },
          fileKey: newDocFileKey.trim() || `expenses/${expense.id}/${Date.now()}`,
          mimeType: "application/pdf",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNewDocTitle("");
        setNewDocFileKey("");
        fetchExpenseDocuments();
        onExpenseUpdated();
      } else {
        alert(data.error?.message || "Failed to attach document.");
      }
    } catch (err: unknown) {
      console.error("Error attaching document:", err);
      alert("Failed to attach document.");
    } finally {
      setAddingDoc(false);
    }
  };

  const totalPaise = expense.totalAmountPaise;
  const paidPaise = expense.paidAmountPaise || 0;
  const outstandingPaise = Math.max(0, totalPaise - paidPaise);
  const progressPct = totalPaise > 0 ? Math.min(100, Math.round((paidPaise / totalPaise) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-on-surface/30 backdrop-blur-xs flex justify-end">
      <div className="bg-surface-container-lowest w-full max-w-2xl h-full shadow-2xl border-l border-surface-container-high flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-surface-container-high flex justify-between items-start bg-surface-container-low/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-surface-container text-on-surface-variant text-[11px] font-bold tracking-wider uppercase">
                {expense.category.replace("_", " ")}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                  expense.approvalStatus === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : expense.approvalStatus === "REJECTED"
                    ? "bg-error-container text-on-error-container"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {expense.approvalStatus}
              </span>
            </div>
            <h2 className="text-xl font-bold font-serif text-on-surface">{expense.title}</h2>
            {expense.vendorName && (
              <p className="text-xs text-on-surface-variant">Vendor: {expense.vendorName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface rounded-xl hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Financial Summary Box */}
          <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-container-high space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">Total</div>
                <div className="text-base font-bold font-mono text-on-surface mt-0.5">{formatINR(totalPaise)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">Paid</div>
                <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {formatINR(paidPaise)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">Outstanding</div>
                <div className="text-base font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5">
                  {formatINR(outstandingPaise)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Single-Step Approval Section */}
          <div className="p-4 bg-surface-container-lowest rounded-2xl border border-surface-container-high space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Single-Step Approval Workflow
            </h3>

            {expense.approval ? (
              <div className="text-xs space-y-1 text-on-surface-variant bg-surface-container-low p-3 rounded-xl">
                <div>
                  Status: <span className="font-bold text-on-surface">{expense.approvalStatus}</span>
                </div>
                {expense.approval.decidedByName && (
                  <div>Decided by: <span className="font-medium text-on-surface">{expense.approval.decidedByName}</span></div>
                )}
                {expense.approval.decidedAt && (
                  <div>Decided on: <span className="font-medium text-on-surface">{new Date(expense.approval.decidedAt).toLocaleString()}</span></div>
                )}
                {expense.approval.note && (
                  <div className="italic text-on-surface mt-1">&quot;{expense.approval.note}&quot;</div>
                )}
              </div>
            ) : null}

            {approvalError && (
              <div className="p-2.5 bg-error-container text-on-error-container rounded-xl text-xs font-medium">
                {approvalError}
              </div>
            )}

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Optional approval/rejection note..."
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={approving || expense.approvalStatus === "APPROVED"}
                  onClick={() => handleApproval("APPROVED")}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Approve Expense
                </button>

                <button
                  type="button"
                  disabled={approving || expense.approvalStatus === "REJECTED"}
                  onClick={() => handleApproval("REJECTED")}
                  className="flex-1 py-2 rounded-xl bg-error hover:bg-error/90 text-on-error font-semibold text-xs shadow-xs transition-all disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">cancel</span>
                  Reject Expense
                </button>
              </div>
            </div>
          </div>

          {/* Payment Instalments History Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Payment History & Instalments ({payments.length})
              </h3>
              <button
                onClick={handleAddPayment}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Record Payment
              </button>
            </div>

            {loadingPayments ? (
              <div className="py-4 text-center text-xs text-on-surface-variant">Loading payments...</div>
            ) : payments.length === 0 ? (
              <div className="p-4 bg-surface-container-low rounded-xl text-center text-xs text-on-surface-variant">
                No payment instalments recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => {
                  const isPaid = p.status === "PAID";
                  const isOverdue = p.effectiveStatus === "OVERDUE";

                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-surface-container-lowest border border-surface-container-high rounded-xl flex items-center justify-between text-xs hover:border-outline/30 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface font-mono text-sm">
                            {formatINR(p.amountPaise)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : isOverdue
                                ? "bg-error-container text-on-error-container"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {p.effectiveStatus}
                          </span>
                        </div>
                        <div className="text-on-surface-variant flex items-center gap-2 text-[11px]">
                          <span>Paid by: {p.payerName || "Team Member"}</span>
                          {p.paymentMethod && <span>• {p.paymentMethod}</span>}
                        </div>
                        {isPaid && p.paidAt && (
                          <div className="text-[10px] text-on-surface-variant/70">
                            Paid on: {new Date(p.paidAt).toLocaleDateString()}
                          </div>
                        )}
                        {!isPaid && p.dueAt && (
                          <div className="text-[10px] text-on-surface-variant/70">
                            Due on: {new Date(p.dueAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditPayment(p)}
                          className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                          title="Edit Payment"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-1 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-lg transition-colors"
                          title="Delete Payment"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Linked Documents & Contracts Vault Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Contracts, Invoices & Receipts ({documents.length})
            </h3>

            {loadingDocs ? (
              <div className="py-4 text-center text-xs text-on-surface-variant">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="p-4 bg-surface-container-low rounded-xl text-center text-xs text-on-surface-variant">
                No documents or receipts linked to this expense yet.
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-surface-container-lowest border border-surface-container-high rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">description</span>
                      <div>
                        <div className="font-semibold text-on-surface">{doc.title}</div>
                        <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                          {doc.type}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Attach Document Form */}
            <form onSubmit={handleAddDocument} className="pt-2 flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Document Title (e.g. Invoice #104)"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-surface-container-low border border-outline/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as "CONTRACT" | "INVOICE" | "RECEIPT" | "OTHER")}
                  className="px-2.5 py-1.5 bg-surface-container-low border border-outline/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="INVOICE">INVOICE</option>
                  <option value="CONTRACT">CONTRACT</option>
                  <option value="RECEIPT">RECEIPT</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={addingDoc || !newDocTitle.trim()}
                className="py-1.5 px-3 bg-surface-container-high hover:bg-surface-container text-on-surface rounded-xl font-semibold text-xs transition-colors self-end flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">attach_file</span>
                Link Document
              </button>
            </form>
          </div>
        </div>

        {/* Modal for adding/editing payments */}
        <PaymentFormModal
          isOpen={isPaymentModalOpen}
          weddingId={weddingId}
          expense={expense}
          payment={editingPayment}
          teamMembers={teamMembers}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={() => {
            fetchPayments();
            onExpenseUpdated();
          }}
        />
      </div>
    </div>
  );
}
