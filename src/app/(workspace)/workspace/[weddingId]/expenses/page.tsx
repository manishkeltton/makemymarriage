"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { ExpenseDTO, ExpensePaymentDTO, FinanceSummaryDTO, EXPENSE_CATEGORIES } from "@/modules/expenses/dto/expense.dto";
import { EventDTO } from "@/modules/events/dto/event.dto";
import { VendorDTO } from "@/modules/vendors/dto/vendor.dto";
import { TeamMemberDTO } from "@/modules/team/dto/team.dto";
import { ExpenseFormModal } from "@/components/expenses/ExpenseFormModal";
import { PaymentFormModal } from "@/components/expenses/PaymentFormModal";
import { ExpenseDetailDrawer } from "@/components/expenses/ExpenseDetailDrawer";
import { formatINR } from "@/lib/utils/money";

interface ExpensesPageProps {
  params: Promise<{ weddingId: string }>;
}

export default function ExpensesPage({ params }: ExpensesPageProps) {
  const { weddingId } = use(params);

  const [activeTab, setActiveTab] = useState<"expenses" | "payments" | "payers">("expenses");

  const [expenses, setExpenses] = useState<ExpenseDTO[]>([]);
  const [payments, setPayments] = useState<ExpensePaymentDTO[]>([]);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [vendors, setVendors] = useState<VendorDTO[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberDTO[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummaryDTO | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState("");

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDTO | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [targetExpenseForPayment, setTargetExpenseForPayment] = useState<ExpenseDTO | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedExpenseForDrawer, setSelectedExpenseForDrawer] = useState<ExpenseDTO | null>(null);

  const fetchWorkspaceFinanceData = useCallback(async () => {
    try {
      const expQuery = new URLSearchParams({ limit: "200" });
      if (selectedCategory) expQuery.append("category", selectedCategory);
      if (selectedApprovalStatus) expQuery.append("approvalStatus", selectedApprovalStatus);
      if (searchQuery.trim()) expQuery.append("q", searchQuery.trim());

      const [expensesRes, summaryRes, paymentsRes, eventsRes, vendorsRes, membersRes] =
        await Promise.all([
          fetch(`/api/v1/weddings/${weddingId}/expenses?${expQuery.toString()}`),
          fetch(`/api/v1/weddings/${weddingId}/finance/summary`),
          fetch(`/api/v1/weddings/${weddingId}/payments?limit=200`),
          fetch(`/api/v1/weddings/${weddingId}/events`),
          fetch(`/api/v1/weddings/${weddingId}/vendors`),
          fetch(`/api/v1/weddings/${weddingId}/members`),
        ]);

      const [expensesData, summaryData, paymentsData, eventsData, vendorsData, membersData] =
        await Promise.all([
          expensesRes.json(),
          summaryRes.json(),
          paymentsRes.json(),
          eventsRes.json(),
          vendorsRes.json(),
          membersRes.json(),
        ]);

      if (expensesData.success) {
        setExpenses(expensesData.data || []);
      }
      if (summaryData.success) {
        setFinanceSummary(summaryData.data || null);
      }
      if (paymentsData.success) {
        setPayments(paymentsData.data || []);
      }
      if (eventsData.success) {
        setEvents(eventsData.data || []);
      }
      if (vendorsData.success) {
        setVendors(vendorsData.data || []);
      }
      if (membersData.success) {
        setTeamMembers(membersData.data || []);
      }
    } catch (err: unknown) {
      console.error("Error fetching workspace finance data:", err);
      setError("Failed to load financial records.");
    } finally {
      setLoading(false);
    }
  }, [weddingId, selectedCategory, selectedApprovalStatus, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        await fetchWorkspaceFinanceData();
      }
    };
    void load();

    return () => {
      isMounted = false;
    };
  }, [fetchWorkspaceFinanceData]);

  const handleCreateExpense = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: ExpenseDTO) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = async (expense: ExpenseDTO) => {
    if (!confirm(`Are you sure you want to delete expense "${expense.title}"?`)) return;

    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/expenses/${expense.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchWorkspaceFinanceData();
      } else {
        alert(data.error?.message || "Failed to delete expense.");
      }
    } catch (err: unknown) {
      console.error("Error deleting expense:", err);
      alert("Failed to delete expense.");
    }
  };

  const handleRecordPayment = (expense: ExpenseDTO) => {
    setTargetExpenseForPayment(expense);
    setIsPaymentModalOpen(true);
  };

  const handleOpenDrawer = (expense: ExpenseDTO) => {
    setSelectedExpenseForDrawer(expense);
    setIsDrawerOpen(true);
  };

  const handleApprovalQuick = async (expense: ExpenseDTO, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/expenses/${expense.id}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus: status }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchWorkspaceFinanceData();
      } else {
        alert(data.error?.message || "Failed to set approval status.");
      }
    } catch (err: unknown) {
      console.error("Error setting approval status:", err);
      alert("Failed to set approval status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-on-surface">Expenses & Budget Management</h1>
          <p className="text-sm text-on-surface-variant">
            Track wedding budgets, single-step approvals, instalment schedules, and payer attributions.
          </p>
        </div>
        <button
          onClick={handleCreateExpense}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-medium text-sm shadow-md hover:bg-primary/90 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add Expense
        </button>
      </div>

      {/* KPI Stats Bar */}
      {financeSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Budget</div>
            <div className="text-xl font-bold font-mono text-on-surface mt-1">
              {formatINR(financeSummary.totalBudgetPaise)}
            </div>
            {financeSummary.pendingApprovalCount > 0 && (
              <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-1">
                {financeSummary.pendingApprovalCount} pending review
              </div>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Paid</div>
            <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
              {formatINR(financeSummary.totalPaidPaise)}
            </div>
            <div className="text-[11px] text-on-surface-variant mt-1">Confirmed payments</div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Outstanding</div>
            <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
              {formatINR(financeSummary.totalOutstandingPaise)}
            </div>
            <div className="text-[11px] text-on-surface-variant mt-1">Remaining to pay</div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Overdue Payments</div>
            <div className="text-xl font-bold font-mono text-error mt-1">
              {formatINR(financeSummary.totalOverduePaise)}
            </div>
            <div className="text-[11px] text-error font-medium mt-1">
              {financeSummary.overduePaymentsCount} instalments overdue
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-surface-container-high gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("expenses")}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === "expenses"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          All Expenses ({expenses.length})
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === "payments"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Payment Schedule ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab("payers")}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === "payers"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Payer Attribution ({financeSummary?.payerBreakdown?.length || 0})
        </button>
      </div>

      {/* Tab Content: Expenses List */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                search
              </span>
              <input
                type="text"
                placeholder="Search expenses by title or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace("_", " ")}
                </option>
              ))}
            </select>

            <select
              value={selectedApprovalStatus}
              onChange={(e) => setSelectedApprovalStatus(e.target.value)}
              className="px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Approvals</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center items-center text-on-surface-variant gap-3">
              <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
              <span className="text-sm font-medium">Loading expenses...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-error-container text-on-error-container rounded-2xl text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          ) : expenses.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-12 border border-surface-container-high text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary-container/30 text-primary flex items-center justify-center mx-auto text-3xl">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface font-serif">No Expenses Recorded</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Start tracking your wedding budget, venue deposits, decorator advances, and catering bills.
                </p>
              </div>
              <button
                onClick={handleCreateExpense}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Add First Expense
              </button>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-low text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-surface-container-high">
                    <tr>
                      <th className="py-3 px-4">Expense Title</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Ceremony / Vendor</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4 text-right">Paid</th>
                      <th className="py-3 px-4 text-center">Approval</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high text-on-surface">
                    {expenses.map((expense) => {
                      const totalPaise = expense.totalAmountPaise;
                      const paidPaise = expense.paidAmountPaise || 0;
                      const isPendingApproval = expense.approvalStatus === "PENDING";
                      const isApproved = expense.approvalStatus === "APPROVED";
                      const isRejected = expense.approvalStatus === "REJECTED";

                      return (
                        <tr key={expense.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-3.5 px-4 font-semibold">
                            <button
                              onClick={() => handleOpenDrawer(expense)}
                              className="hover:text-primary transition-colors text-left"
                            >
                              {expense.title}
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-lg bg-surface-container text-on-surface-variant text-xs font-medium">
                              {expense.category.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-on-surface-variant">
                            {expense.eventName && <div className="font-medium text-on-surface">{expense.eventName}</div>}
                            {expense.vendorName && <div>{expense.vendorName}</div>}
                            {!expense.eventName && !expense.vendorName && <span className="text-on-surface-variant/50">—</span>}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold">
                            {formatINR(totalPaise)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-medium">
                            <div className="text-emerald-700 dark:text-emerald-400">{formatINR(paidPaise)}</div>
                            <div className="text-[10px] text-on-surface-variant">
                              {expense.paymentStatus}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                                isApproved
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : isRejected
                                  ? "bg-error-container text-on-error-container"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {expense.approvalStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isPendingApproval && (
                                <button
                                  onClick={() => handleApprovalQuick(expense, "APPROVED")}
                                  className="p-1 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950 rounded-lg transition-colors"
                                  title="Approve Expense"
                                >
                                  <span className="material-symbols-outlined text-lg">check_circle</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleRecordPayment(expense)}
                                className="p-1 text-primary hover:bg-primary-container/30 rounded-lg transition-colors"
                                title="Record Payment"
                              >
                                <span className="material-symbols-outlined text-lg">add_card</span>
                              </button>
                              <button
                                onClick={() => handleOpenDrawer(expense)}
                                className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                                title="View Details"
                              >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                              <button
                                onClick={() => handleEditExpense(expense)}
                                className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                                title="Edit Expense"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense)}
                                className="p-1 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-lg transition-colors"
                                title="Delete Expense"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Payment Schedule */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden shadow-xs">
            {payments.length === 0 ? (
              <div className="p-8 text-center text-sm text-on-surface-variant">
                No payment instalments or recorded payments found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-low text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-surface-container-high">
                    <tr>
                      <th className="py-3 px-4">Expense / Vendor</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Paid By</th>
                      <th className="py-3 px-4">Date / Due</th>
                      <th className="py-3 px-4 text-right">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high text-on-surface">
                    {payments.map((p) => {
                      const isPaid = p.status === "PAID";
                      const isOverdue = p.effectiveStatus === "OVERDUE";

                      return (
                        <tr key={p.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold">{p.expenseTitle || "Expense"}</div>
                            {p.vendorName && <div className="text-xs text-on-surface-variant">{p.vendorName}</div>}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold">
                            {formatINR(p.amountPaise)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                                isPaid
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : isOverdue
                                  ? "bg-error-container text-on-error-container"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {p.effectiveStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium">
                            {p.payerName || "Team Member"}
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            {isPaid && p.paidAt && (
                              <span>Paid: {new Date(p.paidAt).toLocaleDateString()}</span>
                            )}
                            {!isPaid && p.dueAt && (
                              <span className={isOverdue ? "text-error font-bold" : ""}>
                                Due: {new Date(p.dueAt).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right text-xs text-on-surface-variant">
                            {p.paymentMethod || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Payer Attribution */}
      {activeTab === "payers" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {financeSummary?.payerBreakdown?.map((payer, idx) => (
              <div
                key={idx}
                className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high shadow-xs space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded-lg bg-surface-container text-on-surface-variant text-[11px] font-bold tracking-wider uppercase">
                    {payer.type}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {payer.count} payment{payer.count === 1 ? "" : "s"}
                  </span>
                </div>
                <h3 className="text-base font-bold text-on-surface font-serif">{payer.name}</h3>
                <div className="pt-2 border-t border-surface-container">
                  <div className="text-xs text-on-surface-variant">Total Contribution Paid</div>
                  <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {formatINR(payer.totalPaidPaise)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals & Drawer */}
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        weddingId={weddingId}
        expense={editingExpense}
        events={events}
        vendors={vendors}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={fetchWorkspaceFinanceData}
      />

      {targetExpenseForPayment && (
        <PaymentFormModal
          isOpen={isPaymentModalOpen}
          weddingId={weddingId}
          expense={targetExpenseForPayment}
          teamMembers={teamMembers}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setTargetExpenseForPayment(null);
          }}
          onSuccess={fetchWorkspaceFinanceData}
        />
      )}

      <ExpenseDetailDrawer
        isOpen={isDrawerOpen}
        weddingId={weddingId}
        expense={selectedExpenseForDrawer}
        teamMembers={teamMembers}
        onClose={() => setIsDrawerOpen(false)}
        onExpenseUpdated={fetchWorkspaceFinanceData}
      />
    </div>
  );
}
