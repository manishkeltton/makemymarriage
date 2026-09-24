"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export interface WeddingSettingsFormProps {
  weddingId: string;
  userRole: "ADMIN" | "MANAGER" | "ORGANISER";
  initialData: {
    title: string;
    brideName: string;
    groomName: string;
    primaryWeddingDate: string;
    city?: string;
    venueName?: string;
    preferredLanguage: "en" | "hi";
    status: "PLANNING" | "COMPLETED" | "ARCHIVED";
  };
}

export function WeddingSettingsForm({
  weddingId,
  userRole,
  initialData,
}: WeddingSettingsFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: initialData.title || "",
    brideName: initialData.brideName || "",
    groomName: initialData.groomName || "",
    primaryWeddingDate: initialData.primaryWeddingDate
      ? new Date(initialData.primaryWeddingDate).toISOString().split("T")[0]
      : "",
    city: initialData.city || "",
    venueName: initialData.venueName || "",
    preferredLanguage: initialData.preferredLanguage || "en",
    status: initialData.status || "PLANNING",
  });

  const [activeTab, setActiveTab] = useState<"general" | "language" | "status">("general");
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = userRole === "ADMIN";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setError("Only wedding ADMINs can modify workspace settings.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          bride: { name: formData.brideName },
          groom: { name: formData.groomName },
          primaryWeddingDate: formData.primaryWeddingDate,
          generalLocation: {
            city: formData.city,
            name: formData.venueName,
          },
          preferredLanguage: formData.preferredLanguage,
          status: formData.status,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setShowToast(true);
        router.refresh();
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setError(json.error?.message || "Failed to update settings");
      }
    } catch (err) {
      console.error("Save settings error:", err);
      setError("An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col w-full pb-20 space-y-6">
      {/* Header & Tab Bar */}
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 pb-4">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-xs uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-primary-container" />
            <span>Workspace Configuration</span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-primary tracking-tight font-bold">
            Wedding Settings
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant max-w-2xl">
            Manage core couple identity, primary venue schedules, regional parameters, and workspace
            state for {formData.title || "your wedding"}.
          </p>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-surface-container-lowest px-3.5 py-1.5 rounded-full shadow-xs border border-surface-container-high/60">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
          </span>
          <span className="font-label-sm text-xs text-secondary font-semibold">Cloud Synced</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container-high w-fit max-w-full overflow-x-auto shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-headline-sm text-xs font-semibold transition-all ${
            activeTab === "general"
              ? "bg-surface-container-lowest text-primary-container shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>General</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("language")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-headline-sm text-xs font-semibold transition-all ${
            activeTab === "language"
              ? "bg-surface-container-lowest text-primary-container shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">translate</span>
          <span>Language &amp; Region</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("status")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-headline-sm text-xs font-semibold transition-all ${
            activeTab === "status"
              ? "bg-surface-container-lowest text-primary-container shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">toggle_on</span>
          <span>Workspace Status</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-error-container text-on-error-container text-xs font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Content (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          {/* Section 01: Couple & Event Overview */}
          {(activeTab === "general" || activeTab === "language" || activeTab === "status") && (
            <section className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-xs border border-surface-container-high/60 flex flex-col space-y-5">
              <div className="flex items-start justify-between pb-2 border-b border-surface-container-high/40">
                <div>
                  <span className="font-label-sm text-xs font-bold uppercase tracking-wider text-primary-container">
                    01 / Foundation
                  </span>
                  <h2 className="font-headline-md text-lg text-on-surface font-semibold mt-0.5">
                    Couple &amp; Event Overview
                  </h2>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    Core ceremony credentials displayed across workspace invitations and registries.
                  </p>
                </div>
                <span className="material-symbols-outlined text-outline-variant text-[24px]">
                  favorite
                </span>
              </div>

              {/* Bride & Groom Dual Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="font-label-sm text-xs font-semibold text-on-surface flex items-center justify-between">
                    <span>Bride&apos;s Full Name *</span>
                    <span className="text-primary-container font-normal text-[11px]">
                      Primary Lead
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
                      person
                    </span>
                    <input
                      type="text"
                      required
                      disabled={!isAdmin}
                      value={formData.brideName}
                      onChange={(e) => setFormData({ ...formData, brideName: e.target.value })}
                      className="w-full h-[42px] pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-primary-container border border-surface-container-high/60 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="font-label-sm text-xs font-semibold text-on-surface flex items-center justify-between">
                    <span>Groom&apos;s Full Name *</span>
                    <span className="text-primary-container font-normal text-[11px]">
                      Primary Lead
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
                      person
                    </span>
                    <input
                      type="text"
                      required
                      disabled={!isAdmin}
                      value={formData.groomName}
                      onChange={(e) => setFormData({ ...formData, groomName: e.target.value })}
                      className="w-full h-[42px] pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-primary-container border border-surface-container-high/60 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* Workspace Title */}
              <div className="flex flex-col space-y-1.5">
                <label className="font-label-sm text-xs font-semibold text-on-surface">
                  Workspace Display Title *
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
                    label
                  </span>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full h-[42px] pl-10 pr-24 rounded-lg bg-surface-container-low text-on-surface font-body-md text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-primary-container border border-surface-container-high/60 disabled:opacity-60"
                  />
                  <span className="absolute right-3 font-label-sm text-[11px] text-on-surface-variant">
                    Display Name
                  </span>
                </div>
              </div>

              {/* Date & Location Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="font-label-sm text-xs font-semibold text-on-surface">
                    Target Muhurat Date *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      required
                      disabled={!isAdmin}
                      value={formData.primaryWeddingDate}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryWeddingDate: e.target.value })
                      }
                      className="w-full h-[42px] pl-3 pr-9 rounded-lg bg-surface-container-low text-on-surface font-body-md text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-primary-container border border-surface-container-high/60 disabled:opacity-60"
                    />
                    <span className="material-symbols-outlined absolute right-3 text-outline pointer-events-none text-[18px]">
                      calendar_today
                    </span>
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="font-label-sm text-xs font-semibold text-on-surface">
                    City / Primary Hub
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
                      pin_drop
                    </span>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      placeholder="e.g. New Delhi, Udaipur"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full h-[42px] pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-primary-container border border-surface-container-high/60 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* Venue Name */}
              <div className="flex flex-col space-y-1.5">
                <label className="font-label-sm text-xs font-semibold text-on-surface">
                  Primary Venue Name
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
                    domain
                  </span>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    placeholder="e.g. The Oberoi Amarvilas, Agra"
                    value={formData.venueName}
                    onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                    className="w-full h-[42px] pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-primary-container border border-surface-container-high/60 disabled:opacity-60"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Section 02: Language & Localization */}
          <section className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-xs border border-surface-container-high/60 flex flex-col space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-surface-container-high/40">
              <div>
                <span className="font-label-sm text-xs font-bold uppercase tracking-wider text-primary-container">
                  02 / Localization
                </span>
                <h2 className="font-headline-md text-lg text-on-surface font-semibold mt-0.5">
                  Preferred Workspace Language
                </h2>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Select interface dialect and communication templates for coordinators.
                </p>
              </div>
              <span className="material-symbols-outlined text-outline-variant text-[24px]">
                g_translate
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div
                onClick={() => isAdmin && setFormData({ ...formData, preferredLanguage: "en" })}
                className={`relative rounded-xl p-4 shadow-xs flex flex-col justify-between cursor-pointer transition-all border ${
                  formData.preferredLanguage === "en"
                    ? "bg-surface-container-low border-primary-container"
                    : "bg-surface-container-lowest hover:bg-surface-container-low/60 border-surface-container-high"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs">
                      EN
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-xs font-bold text-on-surface">
                        English (International)
                      </h3>
                      <span className="font-label-sm text-[11px] text-secondary font-semibold">
                        System Default
                      </span>
                    </div>
                  </div>
                  {formData.preferredLanguage === "en" && (
                    <div className="w-5 h-5 rounded-full bg-primary-container flex items-center justify-center text-on-primary shadow-xs">
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </div>
                  )}
                </div>
                <p className="font-body-sm text-xs text-on-surface-variant mt-3 leading-relaxed">
                  Primary language for workspace controls, checklist management, and vendor
                  agreements.
                </p>
              </div>

              <div
                onClick={() => isAdmin && setFormData({ ...formData, preferredLanguage: "hi" })}
                className={`relative rounded-xl p-4 shadow-xs flex flex-col justify-between cursor-pointer transition-all border ${
                  formData.preferredLanguage === "hi"
                    ? "bg-surface-container-low border-primary-container"
                    : "bg-surface-container-lowest hover:bg-surface-container-low/60 border-surface-container-high"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center font-bold text-xs">
                      हि
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-xs font-bold text-on-surface">
                        हिन्दी (Devanagari)
                      </h3>
                      <span className="font-label-sm text-[11px] text-on-surface-variant">
                        Bilingual Mode
                      </span>
                    </div>
                  </div>
                  {formData.preferredLanguage === "hi" && (
                    <div className="w-5 h-5 rounded-full bg-primary-container flex items-center justify-center text-on-primary shadow-xs">
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </div>
                  )}
                </div>
                <p className="font-body-sm text-xs text-on-surface-variant mt-3 leading-relaxed">
                  Bilingual support for elder family members, Pandit ceremony checklists, and
                  WhatsApp cards.
                </p>
              </div>
            </div>
          </section>

          {/* Section 03: Workspace Status */}
          <section className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-xs border border-surface-container-high/60 flex flex-col space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-surface-container-high/40">
              <div>
                <span className="font-label-sm text-xs font-bold uppercase tracking-wider text-primary-container">
                  03 / Lifecycle
                </span>
                <h2 className="font-headline-md text-lg text-on-surface font-semibold mt-0.5">
                  Wedding Status
                </h2>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Governs collaborator permissions, budget modification limits, and live notification
                  services.
                </p>
              </div>
              <span className="material-symbols-outlined text-outline-variant text-[24px]">
                published_with_changes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Planning */}
              <div
                onClick={() => isAdmin && setFormData({ ...formData, status: "PLANNING" })}
                className={`rounded-xl p-4 flex flex-col justify-between shadow-xs cursor-pointer border ${
                  formData.status === "PLANNING"
                    ? "bg-secondary-fixed/30 border-secondary"
                    : "bg-surface-container-low hover:bg-surface-container border-surface-container-high"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-semibold">
                      Active
                    </span>
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        formData.status === "PLANNING" ? "text-secondary" : "text-on-surface-variant"
                      }`}
                    >
                      {formData.status === "PLANNING"
                        ? "radio_button_checked"
                        : "radio_button_unchecked"}
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-xs font-bold text-on-surface">
                    Planning Phase
                  </h4>
                  <p className="font-body-sm text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">
                    Active workspace with full planning tools, budget modification, and live vendor
                    orchestration.
                  </p>
                </div>
              </div>

              {/* Completed */}
              <div
                onClick={() => isAdmin && setFormData({ ...formData, status: "COMPLETED" })}
                className={`rounded-xl p-4 flex flex-col justify-between shadow-xs cursor-pointer border ${
                  formData.status === "COMPLETED"
                    ? "bg-surface-container border-primary-container"
                    : "bg-surface-container-low hover:bg-surface-container border-surface-container-high"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[10px] font-medium">
                      Post-Event
                    </span>
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        formData.status === "COMPLETED" ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      {formData.status === "COMPLETED"
                        ? "radio_button_checked"
                        : "radio_button_unchecked"}
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-xs font-bold text-on-surface">Completed</h4>
                  <p className="font-body-sm text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">
                    Read-only archive after wedding celebrations conclude. Retains guest memories and
                    ledgers.
                  </p>
                </div>
              </div>

              {/* Archived */}
              <div
                onClick={() => isAdmin && setFormData({ ...formData, status: "ARCHIVED" })}
                className={`rounded-xl p-4 flex flex-col justify-between shadow-xs cursor-pointer border ${
                  formData.status === "ARCHIVED"
                    ? "bg-surface-container border-outline"
                    : "bg-surface-container-low hover:bg-surface-container border-surface-container-high"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[10px] font-medium">
                      Inactive
                    </span>
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        formData.status === "ARCHIVED" ? "text-outline" : "text-on-surface-variant"
                      }`}
                    >
                      {formData.status === "ARCHIVED"
                        ? "radio_button_checked"
                        : "radio_button_unchecked"}
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-xs font-bold text-on-surface">Archived</h4>
                  <p className="font-body-sm text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">
                    Hidden from workspace switcher. Accessible strictly via administrative security.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Info Column (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          {/* Security & Governance Notice Card */}
          <div className="bg-surface-container-low rounded-xl p-5 shadow-xs border border-surface-container-high/60 flex flex-col space-y-3">
            <div className="flex items-center gap-2 text-primary-container font-semibold">
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              <span className="font-label-sm text-xs uppercase tracking-wider">
                Security &amp; Permissions
              </span>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
              You are viewing settings as an <strong>{userRole}</strong>. Modifications made in this
              panel update workspace parameters across all verified coordinators and vendors.
            </p>
            <div className="pt-2 flex items-center justify-between text-xs border-t border-surface-container-high/40">
              <span className="font-label-sm text-on-surface-variant">Version 4.12</span>
              <span className="font-label-sm text-secondary font-semibold">Active Session</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-4 left-0 lg:left-64 right-0 z-40 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-surface-container-high flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-xs font-semibold text-on-surface">
                {isAdmin ? "Admin permissions active" : "Read-only mode (Admin required)"}
              </span>
              <span className="font-body-sm text-[11px] text-on-surface-variant truncate">
                Changes apply immediately to your wedding workspace.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/workspace/${weddingId}`)}
              className="h-9 px-4 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-headline-sm text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !isAdmin}
              className="h-9 px-5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">
                    refresh
                  </span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {showToast && (
        <div className="fixed bottom-20 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 text-xs font-medium">
          <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
            check_circle
          </span>
          <span>Wedding workspace configuration updated successfully.</span>
        </div>
      )}
    </form>
  );
}
