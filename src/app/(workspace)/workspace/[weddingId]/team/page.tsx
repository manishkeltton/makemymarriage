import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { TeamService } from "@/modules/team/services/team.service";
import { EventService } from "@/modules/events/services/event.service";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { TeamManagementView } from "@/components/team/team-management-view";

export default async function WorkspaceTeamPage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const token = await getSessionToken();
  if (!token) {
    redirect("/login");
  }

  const session = await AuthService.verifySession(token);
  if (!session.success || !session.user) {
    redirect("/login");
  }

  const { weddingId } = await params;

  const [membersRes, invitesRes, eventsRes] = await Promise.all([
    TeamService.getTeamMembers(weddingId, session.user.id),
    TeamService.getPendingInvites(weddingId, session.user.id),
    EventService.getEventsByWeddingId(weddingId, session.user.id),
  ]);

  if (!membersRes.success) {
    return (
      <WorkspaceShell weddingId={weddingId} user={session.user}>
        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/60 max-w-md mx-auto text-center space-y-4 shadow-sm my-12">
          <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[24px]">lock</span>
          </div>
          <h2 className="text-lg font-headline-md font-bold text-on-surface">Team Access Error</h2>
          <p className="text-on-surface-variant text-sm">
            {membersRes.error || "Only wedding ADMIN members can view and manage team governance."}
          </p>
          <div className="pt-2">
            <Link
              href={`/workspace/${weddingId}`}
              className="inline-block py-2.5 px-6 rounded-lg bg-primary-container text-on-primary font-semibold text-xs text-center hover:bg-primary transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell weddingId={weddingId} user={session.user}>
      <TeamManagementView
        weddingId={weddingId}
        initialMembers={membersRes.data || []}
        initialInvites={invitesRes.data || []}
        weddingEvents={eventsRes.data || []}
        currentUserId={session.user.id}
      />
    </WorkspaceShell>
  );
}
