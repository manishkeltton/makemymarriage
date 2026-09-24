import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { WeddingService } from "@/modules/weddings/services/wedding.service";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { WeddingSettingsForm } from "@/components/workspace/wedding-settings-form";

export default async function WorkspaceSettingsPage({
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
  const accessResult = await WeddingService.getWeddingById(weddingId, session.user.id);

  if (!accessResult.success || !accessResult.data) {
    return (
      <WorkspaceShell weddingId={weddingId} user={session.user}>
        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/60 max-w-md mx-auto text-center space-y-4 shadow-sm my-12">
          <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[24px]">error</span>
          </div>
          <h2 className="text-lg font-headline-md font-bold text-on-surface">Workspace Access Error</h2>
          <p className="text-on-surface-variant text-sm">
            {accessResult.error || "Wedding workspace not found or membership access denied."}
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

  const { wedding, member } = accessResult.data;

  return (
    <WorkspaceShell weddingId={weddingId} user={session.user} role={member.role}>
      <WeddingSettingsForm
        weddingId={weddingId}
        userRole={member.role}
        initialData={{
          title: wedding.title,
          brideName: wedding.bride.name,
          groomName: wedding.groom.name,
          primaryWeddingDate: wedding.primaryWeddingDate,
          city: wedding.generalLocation?.city || "",
          venueName: wedding.generalLocation?.name || "",
          preferredLanguage: wedding.preferredLanguage,
          status: wedding.status,
        }}
      />
    </WorkspaceShell>
  );
}
