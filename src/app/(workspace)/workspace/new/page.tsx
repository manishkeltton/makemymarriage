"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/marketing/Logo";

export default function NewWeddingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    brideName: "",
    groomName: "",
    weddingTitle: "",
    weddingDate: "",
    weddingLocation: "",
    preferredLanguage: "en",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-sync title when bride or groom name changes
  const handleNameChange = (field: "brideName" | "groomName", value: string) => {
    const updated = { ...formData, [field]: value };
    const bride = updated.brideName.trim();
    const groom = updated.groomName.trim();

    let autoTitle = updated.weddingTitle;
    if (bride && groom) {
      autoTitle = `${groom} & ${bride}'s Wedding`;
    } else if (bride) {
      autoTitle = `${bride}'s Wedding Workspace`;
    } else if (groom) {
      autoTitle = `${groom}'s Wedding Workspace`;
    }

    setFormData({
      ...updated,
      weddingTitle: autoTitle,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.brideName || !formData.groomName || !formData.weddingDate) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/weddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.weddingTitle || `${formData.groomName} & ${formData.brideName}'s Wedding`,
          bride: { name: formData.brideName },
          groom: { name: formData.groomName },
          primaryWeddingDate: formData.weddingDate,
          generalLocation: formData.weddingLocation
            ? { city: formData.weddingLocation, name: formData.weddingLocation }
            : undefined,
          preferredLanguage: formData.preferredLanguage,
        }),
      });

      const data = await res.json();
      const newWeddingId = data.data?.id || data.data?._id;

      if (res.ok && data.success && newWeddingId) {
        // Set recency cookie
        document.cookie = `last_accessed_wedding_id=${newWeddingId}; path=/; max-age=2592000; SameSite=Lax`;
        router.push(`/workspace/${newWeddingId}`);
        router.refresh();
      } else {
        setError(data.error?.message || "Failed to create wedding workspace");
      }
    } catch (err) {
      console.error("Error creating wedding:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-primary-container selection:text-on-primary">
      <main className="w-full max-w-xl mx-auto py-8 sm:py-12 flex flex-col items-center">
        {/* Top Brand Mark Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <Logo className="w-10 h-10 text-primary-container" />
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="font-headline-sm text-lg text-primary tracking-tight font-bold">
              MakeMyMarriage
            </span>
            <span className="font-label-sm text-[11px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant uppercase tracking-wider font-semibold">
              Workspace
            </span>
          </div>
        </div>

        {/* Editorial Header Block */}
        <div className="text-center mb-6 flex flex-col items-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-xs tracking-wider uppercase font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
            Let&apos;s Set Up Your Wedding
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-on-surface tracking-tight font-bold">
            Start with the essentials.
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant max-w-md">
            You can add events, guests, vendors and everything else once your workspace is ready.
          </p>
        </div>

        {/* Card Form Canvas */}
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-md p-6 sm:p-8 flex flex-col gap-5 border border-surface-container-high/60">
          {/* Stepper / Micro Progress */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-xs text-primary-container uppercase font-bold">
                Step 01
              </span>
              <span className="font-label-sm text-xs text-on-surface-variant">
                / 03 • Core Framework
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-7 rounded-full bg-primary-container" />
              <div className="h-1.5 w-2 rounded-full bg-surface-container-highest" />
              <div className="h-1.5 w-2 rounded-full bg-surface-container-highest" />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-error-container text-on-error-container text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Bride & Groom Dual Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className="font-label-md text-xs font-semibold text-on-surface-variant"
                  htmlFor="brideName"
                >
                  Bride&apos;s Legal / Preferred Name *
                </label>
                <input
                  id="brideName"
                  type="text"
                  required
                  placeholder="e.g. Meera Kapoor"
                  value={formData.brideName}
                  onChange={(e) => handleNameChange("brideName", e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface font-body-md text-sm shadow-xs focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="font-label-md text-xs font-semibold text-on-surface-variant"
                  htmlFor="groomName"
                >
                  Groom&apos;s Legal / Preferred Name *
                </label>
                <input
                  id="groomName"
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={formData.groomName}
                  onChange={(e) => handleNameChange("groomName", e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface font-body-md text-sm shadow-xs focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                />
              </div>
            </div>

            {/* Workspace Identifier */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="font-label-md text-xs font-semibold text-on-surface-variant"
                  htmlFor="weddingTitle"
                >
                  Workspace Identifier *
                </label>
                <span className="font-label-sm text-[11px] text-secondary flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> Auto-generated
                </span>
              </div>
              <input
                id="weddingTitle"
                type="text"
                required
                placeholder="e.g. Aarav & Meera Wedding"
                value={formData.weddingTitle}
                onChange={(e) => setFormData({ ...formData, weddingTitle: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface font-body-md text-sm shadow-xs focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
              />
              <p className="font-body-sm text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[15px] text-outline">info</span>
                This will be your shared workspace name visible to family leads &amp; vendors.
              </p>
            </div>

            {/* Date & Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className="font-label-md text-xs font-semibold text-on-surface-variant"
                  htmlFor="weddingDate"
                >
                  Target Muhurat Date *
                </label>
                <div className="relative flex items-center">
                  <input
                    id="weddingDate"
                    type="date"
                    required
                    value={formData.weddingDate}
                    onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
                    className="w-full h-10 pl-3 pr-9 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface font-body-md text-sm shadow-xs focus:outline-none focus:border-primary-container"
                  />
                  <span className="material-symbols-outlined absolute right-3 text-outline pointer-events-none text-[18px]">
                    calendar_today
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="font-label-md text-xs font-semibold text-on-surface-variant"
                  htmlFor="weddingLocation"
                >
                  Primary City / Hub
                </label>
                <div className="relative flex items-center">
                  <input
                    id="weddingLocation"
                    type="text"
                    placeholder="e.g. New Delhi, Udaipur"
                    value={formData.weddingLocation}
                    onChange={(e) => setFormData({ ...formData, weddingLocation: e.target.value })}
                    className="w-full h-10 pl-3 pr-9 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface font-body-md text-sm shadow-xs focus:outline-none focus:border-primary-container"
                  />
                  <span className="material-symbols-outlined absolute right-3 text-outline pointer-events-none text-[18px]">
                    location_on
                  </span>
                </div>
              </div>
            </div>

            {/* Location Zone Jurisdiction Preview */}
            <div className="p-3 bg-surface-container rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                  apartment
                </span>
                <span className="font-body-sm text-on-surface-variant">
                  Detected Zone: <strong>Hospitality Sector (IST / UTC+5:30)</strong>
                </span>
              </div>
              <span className="font-label-sm text-[10px] px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-semibold">
                GST Pre-configured
              </span>
            </div>

            {/* Preferred Language Buttons */}
            <div className="flex flex-col gap-1.5 pt-1">
              <label className="font-label-md text-xs font-semibold text-on-surface-variant">
                Ceremony &amp; Document Language
              </label>
              <div className="grid grid-cols-2 p-1 bg-surface-container rounded-lg gap-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, preferredLanguage: "en" })}
                  className={`h-8 rounded-md flex items-center justify-center gap-1.5 font-label-md text-xs transition-all ${
                    formData.preferredLanguage === "en"
                      ? "bg-surface-container-lowest text-primary-container shadow-xs font-semibold"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {formData.preferredLanguage === "en" && (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  )}
                  <span>English (Global Std)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, preferredLanguage: "hi" })}
                  className={`h-8 rounded-md flex items-center justify-center gap-1.5 font-label-md text-xs transition-all ${
                    formData.preferredLanguage === "hi"
                      ? "bg-surface-container-lowest text-primary-container shadow-xs font-semibold"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {formData.preferredLanguage === "hi" && (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  )}
                  <span>हिन्दी (Regional)</span>
                </button>
              </div>
            </div>

            {/* Primary Call to Action */}
            <div className="pt-2 flex flex-col">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                    <span>Provisioning Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Create Wedding Workspace</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Reassurance Footer */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-on-surface-variant font-label-sm">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-secondary">
              verified_user
            </span>
            <span>ISO 27001 Certified</span>
          </div>
          <span className="text-surface-variant hidden sm:inline">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-outline">lock</span>
            <span>Isolated Private Workspace</span>
          </div>
          <span className="text-surface-variant hidden sm:inline">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-secondary">
              check_circle
            </span>
            <span>Free to Start</span>
          </div>
        </div>
      </main>
    </div>
  );
}
