"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TeamMemberDTO, PendingInviteDTO } from "@/modules/team/dto/team.dto";
import { EventDTO } from "@/modules/events/dto/event.dto";
import { InviteMemberModal } from "./invite-member-modal";
import { EditMemberModal } from "./edit-member-modal";
import { RemoveMemberModal } from "./remove-member-modal";

interface TeamManagementViewProps {
  weddingId: string;
  initialMembers: TeamMemberDTO[];
  initialInvites: PendingInviteDTO[];
  weddingEvents: EventDTO[];
  currentUserId: string;
}

type TabType = "members" | "invites";

function getRoleBadgeStyle(role: string) {
  switch (role) {
    case "ADMIN":
      return "bg-primary-fixed text-on-primary-fixed border-primary-container/30";
    case "MANAGER":
      return "bg-secondary-fixed text-on-secondary-fixed-variant border-secondary/30";
    case "ORGANISER":
      return "bg-tertiary-fixed text-on-tertiary-fixed border-tertiary/30";
    default:
      return "bg-surface-container-high text-on-surface-variant border-outline-variant";
  }
}

export function TeamManagementView({
  weddingId,
  initialMembers,
  initialInvites,
  weddingEvents,
  currentUserId,
}: TeamManagementViewProps) {
  const router = useRouter();

  const [members, setMembers] = useState<TeamMemberDTO[]>(initialMembers);
  const [invites, setInvites] = useState<PendingInviteDTO[]>(initialInvites);
  const [activeTab, setActiveTab] = useState<TabType>("members");
  const [searchQuery, setSearchQuery] = useState("");

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMemberDTO | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TeamMemberDTO | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`/api/v1/weddings/${weddingId}/members`),
        fetch(`/api/v1/weddings/${weddingId}/member-invites`),
      ]);

      const membersData = await membersRes.json();
      const invitesData = await invitesRes.json();

      if (membersData.success && membersData.data) {
        setMembers(membersData.data);
      }
      if (invitesData.success && invitesData.data) {
        setInvites(invitesData.data);
      }

      router.refresh();
    } catch (err) {
      console.error("Error refreshing team data:", err);
      router.refresh();
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    setActionLoadingId(inviteId);
    setActionMessage(null);

    try {
      const res = await fetch(
        `/api/v1/weddings/${weddingId}/member-invites/${inviteId}/resend`,
        { method: "POST" }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        const deliveryMessage = data.data?.emailDelivery === "SENT" ? "Invitation email submitted." : "Email could not be sent. Share the new invitation link or try Resend again.";
        if (data.data?.inviteUrl) {
          try {
            await navigator.clipboard.writeText(data.data.inviteUrl);
            setActionMessage(`${deliveryMessage} Link copied: ${data.data.inviteUrl}`);
          } catch {
            setActionMessage(`${deliveryMessage} Share link: ${data.data.inviteUrl}`);
          }
        } else {
          setActionMessage(deliveryMessage);
        }
        refreshData();
      } else {
        alert(data.error?.message || "Failed to resend invitation.");
      }
    } catch (err) {
      console.error("Error resending invite:", err);
      alert("Network error occurred.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm("Are you sure you want to revoke this pending invitation?")) return;

    setActionLoadingId(inviteId);
    setActionMessage(null);

    try {
      const res = await fetch(
        `/api/v1/weddings/${weddingId}/member-invites/${inviteId}/revoke`,
        { method: "POST" }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setActionMessage("Invitation revoked.");
        refreshData();
      } else {
        alert(data.error?.message || "Failed to revoke invitation.");
      }
    } catch (err) {
      console.error("Error revoking invite:", err);
      alert("Network error occurred.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvites = invites.filter((i) =>
    i.invitedEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-container-high/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[24px]">
              shield_person
            </span>
            <h1 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Wedding Team &amp; Governance
            </h1>
          </div>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
            Manage family coordinators, organizers, roles, granular permissions, and event scope.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsInviteOpen(true)}
            type="button"
            className="h-[42px] px-5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-secondary-container/40 border border-secondary/30 text-on-secondary-container text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">
              check_circle
            </span>
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-on-secondary-container/70 hover:text-on-secondary-container"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Tabs & Search Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-surface-container-high/60">
          <button
            onClick={() => setActiveTab("members")}
            className={`px-4 py-2.5 font-label-md text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "members"
                ? "border-primary-container text-primary-container"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>Active Members ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("invites")}
            className={`px-4 py-2.5 font-label-md text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "invites"
                ? "border-primary-container text-primary-container"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">mail</span>
            <span>Pending Invites ({invites.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member or email..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Tab 1: Active Members */}
      {activeTab === "members" && (
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-xs overflow-hidden">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-sm space-y-2">
              <span className="material-symbols-outlined text-[32px] text-outline">
                group_off
              </span>
              <p>No active members found.</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-container-high/60">
              {filteredMembers.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                const roleClass = getRoleBadgeStyle(member.role);

                return (
                  <div
                    key={member.id}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container-low/40 transition-colors"
                  >
                    {/* Left: User Avatar & Info */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm shrink-0 uppercase shadow-xs">
                        {member.userName?.[0] || "U"}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-headline-sm text-sm sm:text-base font-bold text-on-surface truncate">
                            {member.userName}
                          </span>
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-semibold">
                              You
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${roleClass}`}
                          >
                            {member.role}
                          </span>
                        </div>
                        <p className="font-body-sm text-xs text-on-surface-variant truncate">
                          {member.userEmail}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Permissions & Event Scope Summary */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                      <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-md border border-surface-container-high/60">
                        <span className="material-symbols-outlined text-[15px] text-primary-container">
                          event_available
                        </span>
                        <span className="font-medium text-[11px]">
                          {member.eventScope?.allEvents
                            ? "All Ceremonies"
                            : `${member.eventScope?.eventIds?.length || 0} Ceremonies`}
                        </span>
                      </div>

                      <div className="hidden lg:flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-md border border-surface-container-high/60">
                        <span className="material-symbols-outlined text-[15px] text-secondary">
                          key
                        </span>
                        <span className="font-medium text-[11px]">
                          {member.role === "ADMIN"
                            ? "Full Admin Rights"
                            : Object.values(member.permissions || {}).filter(Boolean).length +
                              " Permissions"}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                      <button
                        onClick={() => setMemberToEdit(member)}
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center gap-1.5 transition-colors border border-surface-container-high/60 shadow-xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">tune</span>
                        <span>Edit Access</span>
                      </button>

                      <button
                        onClick={() => setMemberToRemove(member)}
                        type="button"
                        className="w-8 h-8 rounded-lg bg-error-container/30 hover:bg-error-container/60 text-error flex items-center justify-center transition-colors border border-error/20"
                        title="Remove member"
                      >
                        <span className="material-symbols-outlined text-[18px]">person_remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pending Invites */}
      {activeTab === "invites" && (
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-xs overflow-hidden">
          {filteredInvites.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-sm space-y-2">
              <span className="material-symbols-outlined text-[32px] text-outline">
                mail_lock
              </span>
              <p>No pending invitations.</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-container-high/60">
              {filteredInvites.map((invite) => {
                const isResending = actionLoadingId === invite.id;
                const roleClass = getRoleBadgeStyle(invite.role);
                const expiryDate = new Date(invite.expiresAt).toLocaleDateString();

                return (
                  <div
                    key={invite.id}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container-low/40 transition-colors"
                  >
                    {/* Left: Email & Role */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
                          {invite.invitedEmail}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${roleClass}`}
                        >
                          {invite.role}
                        </span>
                      </div>
                      <p className="font-body-sm text-xs text-on-surface-variant">
                        Sent on {new Date(invite.createdAt).toLocaleDateString()} • Expires on {expiryDate}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                      <button
                        onClick={() => handleResendInvite(invite.id)}
                        disabled={isResending}
                        type="button"
                        className="px-3.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center gap-1.5 transition-colors border border-surface-container-high/60 disabled:opacity-50 cursor-pointer"
                      >
                        {isResending ? (
                          <span className="w-3.5 h-3.5 border-2 border-primary-container/30 border-t-primary-container rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">send</span>
                        )}
                        <span>Resend Email</span>
                      </button>

                      <button
                        onClick={() => handleRevokeInvite(invite.id)}
                        disabled={isResending}
                        type="button"
                        className="px-3.5 py-1.5 rounded-lg bg-error-container/30 hover:bg-error-container/60 text-error font-semibold text-xs flex items-center gap-1.5 transition-colors border border-error/20 disabled:opacity-50 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        <span>Revoke</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={refreshData}
        weddingId={weddingId}
        weddingEvents={weddingEvents}
      />

      <EditMemberModal
        isOpen={Boolean(memberToEdit)}
        onClose={() => setMemberToEdit(null)}
        onSuccess={refreshData}
        weddingId={weddingId}
        memberToEdit={memberToEdit}
        weddingEvents={weddingEvents}
      />

      <RemoveMemberModal
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onSuccess={refreshData}
        weddingId={weddingId}
        memberToRemove={memberToRemove}
      />
    </div>
  );
}
