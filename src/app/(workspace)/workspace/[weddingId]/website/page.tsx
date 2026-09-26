"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { WeddingSiteDTO, WebsiteSectionDTO, WebsiteTheme } from "@/modules/website/dto/wedding-site.dto";
import { ThemeSelector } from "@/components/website/ThemeSelector";
import { SiteSettingsModal } from "@/components/website/SiteSettingsModal";
import { SectionEditorModal } from "@/components/website/SectionEditorModal";
import { LivePreviewModal } from "@/components/website/LivePreviewModal";

interface WebsitePageProps {
  params: Promise<{ weddingId: string }>;
}

export default function WebsiteBuilderPage({ params }: WebsitePageProps) {
  const { weddingId } = use(params);

  const [site, setSite] = useState<WeddingSiteDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"sections" | "theme">("sections");

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<WebsiteSectionDTO | null>(null);

  const fetchSiteConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/site`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSite(data.data);
      } else {
        setError(data.error?.message || "Failed to load wedding website configuration");
      }
    } catch (err: unknown) {
      console.error("Error fetching site configuration:", err);
      setError("Failed to load wedding website configuration");
    }
    setLoading(false);
  }, [weddingId]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        await fetchSiteConfig();
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [fetchSiteConfig]);

  const handleUpdateSite = async (payload: {
    slug?: string;
    theme?: WebsiteTheme;
    locale?: string;
    seo?: { title?: string; description?: string; noIndex?: boolean };
    style?: { primaryColor?: string; secondaryColor?: string; fontFamily?: string };
    sections?: WebsiteSectionDTO[];
  }): Promise<boolean> => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/site`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSite(data.data);
        setSuccessMessage("Website changes saved successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        return true;
      } else {
        setError(data.error?.message || "Failed to save website changes");
        return false;
      }
    } catch (err: unknown) {
      console.error("Error saving site updates:", err);
      setError("Failed to save website changes");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!site) return;
    const isCurrentlyPublished = site.status === "PUBLISHED";
    const endpoint = isCurrentlyPublished
      ? `/api/v1/weddings/${weddingId}/site/unpublish`
      : `/api/v1/weddings/${weddingId}/site/publish`;

    if (
      isCurrentlyPublished &&
      !confirm("Are you sure you want to unpublish your wedding website? Public visitors will no longer be able to view it.")
    ) {
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSite(data.data);
        setSuccessMessage(
          isCurrentlyPublished
            ? "Website has been unpublished and returned to Draft mode."
            : "Website published successfully! It is now live to the public."
        );
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setError(data.error?.message || "Publish status transition failed");
      }
    } catch (err: unknown) {
      console.error("Publish toggle error:", err);
      setError("Publish status transition failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    if (!site || !site.sections) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= site.sections.length) return;

    const newSections = [...site.sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Recalculate order indices
    const updatedSections = newSections.map((sec, idx) => ({ ...sec, order: idx }));

    setSite({ ...site, sections: updatedSections });
    handleUpdateSite({ sections: updatedSections });
  };

  const handleToggleSectionEnabled = (sectionId: string, currentEnabled: boolean) => {
    if (!site || !site.sections) return;
    const updatedSections = site.sections.map((sec) =>
      sec.id === sectionId ? { ...sec, enabled: !currentEnabled } : sec
    );

    setSite({ ...site, sections: updatedSections });
    handleUpdateSite({ sections: updatedSections });
  };

  const handleSaveSectionConfig = (updatedSec: WebsiteSectionDTO) => {
    if (!site || !site.sections) return;
    const updatedSections = site.sections.map((sec) =>
      sec.id === updatedSec.id ? updatedSec : sec
    );

    setSite({ ...site, sections: updatedSections });
    handleUpdateSite({ sections: updatedSections });
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center text-on-surface-variant gap-3">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">
          progress_activity
        </span>
        <span className="text-sm font-medium">Loading website builder...</span>
      </div>
    );
  }

  if (error && !site) {
    return (
      <div className="p-6 bg-error-container text-on-error-container rounded-2xl text-sm font-medium flex items-center gap-2 my-6">
        <span className="material-symbols-outlined">error</span>
        {error}
      </div>
    );
  }

  const isPublished = site?.status === "PUBLISHED";
  const publicUrl = `/w/${site?.slug}`;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-serif text-on-surface">
              Wedding Website &amp; Builder
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isPublished
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {site?.status}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Customize layout sections, themes, ceremony schedules, and public website metadata.
          </p>
          <div className="text-xs text-on-surface-variant mt-2 flex items-center gap-2">
            <span>Public URL:</span>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-primary underline hover:text-primary/80 font-bold"
            >
              {publicUrl}
            </a>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-outline/30 bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            Settings &amp; SEO
          </button>

          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            Live Preview
          </button>

          {isPublished && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-primary/30 bg-primary-container/20 text-primary hover:bg-primary-container/40 flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              View Live Website
            </a>
          )}

          <button
            onClick={handlePublishToggle}
            disabled={publishing}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${
              isPublished
                ? "bg-surface-container-high text-on-surface hover:bg-error/20 hover:text-error"
                : "bg-primary text-on-primary hover:bg-primary/90"
            }`}
          >
            {publishing && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            <span className="material-symbols-outlined text-[18px]">
              {isPublished ? "unpublished" : "publish"}
            </span>
            {isPublished ? "Unpublish Website" : "Publish Website"}
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/30 text-emerald-300 border border-emerald-500/30 rounded-2xl text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          {successMessage}
        </div>
      )}
      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-2xl text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-surface-container-high/60 gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab("sections")}
          className={`pb-3 px-2 font-bold flex items-center gap-2 transition-colors relative ${
            activeTab === "sections"
              ? "text-primary border-b-2 border-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">view_stream</span>
          Website Sections &amp; Content
        </button>

        <button
          onClick={() => setActiveTab("theme")}
          className={`pb-3 px-2 font-bold flex items-center gap-2 transition-colors relative ${
            activeTab === "theme"
              ? "text-primary border-b-2 border-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">palette</span>
          Theme &amp; Styles
        </button>
      </div>

      {/* Tab 1: Section Ordering & Content Config */}
      {activeTab === "sections" && site && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-on-surface font-serif">
              Section Layout &amp; Reordering
            </h2>
            <span className="text-xs text-on-surface-variant">
              Reorder sections using controls or click Configure to edit content.
            </span>
          </div>

          <div className="space-y-3">
            {site.sections
              .sort((a, b) => a.order - b.order)
              .map((sec, index) => (
                <div
                  key={sec.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    sec.enabled
                      ? "bg-surface-container-lowest border-surface-container-high shadow-xs"
                      : "bg-surface-container-low/40 border-outline/20 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveSection(index, "up")}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-surface-container text-on-surface-variant disabled:opacity-30"
                        title="Move Section Up"
                      >
                        <span className="material-symbols-outlined text-sm">keyboard_arrow_up</span>
                      </button>
                      <button
                        onClick={() => handleMoveSection(index, "down")}
                        disabled={index === site.sections.length - 1}
                        className="p-1 rounded hover:bg-surface-container text-on-surface-variant disabled:opacity-30"
                        title="Move Section Down"
                      >
                        <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                      </button>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-primary-container/30 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {index + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-bold text-sm text-on-surface">
                          {sec.type.replace("_", " ")}
                        </h3>
                        {!sec.enabled && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant truncate max-w-md mt-0.5">
                        {(sec.config.title as string) || (sec.config.subtitle as string) || "Default content"}
                      </p>
                    </div>
                  </div>

                  {/* Section Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleSectionEnabled(sec.id, sec.enabled)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        sec.enabled
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-950/20"
                          : "border-outline/30 text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {sec.enabled ? "Visible" : "Hidden"}
                    </button>

                    <button
                      onClick={() => setEditingSection(sec)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Configure Content
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab 2: Theme & Styles */}
      {activeTab === "theme" && site && (
        <ThemeSelector
          currentTheme={site.theme}
          style={site.style}
          onThemeChange={(theme, defaultStyle) =>
            handleUpdateSite({
              theme,
              style: {
                ...site.style,
                ...defaultStyle,
              },
            })
          }
          onStyleChange={(updatedStyle) =>
            handleUpdateSite({
              style: {
                ...site.style,
                ...updatedStyle,
              },
            })
          }
        />
      )}

      {/* Modals */}
      {site && (
        <SiteSettingsModal
          isOpen={isSettingsOpen}
          site={site}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleUpdateSite}
        />
      )}

      <SectionEditorModal
        isOpen={Boolean(editingSection)}
        section={editingSection}
        onClose={() => setEditingSection(null)}
        onSave={handleSaveSectionConfig}
      />

      <LivePreviewModal
        isOpen={isPreviewOpen}
        weddingId={weddingId}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}
