"use client";

import React, { useEffect, useState, use } from "react";
import { EntitlementsDTO } from "@/modules/billing/dto/billing.dto";

interface PageProps {
  params: Promise<{ weddingId: string }>;
}

export default function WorkspaceBillingPage({ params }: PageProps) {
  const { weddingId } = use(params);

  const [entitlements, setEntitlements] = useState<EntitlementsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const fetchEntitlements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/billing/subscription`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setEntitlements(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch billing data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/weddings/${weddingId}/billing/subscription`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && !ignore) setEntitlements(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch billing data:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [weddingId]);

  const handleSandboxUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "PREMIUM",
          billingCycle: "ONETIME",
          provider: "SANDBOX",
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowUpgradeModal(false);
        fetchEntitlements();
      } else {
        alert(json.error?.message || "Checkout failed");
      }
    } catch (err) {
      console.error("Upgrade error:", err);
    } finally {
      setUpgrading(false);
    }
  };

  const handleDowngradeToFree = async () => {
    if (!confirm("Are you sure you want to cancel subscription and revert to Free tier?")) return;
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/billing/cancel`, { method: "POST" });
      if (res.ok) fetchEntitlements();
    } catch (err) {
      console.error("Cancel subscription error:", err);
    }
  };

  return (
    <div className="space-y-space-md p-space-md max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-2xl border border-surface-container-high/60 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary font-headline">Plan &amp; Usage Metrics</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage your workspace subscription tier, storage quota, and resource usage limits.
          </p>
        </div>
        {entitlements && (
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                entitlements.planId === "PREMIUM"
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {entitlements.planName}
            </span>
            {entitlements.planId === "FREE" ? (
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95 shadow-xs"
              >
                Upgrade to Premium
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDowngradeToFree}
                className="px-3 py-1.5 rounded-xl border border-surface-container-high text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel Premium
              </button>
            )}
          </div>
        )}
      </div>

      {loading || !entitlements ? (
        <div className="py-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[32px] animate-spin text-primary-container">progress_activity</span>
          Loading plan &amp; entitlement metrics...
        </div>
      ) : (
        <div className="space-y-space-md">
          {/* Usage Progress Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {/* Events Usage */}
            <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-surface-container-high shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold">
                <span>Ceremony Events</span>
                <span>
                  {entitlements.usage.eventsCount} / {entitlements.limits.maxEvents}
                </span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-container rounded-full transition-all"
                  style={{ width: `${entitlements.quotaUsagePercent.events}%` }}
                />
              </div>
              <p className="text-[11px] text-on-surface-variant/80">
                {entitlements.limits.maxEvents - entitlements.usage.eventsCount} remaining on {entitlements.planName}
              </p>
            </div>

            {/* Team Usage */}
            <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-surface-container-high shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold">
                <span>Team Members</span>
                <span>
                  {entitlements.usage.teamMembersCount} / {entitlements.limits.maxTeamMembers}
                </span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all"
                  style={{ width: `${entitlements.quotaUsagePercent.teamMembers}%` }}
                />
              </div>
              <p className="text-[11px] text-on-surface-variant/80">Collaborator accounts</p>
            </div>

            {/* Households Usage */}
            <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-surface-container-high shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold">
                <span>Guest Households</span>
                <span>
                  {entitlements.usage.guestHouseholdsCount} / {entitlements.limits.maxGuestHouseholds}
                </span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all"
                  style={{ width: `${entitlements.quotaUsagePercent.guestHouseholds}%` }}
                />
              </div>
              <p className="text-[11px] text-on-surface-variant/80">Digital invitations limit</p>
            </div>

            {/* Storage Quota */}
            <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-surface-container-high shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold">
                <span>Media Storage</span>
                <span>
                  {Math.round(entitlements.usage.storageBytes / (1024 * 1024))} MB / {Math.round(entitlements.limits.maxStorageBytes / (1024 * 1024))} MB
                </span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all"
                  style={{ width: `${entitlements.quotaUsagePercent.storage}%` }}
                />
              </div>
              <p className="text-[11px] text-on-surface-variant/80">Photo &amp; Document storage</p>
            </div>
          </div>

          {/* Feature Tier Comparison Matrix */}
          <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-surface-container-high space-y-4">
            <h3 className="text-base font-bold text-on-surface">Plan Feature Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md text-xs">
              <div className="p-4 rounded-xl border border-surface-container bg-surface-container/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface">Video &amp; Audio Clips</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${entitlements.limits.allowVideoMedia ? "bg-emerald-100 text-emerald-800" : "bg-surface-container text-on-surface-variant"}`}>
                    {entitlements.limits.allowVideoMedia ? "ENABLED" : "LOCKED"}
                  </span>
                </div>
                <p className="text-on-surface-variant">Upload Sangeet, Haldi, and ceremony video recordings to the media vault.</p>
              </div>

              <div className="p-4 rounded-xl border border-surface-container bg-surface-container/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface">Luxury Website Themes</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${entitlements.limits.allowCustomWebsiteThemes ? "bg-emerald-100 text-emerald-800" : "bg-surface-container text-on-surface-variant"}`}>
                    {entitlements.limits.allowCustomWebsiteThemes ? "ALL UNLOCKED" : "BASIC THEMES"}
                  </span>
                </div>
                <p className="text-on-surface-variant">Access Royal Gold, Midnight Romance, and custom typography themes for your website.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-space-md border border-surface-container-high shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-on-surface">Upgrade to Premium Celebration</h2>
              <button type="button" onClick={() => setShowUpgradeModal(false)} className="text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-xs">
              <p className="font-bold text-sm">₹2,999 / Wedding (One-time Access)</p>
              <ul className="list-disc list-inside space-y-1 text-amber-800">
                <li>10 GB Media Storage (Photos &amp; Video Clips)</li>
                <li>Unlimited Events &amp; Ceremonies</li>
                <li>Up to 1,000 Guest Households</li>
                <li>Up to 50 Team Collaborators</li>
                <li>All Premium Wedding Website Themes</li>
              </ul>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              In Sandbox Testing Mode, clicking upgrade will instantly simulate payment confirmation and activate Premium entitlements.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={upgrading}
                onClick={handleSandboxUpgrade}
                className="px-5 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-bold hover:opacity-95 disabled:opacity-50"
              >
                {upgrading ? "Activating..." : "Confirm Upgrade (Sandbox)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
