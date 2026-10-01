"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EventDTO } from "@/modules/events/dto/event.dto";
import { VendorDTO } from "@/modules/vendors/dto/vendor.dto";
import { ExpenseDTO } from "@/modules/expenses/dto/expense.dto";
import { TeamMemberDTO } from "@/modules/team/dto/team.dto";
import { formatINR } from "@/lib/utils/money";
import { EventFormModal } from "./event-form-modal";
import { DeleteEventModal } from "./delete-event-modal";
import { VendorFormModal } from "@/components/vendors/VendorFormModal";
import { ExpenseFormModal } from "@/components/expenses/ExpenseFormModal";
import { ExpenseDetailDrawer } from "@/components/expenses/ExpenseDetailDrawer";

interface EventDetailViewProps {
  weddingId: string;
  initialEvent: EventDTO;
}

type ActiveTab = "overview" | "tasks" | "vendors" | "expenses" | "documents";

function formatDateDetails(isoStart: string, isoEnd?: string) {
  const start = new Date(isoStart);
  const startDateStr = start.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const startTimeStr = start.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  let endTimeStr = "";
  if (isoEnd) {
    const end = new Date(isoEnd);
    endTimeStr = end.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return { startDateStr, startTimeStr, endTimeStr };
}

export function EventDetailView({ weddingId, initialEvent }: EventDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as ActiveTab | null;

  const [event, setEvent] = useState<EventDTO>(initialEvent);
  const [activeTabState, setActiveTabState] = useState<ActiveTab | null>(null);
  const activeTab: ActiveTab = activeTabState ?? (urlTab && ["overview", "vendors", "expenses"].includes(urlTab) ? urlTab : "overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Vendor Tab State
  const [eventVendors, setEventVendors] = useState<VendorDTO[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [isLinkVendorOpen, setIsLinkVendorOpen] = useState(false);
  const [allWorkspaceVendors, setAllWorkspaceVendors] = useState<VendorDTO[]>([]);
  const [loadingAllVendors, setLoadingAllVendors] = useState(false);
  const [linkingVendorId, setLinkingVendorId] = useState<string | null>(null);
  const [isCreateVendorOpen, setIsCreateVendorOpen] = useState(false);

  // Expenses Tab State
  const [eventExpenses, setEventExpenses] = useState<ExpenseDTO[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [isCreateExpenseOpen, setIsCreateExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDTO | null>(null);
  const [isExpenseDrawerOpen, setIsExpenseDrawerOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMemberDTO[]>([]);
  const [allEventsList, setAllEventsList] = useState<EventDTO[]>([]);

  const refreshEvent = async () => {
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/events/${event.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setEvent(data.data);
      }
      router.refresh();
    } catch (err) {
      console.error("Error refreshing event:", err);
      router.refresh();
    }
  };

  const fetchEventVendors = useCallback(async () => {
    setLoadingVendors(true);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/vendors?eventId=${event.id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEventVendors(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching event vendors:", err);
    } finally {
      setLoadingVendors(false);
    }
  }, [weddingId, event.id]);

  const fetchEventExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/expenses?eventId=${event.id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEventExpenses(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching event expenses:", err);
    } finally {
      setLoadingExpenses(false);
    }
  }, [weddingId, event.id]);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/members`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTeamMembers(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching team members:", err);
    }
  }, [weddingId]);

  const fetchAllEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/events`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAllEventsList(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching events list:", err);
    }
  }, [weddingId]);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (!isMounted) return;
      if (activeTab === "vendors") {
        void fetchEventVendors();
        void fetchAllEvents();
      } else if (activeTab === "expenses") {
        void fetchEventExpenses();
        void fetchTeamMembers();
        void fetchEventVendors();
        void fetchAllEvents();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeTab, fetchEventVendors, fetchEventExpenses, fetchTeamMembers, fetchAllEvents]);

  const handleDeleted = () => {
    router.push(`/workspace/${weddingId}/events`);
  };

  const handleTabClick = (tabId: ActiveTab) => {
    if (tabId === "tasks") {
      router.push(`/workspace/${weddingId}/tasks?eventId=${event.id}`);
    } else if (tabId === "documents") {
      router.push(`/workspace/${weddingId}/documents?eventId=${event.id}`);
    } else {
      setActiveTabState(tabId);
      router.replace(`/workspace/${weddingId}/events/${event.id}?tab=${tabId}`, { scroll: false });
    }
  };

  // Vendor Linking & Unlinking
  const openLinkVendorModal = async () => {
    setIsLinkVendorOpen(true);
    setLoadingAllVendors(true);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/vendors`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAllWorkspaceVendors(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching all vendors:", err);
    } finally {
      setLoadingAllVendors(false);
    }
  };

  const handleLinkVendor = async (vendorId: string) => {
    setLinkingVendorId(vendorId);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/vendors/${vendorId}/events/${event.id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchEventVendors();
        setIsLinkVendorOpen(false);
      } else {
        alert(data.error?.message || "Failed to link vendor to ceremony.");
      }
    } catch (err) {
      console.error("Error linking vendor:", err);
      alert("Failed to link vendor to ceremony.");
    } finally {
      setLinkingVendorId(null);
    }
  };

  const handleUnlinkVendor = async (vendorId: string, vendorName: string) => {
    if (!confirm(`Are you sure you want to remove vendor "${vendorName}" from ${event.name}?`)) return;

    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/vendors/${vendorId}/events/${event.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEventVendors((prev) => prev.filter((v) => v.id !== vendorId));
      } else {
        alert(data.error?.message || "Failed to unlink vendor.");
      }
    } catch (err) {
      console.error("Error unlinking vendor:", err);
      alert("Failed to unlink vendor.");
    }
  };

  // Calculate Ceremony Financial Metrics
  const activeExpenses = eventExpenses.filter((e) => e.approvalStatus !== "REJECTED");
  const totalCeremonyExpensesPaise = activeExpenses.reduce((sum, e) => sum + (e.totalAmountPaise || 0), 0);
  const totalCeremonyPaidPaise = activeExpenses.reduce((sum, e) => sum + (e.paidAmountPaise || 0), 0);
  const totalCeremonyOutstandingPaise = activeExpenses.reduce(
    (sum, e) => sum + Math.max(0, (e.totalAmountPaise || 0) - (e.paidAmountPaise || 0)),
    0
  );

  const { startDateStr, startTimeStr, endTimeStr } = formatDateDetails(
    event.startAt,
    event.endAt
  );

  return (
    <div className="space-y-6 w-full text-on-surface antialiased">
      {/* Back Link */}
      <div>
        <Link
          href={`/workspace/${weddingId}/events`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Events &amp; Timeline</span>
        </Link>
      </div>

      {/* Main Header Banner */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-container-high/60 shadow-xs relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-fixed text-on-primary-fixed-variant border border-primary-container/20">
                {event.type}
              </span>
              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">schedule</span>
                {startDateStr}
              </span>
            </div>

            <h1 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              {event.name}
            </h1>

            {event.description && (
              <p className="font-body-md text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-start">
            <button
              onClick={() => setIsEditOpen(true)}
              type="button"
              className="px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center gap-1.5 transition-colors border border-surface-container-high/60 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span>Edit Event</span>
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              type="button"
              className="px-4 py-2 rounded-lg bg-error-container/30 hover:bg-error-container/60 text-error font-semibold text-xs flex items-center gap-1.5 transition-colors border border-error/20 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-surface-container-high/40 text-xs text-on-surface-variant">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="material-symbols-outlined text-[18px] text-primary-container">
              schedule
            </span>
            <span>
              {startTimeStr} {endTimeStr ? ` - ${endTimeStr}` : ""}
            </span>
          </div>

          {event.venue?.name && (
            <div className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[18px] text-primary-container">
                location_on
              </span>
              <span>
                {event.venue.name}
                {event.venue.city ? `, ${event.venue.city}` : ""}
              </span>
            </div>
          )}

          {event.dressCode && (
            <div className="flex items-center gap-1.5 font-medium bg-surface-container-low px-2.5 py-1 rounded-md border border-surface-container-high/50">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                checkroom
              </span>
              <span>Dress Code: {event.dressCode}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-surface-container-high/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: "overview", label: "Overview", icon: "dashboard" },
          { id: "tasks", label: "Tasks", icon: "check_circle" },
          { id: "vendors", label: "Vendors", icon: "villa" },
          { id: "expenses", label: "Expenses", icon: "payments" },
          { id: "documents", label: "Documents", icon: "folder_open" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id as ActiveTab)}
            className={`px-4 py-3 font-label-md text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "border-primary-container text-primary-container"
                : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high/60 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high/40">
                <span className="material-symbols-outlined text-primary-container text-[20px]">
                  calendar_clock
                </span>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Date &amp; Timing
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-surface-container-low space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">
                    Ceremony Date
                  </span>
                  <span className="text-sm font-bold text-on-surface">{startDateStr}</span>
                </div>

                <div className="p-3.5 rounded-lg bg-surface-container-low space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">
                    Time Window
                  </span>
                  <span className="text-sm font-bold text-on-surface">
                    {startTimeStr} {endTimeStr ? ` to ${endTimeStr}` : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high/60 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">
                    location_on
                  </span>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Venue Details
                  </h3>
                </div>
              </div>

              {event.venue && (event.venue.name || event.venue.city) ? (
                <div className="space-y-3">
                  {event.venue.name && (
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">
                        Venue Name
                      </span>
                      <span className="text-base font-bold text-on-surface">
                        {event.venue.name}
                      </span>
                    </div>
                  )}

                  {(event.venue.addressLine1 || event.venue.city || event.venue.state) && (
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">
                        Full Address
                      </span>
                      <p className="text-sm text-on-surface leading-relaxed">
                        {[
                          event.venue.addressLine1,
                          event.venue.addressLine2,
                          event.venue.locality,
                          event.venue.city,
                          event.venue.state,
                          event.venue.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant italic">
                  No venue details specified yet. Click Edit Event to add location info.
                </p>
              )}
            </div>

            {event.notes && (
              <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high/60 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high/40">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">
                    sticky_note_2
                  </span>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Internal Notes &amp; Instructions
                  </h3>
                </div>
                <p className="font-body-md text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed">
                  {event.notes}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high/60 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high/40">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  checkroom
                </span>
                <h3 className="font-headline-sm text-sm font-bold text-on-surface">Dress Code</h3>
              </div>

              {event.dressCode ? (
                <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-container-high/50 text-center">
                  <span className="text-sm font-bold text-on-surface">{event.dressCode}</span>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant italic">No dress code specified.</p>
              )}
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high/60 shadow-xs space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block pb-2 border-b border-surface-container-high/40">
                Information
              </span>
              <div className="text-xs space-y-2 text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Event ID:</span>
                  <span className="font-mono text-on-surface">{event.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created At:</span>
                  <span className="text-on-surface">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="text-on-surface">
                    {new Date(event.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: VENDORS */}
      {activeTab === "vendors" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-on-surface">Associated Vendors</h2>
              <p className="text-xs text-on-surface-variant">
                Service providers and vendors linked specifically to {event.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openLinkVendorModal}
                className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs border border-surface-container-high flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">link</span>
                <span>Link Existing Vendor</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreateVendorOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Add Vendor</span>
              </button>
            </div>
          </div>

          {loadingVendors ? (
            <div className="p-12 text-center text-xs text-on-surface-variant flex flex-col items-center justify-center gap-2">
              <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p>Loading ceremony vendors...</p>
            </div>
          ) : eventVendors.length === 0 ? (
            <div className="p-12 bg-surface-container-lowest rounded-2xl border border-surface-container-high text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary-container mx-auto">
                <span className="material-symbols-outlined text-[24px]">villa</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-on-surface">No Vendors Linked to {event.name}</h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  Link an existing wedding vendor or add a new vendor associated with this ceremony.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={openLinkVendorModal}
                  className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold border border-surface-container-high transition-colors"
                >
                  Link Vendor
                </button>
                <button
                  onClick={() => setIsCreateVendorOpen(true)}
                  className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold shadow-xs transition-colors"
                >
                  Add Vendor
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventVendors.map((v) => (
                <div
                  key={v.id}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs flex flex-col justify-between space-y-4 hover:border-primary-container/40 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary-container font-bold text-[10px] uppercase tracking-wider">
                        {v.category.replace("_", " ")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUnlinkVendor(v.id, v.name)}
                        className="p-1 text-on-surface-variant hover:text-error transition-colors"
                        title="Unlink vendor from ceremony"
                      >
                        <span className="material-symbols-outlined text-[18px]">link_off</span>
                      </button>
                    </div>

                    <h3 className="font-bold text-base text-on-surface leading-snug">{v.name}</h3>

                    {v.contactPerson && (
                      <p className="text-xs text-on-surface-variant">Contact: {v.contactPerson}</p>
                    )}

                    <div className="text-xs text-on-surface-variant space-y-1">
                      {v.phone && (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">call</span>
                          <span>{v.phone}</span>
                        </div>
                      )}
                      {v.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="material-symbols-outlined text-[16px]">mail</span>
                          <span className="truncate">{v.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-surface-container-high/40 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Agreed Amount:</span>
                      <span className="font-bold text-on-surface">
                        {v.financials?.agreedAmountPaise ? formatINR(v.financials.agreedAmountPaise) : "₹0"}
                      </span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Paid:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {v.financials?.totalPaidPaise ? formatINR(v.financials.totalPaidPaise) : "₹0"}
                      </span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Outstanding:</span>
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        {v.financials?.totalOutstandingPaise ? formatINR(v.financials.totalOutstandingPaise) : "₹0"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: EXPENSES */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-on-surface">Ceremony Financial Summary</h2>
              <p className="text-xs text-on-surface-variant">
                Budget tracking and payment instalments for {event.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateExpenseOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Add Expense</span>
            </button>
          </div>

          {/* Financial Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Total Expenses
              </span>
              <div className="text-xl font-bold font-mono text-on-surface">
                {formatINR(totalCeremonyExpensesPaise)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Confirmed Paid
              </span>
              <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {formatINR(totalCeremonyPaidPaise)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Outstanding Balance
              </span>
              <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">
                {formatINR(totalCeremonyOutstandingPaise)}
              </div>
            </div>
          </div>

          {/* Expense Roster */}
          {loadingExpenses ? (
            <div className="p-12 text-center text-xs text-on-surface-variant flex flex-col items-center justify-center gap-2">
              <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p>Loading ceremony expenses...</p>
            </div>
          ) : eventExpenses.length === 0 ? (
            <div className="p-12 bg-surface-container-lowest rounded-2xl border border-surface-container-high text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary-container mx-auto">
                <span className="material-symbols-outlined text-[24px]">payments</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-on-surface">No Expenses Linked to {event.name}</h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  Track catering deposits, venue fees, decor invoices, and ceremony expenses.
                </p>
              </div>
              <button
                onClick={() => setIsCreateExpenseOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold shadow-xs transition-colors"
              >
                Add First Expense
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {eventExpenses.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => {
                    setSelectedExpense(exp);
                    setIsExpenseDrawerOpen(true);
                  }}
                  className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary-container/40 transition-all cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                        {exp.category.replace("_", " ")}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          exp.approvalStatus === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : exp.approvalStatus === "REJECTED"
                            ? "bg-error-container text-on-error-container"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {exp.approvalStatus}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-on-surface">{exp.title}</h3>
                    {exp.vendorName && (
                      <p className="text-xs text-on-surface-variant">Vendor: {exp.vendorName}</p>
                    )}
                  </div>

                  <div className="text-right space-y-0.5 font-mono text-xs">
                    <div className="font-bold text-sm text-on-surface">
                      {formatINR(exp.totalAmountPaise)}
                    </div>
                    <div className="text-on-surface-variant text-[11px]">
                      Paid: {formatINR(exp.paidAmountPaise || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Link Existing Vendor to Ceremony */}
      {isLinkVendorOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container-high space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <h3 className="font-bold text-base text-on-surface">Link Vendor to {event.name}</h3>
              <button
                type="button"
                onClick={() => setIsLinkVendorOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {loadingAllVendors ? (
                <div className="p-8 text-center text-xs text-on-surface-variant">Loading workspace vendors...</div>
              ) : (
                allWorkspaceVendors
                  .filter((v) => !(v.eventIds || []).includes(event.id))
                  .map((v) => (
                    <div
                      key={v.id}
                      className="p-3 bg-surface-container-low border border-surface-container-high rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-on-surface">{v.name}</div>
                        <div className="text-[10px] text-on-surface-variant uppercase font-semibold">
                          {v.category.replace("_", " ")}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={linkingVendorId === v.id}
                        onClick={() => handleLinkVendor(v.id)}
                        className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-semibold text-xs hover:bg-primary transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                      >
                        {linkingVendorId === v.id ? (
                          <span className="w-3 h-3 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">add</span>
                        )}
                        <span>Link</span>
                      </button>
                    </div>
                  ))
              )}

              {!loadingAllVendors &&
                allWorkspaceVendors.filter((v) => !(v.eventIds || []).includes(event.id)).length === 0 && (
                  <p className="p-4 text-center text-xs text-on-surface-variant italic">
                    All workspace vendors are already linked to this ceremony.
                  </p>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Edit & Delete Event Modals */}
      <EventFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={refreshEvent}
        weddingId={weddingId}
        eventToEdit={event}
      />

      <DeleteEventModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={handleDeleted}
        weddingId={weddingId}
        eventId={event.id}
        eventName={event.name}
      />

      {/* Create Vendor Modal */}
      <VendorFormModal
        isOpen={isCreateVendorOpen}
        weddingId={weddingId}
        events={allEventsList}
        defaultEventId={event.id}
        onClose={() => setIsCreateVendorOpen(false)}
        onSuccess={() => {
          fetchEventVendors();
          setIsCreateVendorOpen(false);
        }}
      />

      {/* Create Expense Modal */}
      <ExpenseFormModal
        isOpen={isCreateExpenseOpen}
        weddingId={weddingId}
        events={allEventsList}
        vendors={eventVendors}
        defaultEventId={event.id}
        onClose={() => setIsCreateExpenseOpen(false)}
        onSuccess={() => {
          fetchEventExpenses();
          setIsCreateExpenseOpen(false);
        }}
      />

      {/* Expense Detail Drawer */}
      <ExpenseDetailDrawer
        isOpen={isExpenseDrawerOpen}
        weddingId={weddingId}
        expense={selectedExpense}
        teamMembers={teamMembers}
        onClose={() => setIsExpenseDrawerOpen(false)}
        onExpenseUpdated={() => {
          fetchEventExpenses();
        }}
      />
    </div>
  );
}
