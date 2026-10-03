"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { formatIndianDate } from "@/lib/formatters";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferredLanguage: "en" | "hi";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const tProf = useTranslations("Profile");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [langInput, setLangInput] = useState<"en" | "hi">("en");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/v1/auth/profile", {
          cache: "no-store",
        });

        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }

        const data = await res.json();
        if (data.success && data.data && isMounted) {
          setProfile(data.data);
          setNameInput(data.data.name);
          setLangInput(data.data.preferredLanguage);
        } else if (isMounted) {
          setErrorMsg(data.error?.message || tProf("updateError"));
        }
      } catch {
        if (isMounted) {
          setErrorMsg(tCommon("error"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [router, tProf, tCommon]);

  const handleReset = () => {
    if (profile) {
      setNameInput(profile.name);
      setLangInput(profile.preferredLanguage);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const trimmedName = nameInput.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setErrorMsg(tProf("updateError"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/v1/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          preferredLanguage: langInput,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
        setNameInput(data.data.name);
        setLangInput(data.data.preferredLanguage);

        // Update mmm_locale cookie so next-intl re-renders immediately under new language
        document.cookie = `mmm_locale=${data.data.preferredLanguage}; path=/; max-age=31536000; SameSite=Lax`;

        setSuccessMsg(tProf("updateSuccess"));
        router.refresh();
      } else {
        setErrorMsg(data.error?.message || tProf("updateError"));
      }
    } catch {
      setErrorMsg(tProf("updateError"));
    } finally {
      setSaving(false);
    }
  };

  const isDirty = profile && (nameInput.trim() !== profile.name || langInput !== profile.preferredLanguage);

  const initialLetter = nameInput.trim()
    ? nameInput.trim().charAt(0).toUpperCase()
    : profile?.name.charAt(0).toUpperCase() || "U";

  const formattedDate = profile?.createdAt
    ? formatIndianDate(profile.createdAt, langInput)
    : "";

  return (
    <div className="min-h-screen bg-surface flex flex-col text-on-surface">
      <MarketingHeader initialUser={profile ? { id: profile.id, name: profile.name, email: profile.email } : null} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-gutter pt-28 pb-16">
        {/* Top Navigation & Title */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-2">
              <Link href="/workspace" className="hover:text-primary-container transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>{tCommon("backToWorkspace")}</span>
              </Link>
            </div>
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              {tProf("title")}
            </h1>
            <p className="font-body-md text-sm text-on-surface-variant mt-1">
              {tProf("subtitle")}
            </p>
          </div>

          {profile && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/60 text-xs font-medium text-on-surface-variant self-start sm:self-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{tCommon("status")}: <strong className="text-on-surface uppercase">{profile.status === "ACTIVE" ? tProf("statusActive") : tProf("statusSuspended")}</strong></span>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/60 shadow-sm animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-surface-container-high" />
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-surface-container-high rounded w-48" />
                <div className="h-4 bg-surface-container-high rounded w-64" />
              </div>
            </div>
            <div className="h-10 bg-surface-container-high rounded w-full" />
            <div className="h-10 bg-surface-container-high rounded w-full" />
          </div>
        )}

        {/* Error Banner */}
        {!loading && errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-error flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
            <div className="text-xs sm:text-sm font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Success Banner */}
        {!loading && successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">check_circle</span>
            <div className="text-xs sm:text-sm font-medium">{successMsg}</div>
          </div>
        )}

        {/* Main Profile Form Card */}
        {!loading && profile && (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
            {/* Header Avatar Banner */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-primary-container/10 via-surface-container-low to-transparent border-b border-outline-variant/40 flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary-container text-on-primary font-bold text-2xl sm:text-3xl flex items-center justify-center uppercase shadow-md ring-4 ring-surface">
                {initialLetter}
              </div>
              <div className="flex flex-col min-w-0">
                <h2 className="font-headline-sm text-lg sm:text-xl font-bold text-on-surface truncate">
                  {profile.name}
                </h2>
                <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant truncate mt-0.5">
                  {profile.email}
                </p>
                {formattedDate && (
                  <span className="font-label-sm text-[11px] text-on-surface-variant/80 mt-1">
                    {tProf("memberSince", { date: formattedDate })}
                  </span>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
              {/* Full Name Field */}
              <div className="space-y-2">
                <label htmlFor="name-input" className="block font-headline-sm text-xs sm:text-sm font-semibold text-on-surface">
                  {tProf("fullNameLabel")} <span className="text-error">*</span>
                </label>
                <input
                  id="name-input"
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  placeholder={tProf("fullNameLabel")}
                  className="w-full h-11 px-4 rounded-xl bg-surface border border-outline-variant/60 focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 text-sm text-on-surface outline-none transition-all"
                  required
                  minLength={2}
                  maxLength={100}
                />
                <p className="text-[11px] text-on-surface-variant">
                  {tProf("fullNameHint")}
                </p>
              </div>

              {/* Email Field (Read-only) */}
              <div className="space-y-2">
                <label htmlFor="email-input" className="block font-headline-sm text-xs sm:text-sm font-semibold text-on-surface">
                  {tProf("emailLabel")}
                </label>
                <div className="relative">
                  <input
                    id="email-input"
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full h-11 px-4 pr-10 rounded-xl bg-surface-container-high/40 border border-outline-variant/40 text-sm text-on-surface-variant cursor-not-allowed outline-none select-none"
                  />
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute right-3.5 top-3">
                    lock
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  {tProf("emailHint")}
                </p>
              </div>

              {/* Preferred Language Field */}
              <div className="space-y-2">
                <label htmlFor="language-select" className="block font-headline-sm text-xs sm:text-sm font-semibold text-on-surface">
                  {tProf("languageLabel")}
                </label>
                <select
                  id="language-select"
                  value={langInput}
                  onChange={(e) => {
                    setLangInput(e.target.value as "en" | "hi");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="w-full h-11 px-4 rounded-xl bg-surface border border-outline-variant/60 focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 text-sm text-on-surface outline-none transition-all cursor-pointer"
                >
                  <option value="en">{tProf("englishOption")}</option>
                  <option value="hi">{tProf("hindiOption")}</option>
                </select>
                <p className="text-[11px] text-on-surface-variant">
                  {tProf("languageHint")}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-outline-variant/40 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!isDirty || saving}
                  className="h-10 px-5 rounded-xl border border-outline-variant/60 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tProf("resetBtn")}
                </button>
                <button
                  type="submit"
                  disabled={!isDirty || saving}
                  className="h-10 px-6 rounded-xl bg-primary-container hover:bg-[#5D1F2C] text-on-primary text-xs font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <span className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />}
                  <span>{saving ? tProf("savingBtn") : tProf("saveBtn")}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
