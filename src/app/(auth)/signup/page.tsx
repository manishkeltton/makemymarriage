"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Something went wrong");
      }

      // Redirect to workspace
      router.push("/workspace");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="font-headline-lg text-[28px] text-on-surface font-bold tracking-tight mb-2">Create your workspace</h2>
      <p className="font-body-md text-on-surface-variant mb-8">
        Already have an account? <Link href="/login" className="text-primary-container font-semibold hover:underline">Sign in</Link>
      </p>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-lg mb-6 font-body-sm">
          {error}
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
          {loading ? "Creating workspace..." : "Start Planning"}
        </button>
      </form>
      
      <p className="mt-6 text-center font-body-sm text-on-surface-variant">
        By creating an account, you agree to our <Link href="/terms" className="underline">Terms of Service</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}
