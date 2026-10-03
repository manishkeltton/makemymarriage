"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

function LoginForm() {
  const tAuth = useTranslations("Auth");
  const tCommon = useTranslations("Common");

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrlParam = searchParams.get("returnUrl") || "";
  const emailParam = searchParams.get("email") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formData, setFormData] = useState({
    email: emailParam,
    password: "",
  });

  const getSafeReturnUrl = (url: string) => {
    if (url && url.startsWith("/") && !url.startsWith("//")) {
      return url;
    }
    return "/workspace";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowSignupPrompt(false);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error?.message || tAuth("loginSuccess");
        if (
          msg.toLowerCase().includes("not exist") ||
          msg.toLowerCase().includes("invalid credentials") ||
          msg.toLowerCase().includes("user not found")
        ) {
          setShowSignupPrompt(true);
        }
        throw new Error(msg);
      }

      const targetUrl = getSafeReturnUrl(returnUrlParam);
      router.push(targetUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("error"));
    } finally {
      setLoading(false);
    }
  };

  const signupLink = `/signup${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header Eyebrow & Title */}
      <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-label-sm font-label-md uppercase tracking-wider mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
          MakeMyMarriage
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
          {tAuth("signIn")}
        </h1>
      </div>

      {/* Main Auth Card */}
      <div className="w-full bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xl shadow-on-surface/[0.03] p-6 sm:p-8">
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-error-container text-on-error-container text-body-sm font-body-sm flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-error shrink-0 mt-0.5">error</span>
            <div className="flex-1 text-left">
              <p className="font-semibold text-label-md">{tCommon("error")}</p>
              <p className="text-body-sm text-on-error-container/90">{error}</p>
              {showSignupPrompt && (
                <div className="mt-2.5 pt-2 border-t border-on-error-container/20">
                  <p className="font-semibold text-xs text-on-error-container">{tAuth("dontHaveAccount")}</p>
                  <Link
                    href={`/signup?returnUrl=${encodeURIComponent(returnUrlParam)}&email=${encodeURIComponent(formData.email)}`}
                    className="inline-block mt-1.5 px-3 py-1.5 bg-primary-container text-on-primary font-bold text-xs rounded-lg hover:bg-primary transition-colors shadow-xs"
                  >
                    {tAuth("signUp")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate={false}>
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block font-label-md text-label-md text-on-surface" htmlFor="email">
              {tAuth("emailLabel")}
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder={tAuth("emailPlaceholder")}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-on-surface font-body-md text-body-md placeholder:text-outline/70 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-label-md text-label-md text-on-surface" htmlFor="password">
                {tAuth("passwordLabel")}
              </label>
              <Link href="/forgot-password" className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors focus:outline-none">
                {tAuth("forgotPasswordLink")}
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
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

          {/* Sub-controls */}
          <div className="pt-1 flex items-center justify-between">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-surface-container-low accent-primary text-primary focus:ring-0 cursor-pointer"
              />
              <span className="font-body-sm text-body-sm text-on-surface-variant select-none">
                {tAuth("rememberMe")}
              </span>
            </label>
          </div>

          {/* Submit Button */}
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
                tAuth("signIn")
              )}
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="mt-6 pt-5 bg-surface-container-low/40 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 px-6 sm:px-8 py-4 rounded-b-2xl flex items-center justify-center text-center border-t border-outline-variant/30">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {tAuth("dontHaveAccount")}{" "}
            <Link
              href={signupLink}
              className="font-semibold text-primary-container hover:text-primary transition-colors ml-1 inline-flex items-center gap-0.5"
            >
              {tAuth("signUp")}
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const tCommon = useTranslations("Common");
  return (
    <Suspense fallback={<div className="p-4 text-center text-xs text-on-surface-variant">{tCommon("loading")}</div>}>
      <LoginForm />
    </Suspense>
  );
}
