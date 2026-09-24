import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { EventService } from "@/modules/events/services/event.service";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { EventDetailView } from "@/components/events/event-detail-view";

export default async function WorkspaceEventDetailPage({
  params,
}: {
  params: Promise<{ weddingId: string; eventId: string }>;
}) {
  const token = await getSessionToken();
  if (!token) {
    redirect("/login");
  }

  const session = await AuthService.verifySession(token);
  if (!session.success || !session.user) {
    redirect("/login");
  }

  const { weddingId, eventId } = await params;
  const eventResult = await EventService.getEventById(weddingId, eventId, session.user.id);

  if (!eventResult.success || !eventResult.data) {
    return (
      <WorkspaceShell weddingId={weddingId} user={session.user}>
        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/60 max-w-md mx-auto text-center space-y-4 shadow-sm my-12">
          <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[24px]">event_busy</span>
          </div>
          <h2 className="text-lg font-headline-md font-bold text-on-surface">Event Not Found</h2>
          <p className="text-on-surface-variant text-sm">
            {eventResult.error || "The requested event could not be found or access was denied."}
          </p>
          <div className="pt-2">
            <Link
              href={`/workspace/${weddingId}/events`}
              className="inline-block py-2.5 px-6 rounded-lg bg-primary-container text-on-primary font-semibold text-xs text-center hover:bg-primary transition-colors"
            >
              Back to Events Timeline
            </Link>
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell weddingId={weddingId} user={session.user}>
      <EventDetailView weddingId={weddingId} initialEvent={eventResult.data} />
    </WorkspaceShell>
  );
}
