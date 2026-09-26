"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { PublicGuestAccessDTO } from "@/modules/guests/dto/guest.dto";

interface PublicInvitationPageProps {
  params: Promise<{ token: string }>;
}

export default function PublicInvitationPage({ params }: PublicInvitationPageProps) {
  const { token } = use(params);

  const [data, setData] = useState<PublicGuestAccessDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<"ATTENDING" | "NOT_ATTENDING">("ATTENDING");
  const [attendingCount, setAttendingCount] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchInvitation = async () => {
      try {
        const res = await fetch(`/api/v1/public/guest-access/${token}`, {
          cache: "no-store",
        });
        const result = await res.json();

        if (isMounted) {
          if (res.ok && result.success && result.data) {
            setData(result.data);
            setSelectedStatus(
              result.data.rsvp?.status === "NOT_ATTENDING" ? "NOT_ATTENDING" : "ATTENDING"
            );
            setAttendingCount(
              result.data.rsvp?.attendingCount && result.data.rsvp.attendingCount > 0
                ? result.data.rsvp.attendingCount
                : result.data.totalInvited || 1
            );
          } else {
            setError(result.error?.message || "Invitation link is invalid, expired, or revoked.");
          }
        }
      } catch (err: unknown) {
        console.error("Error fetching invitation:", err);
        if (isMounted) setError("Unable to load invitation details.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchInvitation();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        status: selectedStatus,
        attendingCount: selectedStatus === "ATTENDING" ? attendingCount : 0,
      };

      const res = await fetch(`/api/v1/public/guest-access/${token}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok && result.success && result.data) {
        setData(result.data);
        setSubmittedSuccess(true);
      } else {
        setError(result.error?.message || "Failed to submit RSVP response.");
      }
    } catch (err: unknown) {
      console.error("Error submitting RSVP:", err);
      setError("Failed to submit RSVP response.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
          <span className="text-base font-medium">Opening your wedding invitation...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface-container-low flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-3xl shadow-xl border border-surface-container-high text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto text-3xl">
            <span className="material-symbols-outlined">link_off</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-on-surface">Invitation Access Issue</h2>
          <p className="text-sm text-on-surface-variant">
            {error || "The invitation link is invalid, expired, or has been revoked."}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-md"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const coupleTitle =
    data.wedding.brideName && data.wedding.groomName
      ? `${data.wedding.brideName} & ${data.wedding.groomName}`
      : data.wedding.title;

  return (
    <div className="min-h-screen bg-surface-container-low py-12 px-4 flex flex-col items-center">
      {/* Container Card */}
      <div className="max-w-xl w-full bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container-high overflow-hidden animate-in fade-in duration-300">
        {/* Header Hero */}
        <div className="bg-gradient-to-b from-primary/15 via-primary-container/20 to-surface-container-lowest p-8 text-center space-y-3 border-b border-surface-container-high">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-container/50 text-on-primary-container text-xs font-bold uppercase tracking-widest">
            Wedding Invitation
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-on-surface tracking-tight">
            {coupleTitle}
          </h1>

          {data.wedding.primaryWeddingDate && (
            <p className="text-sm font-medium text-primary flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-base">calendar_month</span>
              {new Date(data.wedding.primaryWeddingDate).toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}

          {(data.wedding.locationName || data.wedding.cityName) && (
            <p className="text-xs text-on-surface-variant flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-sm">location_on</span>
              {[data.wedding.locationName, data.wedding.cityName].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        {/* Guest Household Card */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="p-5 bg-surface-container-low rounded-2xl border border-surface-container text-center space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Cordially Invited</p>
            <h2 className="text-2xl font-bold font-serif text-on-surface">{data.householdName}</h2>
            <p className="text-xs text-on-surface-variant">
              Passes Reserved: <span className="font-bold text-on-surface font-mono">{data.totalInvited}</span>
            </p>
            {data.members && data.members.length > 0 && (
              <div className="pt-2 flex flex-wrap justify-center gap-1.5">
                {data.members.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-lg bg-surface-container text-on-surface-variant text-xs font-medium"
                  >
                    {m.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submission Success Banner */}
          {submittedSuccess && (
            <div className="p-4 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 rounded-2xl text-sm font-medium text-center space-y-1 animate-in zoom-in-95">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xl">
                ✓
              </div>
              <p className="font-bold text-base font-serif">Thank You!</p>
              <p className="text-xs">Your RSVP response has been recorded successfully.</p>
            </div>
          )}

          {/* RSVP Form */}
          <form onSubmit={handleSubmitRsvp} className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant text-center">
              Please Confirm Your Presence
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedStatus === "ATTENDING"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-sm"
                    : "border-outline/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <input
                  type="radio"
                  name="rsvpStatus"
                  value="ATTENDING"
                  checked={selectedStatus === "ATTENDING"}
                  onChange={() => setSelectedStatus("ATTENDING")}
                  className="sr-only"
                />
                <span className="material-symbols-outlined text-2xl text-emerald-600 mb-1">
                  check_circle
                </span>
                <span className="font-bold text-sm">Joyfully Accepts</span>
                <span className="text-[11px] text-on-surface-variant mt-0.5">We will attend</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedStatus === "NOT_ATTENDING"
                    ? "border-error bg-error-container/40 text-on-error-container shadow-sm"
                    : "border-outline/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <input
                  type="radio"
                  name="rsvpStatus"
                  value="NOT_ATTENDING"
                  checked={selectedStatus === "NOT_ATTENDING"}
                  onChange={() => setSelectedStatus("NOT_ATTENDING")}
                  className="sr-only"
                />
                <span className="material-symbols-outlined text-2xl text-error mb-1">
                  cancel
                </span>
                <span className="font-bold text-sm">Regretfully Declines</span>
                <span className="text-[11px] text-on-surface-variant mt-0.5">Unable to attend</span>
              </label>
            </div>

            {selectedStatus === "ATTENDING" && (
              <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-container space-y-2 animate-in fade-in">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Number of Guests Attending *
                </label>
                <select
                  value={attendingCount}
                  onChange={(e) => setAttendingCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline/30 rounded-xl text-on-surface font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Array.from({ length: data.totalInvited }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} Guest{n > 1 ? "s" : ""} (Max {data.totalInvited})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
              {submittedSuccess ? "Update RSVP Response" : "Submit RSVP Response"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-low border-t border-surface-container-high text-center">
          <p className="text-[11px] text-on-surface-variant font-serif">
            Powered by Make My Marriage — Premier Wedding Management Platform
          </p>
        </div>
      </div>
    </div>
  );
}
