"use client";

import React, { useState, useEffect } from "react";
import { WeddingSiteDTO } from "@/modules/website/dto/wedding-site.dto";

interface SiteSettingsModalProps {
  isOpen: boolean;
  site: WeddingSiteDTO;
  onClose: () => void;
  onSave: (updatedFields: {
    slug?: string;
    locale?: string;
    seo?: { title?: string; description?: string; noIndex?: boolean };
  }) => Promise<boolean>;
}

export function SiteSettingsModal({
  isOpen,
  site,
  onClose,
  onSave,
}: SiteSettingsModalProps) {
  const [slug, setSlug] = useState("");
  const [locale, setLocale] = useState("en");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [noIndex, setNoIndex] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (site) {
      void Promise.resolve().then(() => {
        if (isMounted) {
          setSlug(site.slug || "");
          setLocale(site.locale || "en");
          setSeoTitle(site.seo?.title || "");
          setSeoDescription(site.seo?.description || "");
          setNoIndex(Boolean(site.seo?.noIndex));
          setError(null);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [site, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = slug.trim().toLowerCase();

    if (!cleanSlug) {
      setError("Website URL slug is required");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      setError("URL slug can only contain lowercase letters, numbers, and hyphens");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const success = await onSave({
        slug: cleanSlug,
        locale,
        seo: {
          title: seoTitle.trim() || undefined,
          description: seoDescription.trim() || undefined,
          noIndex,
        },
      });

      if (success) {
        onClose();
      }
    } catch (err: unknown) {
      console.error("Save site settings error:", err);
      setError("Failed to update site settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-container-high my-8 flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">settings</span>
            <h2 className="text-xl font-bold font-serif text-on-surface">
              Website Settings &amp; SEO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-error-container text-on-error-container rounded-xl text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 overflow-y-auto pr-1">
          {/* Public URL Slug */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Public Website URL Slug *
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 bg-surface-container border border-r-0 border-outline/30 rounded-l-xl text-xs font-mono text-on-surface-variant select-none">
                /w/
              </span>
              <input
                type="text"
                required
                placeholder="e.g. rahul-and-neha"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                className="flex-1 px-3 py-2.5 bg-surface-container-low border border-outline/30 rounded-r-xl text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-[11px] text-on-surface-variant/80 mt-1">
              Your public URL: <strong className="font-mono text-primary">/w/{slug || "your-slug"}</strong>
            </p>
          </div>

          {/* Primary Language */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Primary Language (Locale)
            </label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="en">English (en)</option>
              <option value="hi">Hindi (hi)</option>
            </select>
          </div>

          <div className="pt-2 border-t border-surface-container-high/60" />

          {/* SEO Metadata */}
          <div>
            <h3 className="text-sm font-bold text-on-surface font-serif mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">search</span>
              Search Engine Optimization (SEO)
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Meta Title Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul & Neha's Wedding Website"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Meta Description
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Join us in celebrating our wedding ceremony in Jaipur. Find event schedules, venues, and story."
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline/20">
                <div>
                  <span className="block text-xs font-bold text-on-surface">
                    Hide from Search Engines (noindex)
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Instruct search engines not to index your website in search results.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={noIndex}
                  onChange={(e) => setNoIndex(e.target.checked)}
                  className="w-4 h-4 rounded text-primary border-outline/30 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-container-high flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-outline/30 hover:bg-surface-container-high text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
