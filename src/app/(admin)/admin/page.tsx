"use client";

import React, { useEffect, useState } from "react";

interface AdminMetrics {
  totalUsers: number;
  totalWeddings: number;
  totalStorageBytes: number;
  totalStorageMB: number;
  subscriptionsBreakdown: { planId: string; status: string; count: number }[];
}

interface WeddingAdminSummary {
  id: string;
  title: string;
  brideName: string;
  groomName: string;
  primaryWeddingDate: string;
  createdAt: string;
  subscription: {
    id?: string;
    planId: string;
    status: string;
    provider: string;
  };
}

export default function PlatformAdminPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [weddings, setWeddings] = useState<WeddingAdminSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overrideSubId, setOverrideSubId] = useState<string | null>(null);
  const [overridePlan, setOverridePlan] = useState<"FREE" | "PREMIUM">("PREMIUM");
  const [overrideStatus, setOverrideStatus] = useState<"ACTIVE" | "EXPIRED" | "PAST_DUE">("ACTIVE");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  const fetchAdminData = async (query = "") => {
    setLoading(true);
    setError(null);
    try {
      const url = query ? `/api/v1/admin/weddings?search=${encodeURIComponent(query)}` : `/api/v1/admin/weddings`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.success) {
        setMetrics(json.data.metrics);
        setWeddings(json.data.weddings);
      } else {
        setError(json.error?.message || "Platform Admin access denied");
      }
    } catch (err) {
      console.error("Fetch admin data error:", err);
      setError("Failed to load platform admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/admin/weddings`);
        const json = await res.json();
        if (res.ok && json.success && !ignore) {
          setMetrics(json.data.metrics);
          setWeddings(json.data.weddings);
        } else if (!ignore) {
          setError(json.error?.message || "Platform Admin access denied");
        }
      } catch (err) {
        console.error("Fetch admin data error:", err);
        if (!ignore) setError("Failed to load platform admin dashboard");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData(search);
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideSubId || !overrideReason.trim()) return;

    setOverrideSubmitting(true);
    try {
      const res = await fetch(`/api/v1/admin/subscriptions/${overrideSubId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: overridePlan,
          status: overrideStatus,
          reason: overrideReason,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setOverrideSubId(null);
        setOverrideReason("");
        fetchAdminData(search);
      } else {
        alert(json.error?.message || "Override failed");
      }
    } catch (err) {
      console.error("Override submit error:", err);
    } finally {
      setOverrideSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-surface-container-low flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-3xl shadow-xl border border-surface-container-high text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto text-3xl">
            <span className="material-symbols-outlined">gavel</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-on-surface">Platform Admin Restricted</h2>
          <p className="text-sm text-on-surface-variant">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low p-6 sm:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary font-headline flex items-center gap-2">
              <span className="material-symbols-outlined text-[28px]">admin_panel_settings</span>
              Make My Marriage — Platform Admin
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Internal system operations, subscription overrides, and platform storage metrics.
            </p>
          </div>
        </div>

        {loading || !metrics ? (
          <div className="py-16 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[32px] animate-spin text-primary-container">progress_activity</span>
            Loading admin metrics...
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Users</p>
                <p className="text-3xl font-extrabold text-on-surface mt-2">{metrics.totalUsers}</p>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Active Weddings</p>
                <p className="text-3xl font-extrabold text-on-surface mt-2">{metrics.totalWeddings}</p>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Storage Used</p>
                <p className="text-3xl font-extrabold text-on-surface mt-2">{metrics.totalStorageMB} MB</p>
              </div>
            </div>

            {/* Search & Weddings Table */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-base font-bold text-on-surface">Platform Weddings &amp; Subscriptions</h3>
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search wedding title or couple..."
                    className="text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button type="submit" className="px-3 py-2 bg-primary-container text-on-primary rounded-xl text-xs font-semibold">
                    Search
                  </button>
                </form>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-on-surface border-collapse">
                  <thead>
                    <tr className="border-b border-surface-container-high text-on-surface-variant font-semibold">
                      <th className="py-3 px-3">Wedding Title</th>
                      <th className="py-3 px-3">Couple</th>
                      <th className="py-3 px-3">Wedding Date</th>
                      <th className="py-3 px-3">Plan</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weddings.map((w) => (
                      <tr key={w.id} className="border-b border-surface-container-high/60 hover:bg-surface-container/20">
                        <td className="py-3 px-3 font-bold">{w.title}</td>
                        <td className="py-3 px-3">
                          {w.brideName} &amp; {w.groomName}
                        </td>
                        <td className="py-3 px-3">{new Date(w.primaryWeddingDate).toLocaleDateString()}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              w.subscription.planId === "PREMIUM" ? "bg-amber-100 text-amber-900" : "bg-surface-container text-on-surface-variant"
                            }`}
                          >
                            {w.subscription.planId}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              w.subscription.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {w.subscription.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {w.subscription.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setOverrideSubId(w.subscription.id!);
                                setOverridePlan(w.subscription.planId as "FREE" | "PREMIUM");
                                setOverrideStatus(w.subscription.status as "ACTIVE" | "EXPIRED" | "PAST_DUE");
                              }}
                              className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-[11px] font-semibold"
                            >
                              Override Plan
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Override Modal */}
      {overrideSubId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-space-md border border-surface-container-high shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-on-surface">Platform Admin Subscription Override</h2>
            <form onSubmit={handleOverrideSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Target Plan</label>
                <select
                  value={overridePlan}
                  onChange={(e) => setOverridePlan(e.target.value as "FREE" | "PREMIUM")}
                  className="w-full text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="FREE">Free Tier (FREE)</option>
                  <option value="PREMIUM">Premium Celebration (PREMIUM)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value as "ACTIVE" | "EXPIRED" | "PAST_DUE")}
                  className="w-full text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAST_DUE">PAST_DUE</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Audit Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Provide mandatory reason for audit log..."
                  className="w-full text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideSubId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideSubmitting || !overrideReason.trim()}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 disabled:opacity-50"
                >
                  {overrideSubmitting ? "Saving..." : "Apply Audited Override"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
