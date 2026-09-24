"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrlParam = searchParams.get("returnUrl") || "";
  const emailParam = searchParams.get("email") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
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
    setShowLoginPrompt(false);

    try {
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error?.message || "Something went wrong";
        if (
          msg.toLowerCase().includes("already exists") ||
          msg.toLowerCase().includes("registered") ||
          msg.toLowerCase().includes("duplicate")
        ) {
          setShowLoginPrompt(true);
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

  const loginLink = `/login${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  return (
    <div>
      <h2 className="font-headline-lg text-[28px] text-on-surface font-bold tracking-tight mb-2">Create your account</h2>
      <p className="font-body-md text-on-surface-variant mb-8">
        Already have an account?{" "}
        <Link href={loginLink} className="text-primary-container font-semibold hover:underline">
          Sign in
        </Link>
      </p>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-lg mb-6 font-body-sm space-y-2">
          <p>{error}</p>
          {showLoginPrompt && (
            <div className="pt-2.5 border-t border-on-error-container/20">
              <p className="font-semibold text-xs text-on-error-container">Account already exists with this email</p>
              <Link
                href={`/login?returnUrl=${encodeURIComponent(returnUrlParam)}&email=${encodeURIComponent(formData.email)}`}
                className="inline-block mt-1.5 px-3 py-1.5 bg-primary-container text-on-primary font-bold text-xs rounded hover:bg-primary transition-colors shadow-xs"
              >
                Sign In with {formData.email}
              </Link>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">
            Your Full Name
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-surface-container-low border border-surface-variant/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container text-on-surface"
            placeholder="Aarav Sharma"
          />
        </div>

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
          <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
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
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center font-body-sm text-on-surface-variant">
        By creating an account, you agree to our <Link href="/terms" className="underline">Terms of Service</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-xs text-on-surface-variant">Loading signup...</div>}>
      <SignupForm />
    </Suspense>
  );
}
