"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

function ResetPasswordForm() {
  const tAuth = useTranslations("Auth");
  const tCommon = useTranslations("Common");

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(!token ? tAuth("resetTokenInvalid") : "");
  const [isTokenInvalid, setIsTokenInvalid] = useState(!token);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError(tAuth("resetTokenInvalid"));
      setIsTokenInvalid(true);
      return;
    }

    if (password.length < 8) {
      setError(tCommon("error"));
      return;
    }

    if (password !== confirmPassword) {
      setError(tCommon("error"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const code = data.error?.code;
        if (code === "RESET_TOKEN_INVALID" || code === "RESET_TOKEN_EXPIRED") {
          setIsTokenInvalid(true);
        }
        throw new Error(data.error?.message || tAuth("resetTokenInvalid"));
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("error"));
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
          MakeMyMarriage
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
          {tAuth("resetPassword")}
        </h1>
      </div>

      {/* Main Card */}
      <div className="w-full bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xl shadow-on-surface/[0.03] p-6 sm:p-8">
        {success ? (
          <div className="text-center py-2 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">check_circle</span>
            </div>
            <div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                {tAuth("resetSuccess")}
              </p>
            </div>
            <div className="pt-4 border-t border-outline-variant/30">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 h-11 bg-primary-container text-on-primary font-label-md text-label-md rounded-xl hover:bg-primary transition-all shadow-md shadow-primary/20"
              >
                {tAuth("signIn")}
              </Link>
            </div>
          </div>
        ) : isTokenInvalid ? (
          <div className="text-center py-2 space-y-4">
            <div className="w-12 h-12 rounded-full bg-error-container/40 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">link_off</span>
            </div>
            <div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                {error || tAuth("resetTokenInvalid")}
              </p>
            </div>
            <div className="pt-4 border-t border-outline-variant/30 flex flex-col gap-2">
              <Link
                href="/forgot-password"
                className="w-full inline-flex items-center justify-center gap-2 h-11 bg-primary-container text-on-primary font-label-md text-label-md rounded-xl hover:bg-primary transition-all shadow-md shadow-primary/20"
              >
                {tAuth("sendResetLink")}
              </Link>
              <Link
                href="/login"
                className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors mt-2"
              >
                {tAuth("signIn")}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-error-container text-on-error-container text-body-sm font-body-sm flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-error shrink-0 mt-0.5">error</span>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-label-md">{tCommon("error")}</p>
                  <p className="text-body-sm text-on-error-container/90">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate={false}>
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block font-label-md text-label-md text-on-surface" htmlFor="password">
                  {tAuth("newPasswordLabel")}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    minLength={8}
                    maxLength={100}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tAuth("passwordPlaceholder")}
                    className="w-full h-11 pl-3.5 pr-11 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-on-surface font-body-md text-body-md placeholder:text-outline/70 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-[19px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block font-label-md text-label-md text-on-surface" htmlFor="confirmPassword">
                  {tAuth("confirmPasswordLabel")}
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    minLength={8}
                    maxLength={100}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={tAuth("passwordPlaceholder")}
                    className="w-full h-11 pl-3.5 pr-11 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-on-surface font-body-md text-body-md placeholder:text-outline/70 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle confirm password visibility"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-[19px]">
                      {showConfirmPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
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
                      {tCommon("loading")}
                    </span>
                  ) : (
                    tAuth("resetPasswordSubmit")
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 bg-surface-container-low/40 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 px-6 sm:px-8 py-4 rounded-b-2xl flex items-center justify-center text-center border-t border-outline-variant/30">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {tAuth("alreadyHaveAccount")}{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary-container hover:text-primary transition-colors ml-1 inline-flex items-center gap-0.5"
                >
                  {tAuth("signIn")}
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

export default function ResetPasswordPage() {
  const tCommon = useTranslations("Common");
  return (
    <Suspense fallback={<div className="p-4 text-center text-xs text-on-surface-variant">{tCommon("loading")}</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
