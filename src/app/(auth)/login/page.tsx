"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrlParam = searchParams.get("returnUrl") || "";
  const emailParam = searchParams.get("email") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
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
        const msg = data.error?.message || "Invalid credentials";
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
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const signupLink = `/signup${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  return (
    <div>
      <h2 className="font-headline-lg text-[28px] text-on-surface font-bold tracking-tight mb-2">Welcome back</h2>
      <p className="font-body-md text-on-surface-variant mb-8">
        Don&apos;t have an account?{" "}
        <Link href={signupLink} className="text-primary-container font-semibold hover:underline">
          Create account
        </Link>
      </p>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-lg mb-6 font-body-sm space-y-2">
          <p>{error}</p>
          {showSignupPrompt && (
            <div className="pt-2.5 border-t border-on-error-container/20">
              <p className="font-semibold text-xs text-on-error-container">Don&apos;t have an account yet?</p>
              <Link
                href={`/signup?returnUrl=${encodeURIComponent(returnUrlParam)}&email=${encodeURIComponent(formData.email)}`}
                className="inline-block mt-1.5 px-3 py-1.5 bg-primary-container text-on-primary font-bold text-xs rounded hover:bg-primary transition-colors shadow-xs"
              >
                Create Account with {formData.email || "this email"}
              </Link>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-surface-container-low border border-surface-variant/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container text-on-surface"
            placeholder="aarav@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Password
            </label>
            <Link href="/forgot-password" className="font-body-sm text-primary-container hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-surface-container-low border border-surface-variant/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container text-on-surface"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-primary-container hover:bg-[#5D1F2C] text-on-primary py-3.5 rounded-lg font-headline-sm text-body-lg transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-xs text-on-surface-variant">Loading login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
