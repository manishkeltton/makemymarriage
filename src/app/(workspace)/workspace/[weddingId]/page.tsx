import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { WeddingService } from "@/modules/weddings/services/wedding.service";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { ActionButton } from "@/components/workspace/action-button";
import { formatINR } from "@/lib/utils/money";

export default async function WorkspaceDashboardPage({
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
  const dashboardResult = await WeddingService.getDashboardSummary(weddingId, session.user.id);

  if (!dashboardResult.success || !dashboardResult.data) {
    return (
      <WorkspaceShell weddingId={weddingId} user={session.user}>
        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/60 max-w-md mx-auto text-center space-y-4 shadow-sm my-12">
          <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[24px]">error</span>
          </div>
          <h2 className="text-lg font-headline-md font-bold text-on-surface">Workspace Access Error</h2>
          <p className="text-on-surface-variant text-sm">
            {dashboardResult.error || "Wedding workspace not found or membership access denied."}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/workspace/new"
              className="w-full py-2.5 rounded-lg bg-primary-container text-on-primary font-semibold text-xs text-center shadow-xs hover:bg-primary transition-colors"
            >
              Create New Wedding
            </Link>
            <Link
              href="/workspace"
              className="w-full py-2.5 rounded-lg border border-surface-container-high text-on-surface font-semibold text-xs text-center hover:bg-surface-container-low transition-colors"
            >
              Return to Workspaces
            </Link>
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  const { wedding, userRole, stats } = dashboardResult.data;

  const formattedDate = new Date(wedding.primaryWeddingDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isEmptyDashboard = stats.totalEvents === 0;

  return (
    <WorkspaceShell weddingId={weddingId} user={session.user} role={userRole}>
      <div className="flex flex-col w-full pb-16 space-y-8">
        {/* Top Hero Banner */}
        <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-6 sm:p-8 lg:p-10 shadow-sm border border-surface-container-high/60">
          <div className="absolute -right-16 -top-16 w-96 h-96 rounded-full bg-primary-fixed/20 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-24 w-64 h-64 rounded-full bg-secondary-fixed/30 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest shadow-xs">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="font-label-sm text-[11px] text-secondary uppercase tracking-widest font-semibold">
                  Workspace Initialized
                </span>
              </div>
              <h1 className="font-display-lg text-2xl sm:text-3xl lg:text-4xl text-on-surface tracking-tight font-bold">
                Good morning, {session.user.name.split(" ")[0]}
              </h1>
              <p className="font-body-lg text-sm sm:text-base text-on-surface-variant flex flex-wrap items-center gap-y-1 gap-x-2.5">
                <span className="font-semibold text-on-surface">{wedding.title}</span>
                <span className="text-outline-variant">•</span>
                <span className="text-primary-container font-semibold">
                  {wedding.daysRemaining} days to go
                </span>
                <span className="text-outline-variant">•</span>
                <span>{formattedDate}</span>
                {wedding.location && (
                  <>
                    <span className="text-outline-variant">•</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      {wedding.location}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Countdown Badge */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="bg-surface-container-lowest px-4 py-3 rounded-lg shadow-xs border border-surface-container-high/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container font-bold font-headline-sm text-base">
                  {wedding.daysRemaining}
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">
                    Countdown
                  </span>
                  <span className="font-headline-sm text-xs text-on-surface font-semibold">
                    Days Remaining
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Summary KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-high/60 flex flex-col justify-between h-36 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Upcoming Events
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              </div>
            </div>
            <div>
              <div className="font-display-lg text-2xl font-bold text-on-surface">
                {stats.totalEvents}{" "}
                <span className="font-body-md text-xs text-on-surface-variant font-normal">
                  events
                </span>
              </div>
              <p className="font-label-md text-xs text-on-surface-variant mt-1">
                {stats.totalEvents > 0 ? `${stats.totalEvents} scheduled` : "Next: None scheduled"}
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-high/60 flex flex-col justify-between h-36 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Tasks
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </div>
            </div>
            <div>
              <div className="font-display-lg text-2xl font-bold text-on-surface">
                {stats.completedTasks} / {stats.totalTasks}{" "}
                <span className="font-body-md text-xs text-on-surface-variant font-normal">
                  completed
                </span>
              </div>
              <p className="font-label-md text-xs text-on-surface-variant mt-1">
                {stats.pendingTasks} pending
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-high/60 flex flex-col justify-between h-36 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Guests
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">group</span>
              </div>
            </div>
            <div>
              <div className="font-display-lg text-2xl font-bold text-on-surface">
                {stats.attendingGuests}{" "}
                <span className="font-body-md text-xs text-on-surface-variant font-normal">
                  confirmed
                </span>
              </div>
              <p className="font-label-md text-xs text-on-surface-variant mt-1">
                {stats.totalGuests} households invited
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-high/60 flex flex-col justify-between h-36 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Wedding Spend
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </div>
            </div>
            <div>
              <div className="font-display-lg text-2xl font-bold text-on-surface">
                {formatINR(stats.totalBudgetPaise)}{" "}
                <span className="font-body-md text-xs text-on-surface-variant font-normal">
                  tracked
                </span>
              </div>
              <p className="font-label-md text-xs text-on-surface-variant mt-1">
                {formatINR(stats.totalPaidPaise)} paid
                {stats.overduePaymentsCount > 0 && (
                  <span className="text-error font-semibold ml-1 font-mono text-[11px]">
                    ({stats.overduePaymentsCount} overdue)
                  </span>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Empty State vs Populated View */}
        {isEmptyDashboard ? (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Next Milestone Banner (8 cols) */}
            <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-6 sm:p-8 md:p-10 shadow-xs border border-surface-container-high/60 relative overflow-hidden flex flex-col justify-between min-h-[360px]">
              <div className="absolute right-0 top-0 w-80 h-full opacity-10 pointer-events-none flex items-center justify-end pr-6">
                <svg
                  className="text-primary-container"
                  fill="none"
                  height="240"
                  viewBox="0 0 240 240"
                  width="240"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="120"
                    cy="120"
                    r="110"
                    stroke="currentColor"
                    strokeDasharray="6 6"
                    strokeWidth="2"
                  />
                  <circle cx="120" cy="120" r="75" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="120" cy="120" r="40" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M120 10 L120 230 M10 120 L230 120"
                    stroke="currentColor"
                    strokeOpacity="0.5"
                    strokeWidth="1"
                  />
                </svg>
              </div>

              <div className="relative z-10 max-w-xl space-y-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-xs font-semibold">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  <span>Next Milestone</span>
                </div>
                <h2 className="font-headline-lg text-xl sm:text-2xl text-on-surface font-bold tracking-tight">
                  Your wedding workspace is ready.
                </h2>
                <p className="font-body-lg text-sm text-on-surface-variant leading-relaxed">
                  Start by adding your wedding events. We’ll help you organize tasks, invitations,
                  and expenses around each ceremony.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Link
                    href={`/workspace/${weddingId}/events`}
                    className="h-[42px] px-6 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>Add Your First Event</span>
                  </Link>
                  <div className="flex items-center text-on-surface-variant font-label-md text-xs">
                    <span className="material-symbols-outlined text-[18px] mr-1 text-secondary">
                      verified
                    </span>
                    <span>Setup takes under 2 minutes</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="relative z-10 mt-8 pt-6 bg-surface-container-low/50 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 md:-mx-10 md:-mb-10 p-6 md:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-surface-container-high/40">
                <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold tracking-wider">
                  Quick Actions
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <ActionButton
                    message="Guests feature module coming next!"
                    className="h-[34px] px-3.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-headline-sm text-xs font-semibold flex items-center gap-1.5 transition-colors border border-surface-container-high/60 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary-container">
                      person_add
                    </span>
                    <span>Add Guest Family</span>
                  </ActionButton>

                  <Link
                    href={`/workspace/${weddingId}/tasks`}
                    className="h-[34px] px-3.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-headline-sm text-xs font-semibold flex items-center gap-1.5 transition-colors border border-surface-container-high/60 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary-container">
                      add_task
                    </span>
                    <span>Create Task</span>
                  </Link>

                  <ActionButton
                    message="Team governance module coming next!"
                    className="h-[34px] px-3.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-headline-sm text-xs font-semibold flex items-center gap-1.5 transition-colors border border-surface-container-high/60 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary-container">
                      group_add
                    </span>
                    <span>Invite Organiser</span>
                  </ActionButton>
                </div>
              </div>
            </div>

            {/* Getting Started Guide (4 cols) */}
            <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-6 shadow-xs border border-surface-container-high/60 flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/40 mb-4">
                <div>
                  <span className="font-label-sm text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                    Foundations
                  </span>
                  <h3 className="font-headline-sm text-base text-on-surface font-bold">
                    Getting Started Guide
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-xs font-semibold">
                  0 / 4
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-3 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary font-label-sm text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-xs text-on-surface font-semibold truncate">
                        Schedule Ceremonies &amp; Muhurat
                      </span>
                      <span className="font-label-sm text-[9px] px-1.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-semibold shrink-0">
                        Next Up
                      </span>
                    </div>
                    <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                      Define key functions: Sangeet, Mehendi, Haldi &amp; Phere.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg hover:bg-surface-container-low/60 flex items-start gap-3 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-headline-sm text-xs text-on-surface font-semibold truncate block">
                      Build Household Guest List
                    </span>
                    <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                      Group attendees by family units for seamless RSVPs.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg hover:bg-surface-container-low/60 flex items-start gap-3 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-headline-sm text-xs text-on-surface font-semibold truncate block">
                      Set High-Level Budget
                    </span>
                    <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                      Establish spending targets across catering, decor, and venue.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg hover:bg-surface-container-low/60 flex items-start gap-3 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    4
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-headline-sm text-xs text-on-surface font-semibold truncate block">
                      Invite Family Leads
                    </span>
                    <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                      Delegate coordination roles to siblings and key coordinators.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-xl border border-outline-variant/60 bg-white p-6">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Task progress</h2><Link href={`/workspace/${weddingId}/tasks`} className="text-sm text-primary-container underline">View all tasks</Link></div>
          <p className="my-3 text-sm">{stats.completedTasks} of {stats.totalTasks} completed · {stats.taskProgress}% · {stats.overdueTasks} overdue</p>
          <progress value={stats.completedTasks} max={Math.max(1, stats.totalTasks)} className="w-full accent-primary-container" aria-label="Task completion" />
          <ul className="mt-4 space-y-2">{dashboardResult.data.overdueTaskSummary?.map(task => <li key={task.id}><Link className="text-sm text-error underline" href={`/workspace/${weddingId}/tasks?taskId=${task.id}`}>{task.title} · due {task.dueAt ? new Date(task.dueAt).toLocaleDateString("en-IN") : ""}</Link></li>)}</ul>
          {stats.overdueTasks === 0 && <p className="mt-3 text-sm text-on-surface-variant">No overdue tasks.</p>}
        </section>

        {/* 3 Foundation Preview Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-xs border border-surface-container-high/60 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[20px]">villa</span>
              </div>
              <h4 className="font-headline-sm text-base text-on-surface font-bold">
                Venue &amp; Logistics
              </h4>
              <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                Link venues to specific ceremonies and map rooming configurations for out-of-town
                guests.
              </p>
            </div>
            <div className="pt-4">
              <Link
                href={`/workspace/${weddingId}/events`}
                className="font-headline-sm text-xs text-primary-container font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Configure venues</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-xs border border-surface-container-high/60 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[20px]">contacts</span>
              </div>
              <h4 className="font-headline-sm text-base text-on-surface font-bold">
                Vendor Procurement
              </h4>
              <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                Store contracts, milestone payment schedules, and arrival operational checklists in
                one ledger.
              </p>
            </div>
            <div className="pt-4">
              <Link
                href={`/workspace/${weddingId}/vendors`}
                className="font-headline-sm text-xs text-primary-container font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Browse directory</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-xs border border-surface-container-high/60 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
              </div>
              <h4 className="font-headline-sm text-base text-on-surface font-bold">
                Digital Invites &amp; RSVP
              </h4>
              <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                Set up multi-ceremony invitations, WhatsApp dispatch templates, and dietary
                intake.
              </p>
            </div>
            <div className="pt-4">
              <ActionButton
                message="Digital invitations module coming next!"
                className="font-headline-sm text-xs text-primary-container font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Design invitations</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </ActionButton>
            </div>
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
