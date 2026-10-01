"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.status === 429) {
        throw new Error(data.error?.message || "Too many requests. Please try again later.");
      }

      if (!res.ok) {
        throw new Error(data.error?.message || "An error occurred. Please try again.");
      }

      // Neutral success response
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header Eyebrow & Title */}
      <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-label-sm font-label-md uppercase tracking-wider mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
          ACCOUNT RECOVERY
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
          Forgot your password?
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 max-w-xs leading-relaxed">
          Enter your registered email address and we&apos;ll send you instructions to reset your password.
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xl shadow-on-surface/[0.03] p-6 sm:p-8">
        {submitted ? (
          <div className="text-center py-2 space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">mark_email_read</span>
            </div>
            <div>
              <h2 className="font-title-lg text-title-lg font-bold text-on-surface">Check your email</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                If an account exists for <span className="font-semibold text-on-surface">{email}</span>, you will receive password reset instructions shortly.
              </p>
            </div>
            <div className="pt-4 border-t border-outline-variant/30">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 h-11 bg-primary-container text-on-primary font-label-md text-label-md rounded-xl hover:bg-primary transition-all shadow-md shadow-primary/20"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-error-container text-on-error-container text-body-sm font-body-sm flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-error shrink-0 mt-0.5">error</span>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-label-md">Request Failed</p>
                  <p className="text-body-sm text-on-error-container/90">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate={false}>
              <div className="space-y-1.5">
                <label className="block font-label-md text-label-md text-on-surface" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-on-surface font-body-md text-body-md placeholder:text-outline/70 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all shadow-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full h-11 bg-primary-container text-on-primary font-label-md text-label-md rounded-xl hover:bg-primary active:scale-[0.99] transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-on-primary" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
                      </svg>
                      Sending reset link...
                    </span>
                  ) : (
                    "Send Password Reset Link"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 bg-surface-container-low/40 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 px-6 sm:px-8 py-4 rounded-b-2xl flex items-center justify-center text-center border-t border-outline-variant/30">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary-container hover:text-primary transition-colors ml-1 inline-flex items-center gap-0.5"
                >
                  Sign in
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-xs text-on-surface-variant">Loading page...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
