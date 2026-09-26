"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { GuestHouseholdDTO, GuestStatsSummaryDTO } from "@/modules/guests/dto/guest.dto";
import { GuestHouseholdFormModal } from "@/components/guests/GuestHouseholdFormModal";
import { GuestAccessLinkModal } from "@/components/guests/GuestAccessLinkModal";
import { GuestDetailDrawer } from "@/components/guests/GuestDetailDrawer";

interface GuestsPageProps {
  params: Promise<{ weddingId: string }>;
}

export default function GuestsPage({ params }: GuestsPageProps) {
  const { weddingId } = use(params);

  const [households, setHouseholds] = useState<GuestHouseholdDTO[]>([]);
  const [stats, setStats] = useState<GuestStatsSummaryDTO | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSide, setSelectedSide] = useState("");
  const [selectedRsvpStatus, setSelectedRsvpStatus] = useState("");
  const [selectedInvitationStatus, setSelectedInvitationStatus] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<GuestHouseholdDTO | null>(null);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [targetHouseholdForLink, setTargetHouseholdForLink] = useState<GuestHouseholdDTO | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedHouseholdForDrawer, setSelectedHouseholdForDrawer] = useState<GuestHouseholdDTO | null>(null);

  const fetchWorkspaceGuestData = useCallback(async () => {
    try {
      const qParams = new URLSearchParams({ limit: "200" });
      if (selectedSide) qParams.append("side", selectedSide);
      if (selectedRsvpStatus) qParams.append("rsvpStatus", selectedRsvpStatus);
      if (selectedInvitationStatus) qParams.append("invitationStatus", selectedInvitationStatus);
      if (searchQuery.trim()) qParams.append("q", searchQuery.trim());

      const res = await fetch(`/api/v1/weddings/${weddingId}/guests?${qParams.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setHouseholds(data.data || []);
        if (data.stats) setStats(data.stats);
      } else {
        setError(data.error?.message || "Failed to load guest households.");
      }
    } catch (err: unknown) {
      console.error("Error fetching workspace guest data:", err);
      setError("Failed to load guest households.");
    } finally {
      setLoading(false);
    }
  }, [weddingId, selectedSide, selectedRsvpStatus, selectedInvitationStatus, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        await fetchWorkspaceGuestData();
      }
    };
    void load();

    return () => {
      isMounted = false;
    };
  }, [fetchWorkspaceGuestData]);

  const handleCreateHousehold = () => {
    setEditingHousehold(null);
    setIsFormModalOpen(true);
  };

  const handleEditHousehold = (household: GuestHouseholdDTO) => {
    setEditingHousehold(household);
    setIsFormModalOpen(true);
  };

  const handleDeleteHousehold = async (household: GuestHouseholdDTO) => {
    if (!confirm(`Are you sure you want to delete household "${household.householdName}"?`)) return;

    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/guests/${household.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchWorkspaceGuestData();
      } else {
        alert(data.error?.message || "Failed to delete household.");
      }
    } catch (err: unknown) {
      console.error("Error deleting household:", err);
      alert("Failed to delete household.");
    }
  };

  const handleOpenLinkModal = (household: GuestHouseholdDTO) => {
    setTargetHouseholdForLink(household);
    setIsLinkModalOpen(true);
  };

  const handleOpenDrawer = (household: GuestHouseholdDTO) => {
    setSelectedHouseholdForDrawer(household);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-on-surface">Guest List & RSVP Management</h1>
          <p className="text-sm text-on-surface-variant">
            Manage guest households, digital invitation QR links, and real-time ceremony RSVP attendance.
          </p>
        </div>
        <button
          onClick={handleCreateHousehold}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-medium text-sm shadow-md hover:bg-primary/90 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Add Household
        </button>
      </div>

      {/* KPI Summary Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Invited</div>
            <div className="text-2xl font-bold font-mono text-on-surface mt-1">
              {stats.totalInvited}
            </div>
            <div className="text-[11px] text-on-surface-variant mt-0.5">
              Across {stats.totalHouseholds} households
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Confirmed Attending</div>
            <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
              {stats.totalAttending}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">Guests attending</div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Declined</div>
            <div className="text-2xl font-bold font-mono text-error mt-1">
              {stats.totalDeclined}
            </div>
            <div className="text-[11px] text-error mt-0.5">Unable to attend</div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Awaiting Response</div>
            <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
              {stats.totalAwaiting}
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">Pending RSVP</div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Invitations Sent</div>
            <div className="text-2xl font-bold font-mono text-primary mt-1">
              {stats.totalSent} / {stats.totalHouseholds}
            </div>
            <div className="text-[11px] text-on-surface-variant mt-0.5">Sent households</div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Search guests by family name, contact, phone, or member name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={selectedSide}
          onChange={(e) => setSelectedSide(e.target.value)}
          className="px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Sides</option>
          <option value="BRIDE">Bride Side</option>
          <option value="GROOM">Groom Side</option>
          <option value="BOTH">Both Sides</option>
        </select>

        <select
          value={selectedRsvpStatus}
          onChange={(e) => setSelectedRsvpStatus(e.target.value)}
          className="px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All RSVPs</option>
          <option value="ATTENDING">ATTENDING</option>
          <option value="NOT_ATTENDING">NOT ATTENDING</option>
          <option value="AWAITING">AWAITING</option>
        </select>

        <select
          value={selectedInvitationStatus}
          onChange={(e) => setSelectedInvitationStatus(e.target.value)}
          className="px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Delivery States</option>
          <option value="SENT">SENT</option>
          <option value="NOT_SENT">NOT SENT</option>
        </select>
      </div>

      {/* Main Household List Table */}
      {loading ? (
        <div className="py-12 flex justify-center items-center text-on-surface-variant gap-3">
          <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
          <span className="text-sm font-medium">Loading guest list...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-error-container text-on-error-container rounded-2xl text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      ) : households.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 border border-surface-container-high text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary-container/30 text-primary flex items-center justify-center mx-auto text-3xl">
            <span className="material-symbols-outlined">groups</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-on-surface font-serif">No Guest Households Found</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Start building your wedding guest list, organize by family side, and issue digital invitation QR links.
            </p>
          </div>
          <button
            onClick={handleCreateHousehold}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Add First Household
          </button>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-surface-container-high">
                <tr>
                  <th className="py-3 px-4">Household / Contact</th>
                  <th className="py-3 px-4">Side</th>
                  <th className="py-3 px-4 text-center">Invited Passes</th>
                  <th className="py-3 px-4 text-center">Delivery</th>
                  <th className="py-3 px-4 text-center">RSVP Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high text-on-surface">
                {households.map((h) => {
                  const isAttending = h.rsvp.status === "ATTENDING";
                  const isDeclined = h.rsvp.status === "NOT_ATTENDING";

                  return (
                    <tr key={h.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleOpenDrawer(h)}
                          className="font-semibold hover:text-primary transition-colors text-left"
                        >
                          {h.householdName}
                        </button>
                        <div className="text-xs text-on-surface-variant flex items-center gap-2 mt-0.5">
                          <span>{h.primaryContact.name}</span>
                          {h.primaryContact.phone && <span>• {h.primaryContact.phone}</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-surface-container text-on-surface-variant text-xs font-bold tracking-wider uppercase">
                          {h.side}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {h.totalInvited}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            h.invitationStatus === "SENT"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          {h.invitationStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                            isAttending
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : isDeclined
                              ? "bg-error-container text-on-error-container"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {h.rsvp.status}
                          {isAttending && ` (${h.rsvp.attendingCount}/${h.totalInvited})`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenLinkModal(h)}
                            className="p-1 text-primary hover:bg-primary-container/30 rounded-lg transition-colors"
                            title="Share Digital Invitation & QR"
                          >
                            <span className="material-symbols-outlined text-lg">qr_code_2</span>
                          </button>
                          <button
                            onClick={() => handleOpenDrawer(h)}
                            className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                            title="View Household Details"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          <button
                            onClick={() => handleEditHousehold(h)}
                            className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                            title="Edit Household"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteHousehold(h)}
                            className="p-1 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-lg transition-colors"
                            title="Delete Household"
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

      {/* Modals & Slide-over Drawer */}
      <GuestHouseholdFormModal
        isOpen={isFormModalOpen}
        weddingId={weddingId}
        household={editingHousehold}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchWorkspaceGuestData}
      />

      <GuestAccessLinkModal
        isOpen={isLinkModalOpen}
        weddingId={weddingId}
        household={targetHouseholdForLink}
        onClose={() => {
          setIsLinkModalOpen(false);
          setTargetHouseholdForLink(null);
        }}
        onSuccess={fetchWorkspaceGuestData}
      />

      <GuestDetailDrawer
        isOpen={isDrawerOpen}
        weddingId={weddingId}
        household={selectedHouseholdForDrawer}
        onClose={() => setIsDrawerOpen(false)}
        onHouseholdUpdated={fetchWorkspaceGuestData}
        onOpenAccessLinkModal={(h) => {
          setIsDrawerOpen(false);
          handleOpenLinkModal(h);
        }}
      />
    </div>
  );
}
