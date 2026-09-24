"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicInvitePreviewDTO } from "@/modules/team/dto/team.dto";
import { Logo } from "@/components/marketing/Logo";

interface PublicInviteViewProps {
  token: string;
  preview: PublicInvitePreviewDTO;
  currentUser?: {
    id: string;
    email: string;
    name: string;
  } | null;
}

export function PublicInviteView({ token, preview, currentUser }: PublicInviteViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isEmailMatched =
    currentUser && currentUser.email.toLowerCase().trim() === preview.invitedEmail.toLowerCase().trim();

  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/public/member-invites/${token}/accept`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to accept invitation.");
        setLoading(false);
        return;
      }

      setSuccessMsg("Invitation accepted! Redirecting to workspace...");
      setTimeout(() => {
        router.push(`/workspace/${data.data.weddingId}`);
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      console.error("Error accepting invitation:", err);
      setError("Network error occurred.");
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      router.push(`/login?returnUrl=/invite/${token}&email=${encodeURIComponent(preview.invitedEmail)}`);
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className="h-8 w-8 text-primary-container" />
          <span className="font-headline-sm text-lg text-primary tracking-tight font-bold">
            MakeMyMarriage
          </span>
        </Link>
      </header>

      {/* Main Card */}
      <main className="max-w-md mx-auto w-full my-auto space-y-6">
        <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-container-high/60 shadow-xl space-y-6 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container mx-auto shadow-xs">
            <span className="material-symbols-outlined text-[32px]">favorite</span>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/30 text-on-primary-fixed-variant text-[11px] font-bold uppercase tracking-wider">
              <span>Wedding Workspace Invitation</span>
            </div>

            <h1 className="font-display-lg text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
              {preview.wedding.title}
            </h1>

            <p className="font-body-md text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">{preview.invitedByName}</strong> has invited you to join the wedding planning team as a{" "}
              <span className="font-bold text-primary-container">{preview.role}</span>.
            </p>
          </div>

          {/* Details Box */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-medium">Couple:</span>
              <span className="font-bold text-on-surface">
                {preview.wedding.brideName} &amp; {preview.wedding.groomName}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-on-surface-variant font-medium">Invited Email:</span>
              <span className="font-mono text-on-surface">{preview.invitedEmail}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-on-surface-variant font-medium">Role Granted:</span>
              <span className="font-bold text-primary-container">{preview.role}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-on-surface-variant font-medium">Expires:</span>
              <span className="text-on-surface">
                {new Date(preview.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Status Alert Messages */}
          {error && (
            <div className="p-3.5 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs text-left flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-error shrink-0 mt-0.5">
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-lg bg-secondary-container/40 border border-secondary/30 text-on-secondary-container text-xs flex items-center justify-center gap-2 font-semibold">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                check_circle
              </span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Flow Actions */}
          {!currentUser ? (
            /* Logged Out State */
            <div className="space-y-3 pt-2 text-left">
              {preview.isInvitedUserRegistered ? (
                <div className="p-3 rounded-lg bg-info-container/20 border border-info/30 text-on-surface-variant text-xs space-y-1">
                  <p className="font-semibold text-on-surface">Account found for {preview.invitedEmail}</p>
                  <p>Please sign in to accept this invitation and enter the workspace.</p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-primary-fixed/20 border border-primary-fixed/40 text-on-surface-variant text-xs space-y-1">
                  <p className="font-semibold text-primary-container">New to MakeMyMarriage?</p>
                  <p>Create an account with <strong>{preview.invitedEmail}</strong> to accept your invitation.</p>
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-1">
                {preview.isInvitedUserRegistered ? (
                  <>
                    <Link
                      href={`/login?returnUrl=/invite/${token}&email=${encodeURIComponent(preview.invitedEmail)}`}
                      className="w-full py-3.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-semibold text-xs text-center shadow-xs transition-colors"
                    >
                      Sign In to Accept
                    </Link>

                    <Link
                      href={`/signup?returnUrl=/invite/${token}&email=${encodeURIComponent(preview.invitedEmail)}`}
                      className="w-full py-3 rounded-lg border border-surface-container-high text-on-surface font-semibold text-xs text-center hover:bg-surface-container-low transition-colors"
                    >
                      Create New Account
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/signup?returnUrl=/invite/${token}&email=${encodeURIComponent(preview.invitedEmail)}`}
                      className="w-full py-3.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-semibold text-xs text-center shadow-xs transition-colors"
                    >
                      Create Account &amp; Accept Invitation
                    </Link>

                    <Link
                      href={`/login?returnUrl=/invite/${token}&email=${encodeURIComponent(preview.invitedEmail)}`}
                      className="w-full py-3 rounded-lg border border-surface-container-high text-on-surface font-semibold text-xs text-center hover:bg-surface-container-low transition-colors"
                    >
                      Already have an account? Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : isEmailMatched ? (
            /* Logged In & Email Matched State */
            <div className="pt-2">
              <button
                onClick={handleAccept}
                disabled={loading || Boolean(successMsg)}
                className="w-full py-3.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                )}
                <span>Accept Invitation &amp; Enter Workspace</span>
              </button>
            </div>
          ) : (
            /* Logged In & Email Mismatched State */
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-200 text-left space-y-3">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">
                  warning
                </span>
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Account Email Mismatch</p>
                  <p>
                    You are currently signed in as <strong>{currentUser.email}</strong>, but this invitation was sent to <strong>{preview.invitedEmail}</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSwitchAccount}
                className="w-full py-2.5 rounded-lg bg-surface-container-lowest border border-amber-300 text-amber-900 font-semibold text-xs text-center hover:bg-amber-50 transition-colors cursor-pointer"
              >
                Sign Out &amp; Switch to {preview.invitedEmail}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-xl mx-auto w-full text-center py-4 text-xs text-on-surface-variant">
        &copy; {new Date().getFullYear()} MakeMyMarriage. All rights reserved.
      </footer>
    </div>
  );
}
