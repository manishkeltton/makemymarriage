import React from "react";
import Link from "next/link";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { TeamService } from "@/modules/team/services/team.service";
import { PublicInviteView } from "@/components/team/public-invite-view";
import { Logo } from "@/components/marketing/Logo";

export default async function PublicInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const previewResult = await TeamService.getPublicInvitePreview(token);

  let currentUser = null;
  const sessionToken = await getSessionToken();
  if (sessionToken) {
    const sessionRes = await AuthService.verifySession(sessionToken);
    if (sessionRes.success && sessionRes.user) {
      currentUser = sessionRes.user;
    }
  }

  if (!previewResult.success || !previewResult.data) {
    return (
      <div className="min-h-screen bg-background font-body-md text-on-surface flex flex-col justify-between p-6">
        <header className="max-w-xl mx-auto w-full py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="h-8 w-8 text-primary-container" />
            <span className="font-headline-sm text-lg text-primary tracking-tight font-bold">
              MakeMyMarriage
            </span>
          </Link>
        </header>

        <main className="max-w-md mx-auto w-full my-auto">
          <div className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container-high text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-full bg-error-container/40 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">link_off</span>
            </div>
            <h1 className="font-headline-lg text-xl font-bold text-on-surface">
              Invalid or Expired Invitation
            </h1>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              {previewResult.error || "This wedding invitation link is invalid, expired, or has been revoked by the wedding admin."}
            </p>
            <div className="pt-2">
              <Link
                href={currentUser ? "/workspace" : "/login"}
                className="inline-block py-2.5 px-6 rounded-lg bg-primary-container text-on-primary font-semibold text-xs text-center hover:bg-primary transition-colors"
              >
                {currentUser ? "Go to Workspace" : "Go to Sign In"}
              </Link>
            </div>
          </div>
        </main>

        <footer className="max-w-xl mx-auto w-full text-center py-4 text-xs text-on-surface-variant">
          &copy; {new Date().getFullYear()} MakeMyMarriage
        </footer>
      </div>
    );
  }

  return <PublicInviteView token={token} preview={previewResult.data} currentUser={currentUser} />;
}
