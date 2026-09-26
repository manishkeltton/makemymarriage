"use client";

import React, { useState, useEffect } from "react";
import { PublicWeddingSiteDTO } from "@/modules/website/dto/wedding-site.dto";

interface LivePreviewModalProps {
  isOpen: boolean;
  weddingId: string;
  onClose: () => void;
}

export function LivePreviewModal({
  isOpen,
  weddingId,
  onClose,
}: LivePreviewModalProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<PublicWeddingSiteDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/weddings/${weddingId}/site/preview`);
        const data = await res.json();
        if (res.ok && data.success) {
          setPreviewData(data.data);
        } else {
          setError(data.error?.message || "Failed to load website preview");
        }
      } catch (err: unknown) {
        console.error("Preview load error:", err);
        setError("Failed to load website preview");
      }
      setLoading(false);
    };

    fetchPreview();
  }, [isOpen, weddingId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="h-16 px-6 bg-stone-900 border-b border-stone-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-400">visibility</span>
          <div>
            <h2 className="text-sm font-bold text-white font-serif">
              Live Authorised Website Preview
            </h2>
            <span className="text-[11px] text-stone-400">
              Draft changes preview (visible only to workspace team)
            </span>
          </div>
        </div>

        {/* Viewport Toggles */}
        <div className="flex items-center bg-stone-800 p-1 rounded-xl border border-stone-700">
          <button
            onClick={() => setDevice("desktop")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              device === "desktop"
                ? "bg-amber-500 text-stone-950 font-bold shadow-xs"
                : "text-stone-300 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
            Desktop View
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              device === "mobile"
                ? "bg-amber-500 text-stone-950 font-bold shadow-xs"
                : "text-stone-300 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">smartphone</span>
            Mobile View
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors flex items-center gap-1 text-xs font-bold"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
          Exit Preview
        </button>
      </div>

      {/* Preview Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex justify-center items-start bg-stone-950/60">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-stone-400">
            <span className="material-symbols-outlined text-4xl animate-spin text-amber-400 mb-3">
              progress_activity
            </span>
            <p className="text-sm font-medium">Loading live website preview...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/40 border border-red-800/50 rounded-2xl max-w-md text-red-200 text-center my-12">
            <span className="material-symbols-outlined text-3xl mb-2 text-red-400">error</span>
            <p className="text-sm font-bold">{error}</p>
          </div>
        ) : (
          <div
            className={`transition-all duration-300 bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl my-4 ${
              device === "mobile" ? "w-[390px] min-h-[750px] border-8 border-stone-800 rounded-[36px]" : "w-full max-w-5xl"
            }`}
          >
            {/* Website Content Preview */}
            <PreviewSiteRenderer data={previewData!} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Renders the preview site layout based on site theme & section configs.
 */
function PreviewSiteRenderer({ data }: { data: PublicWeddingSiteDTO }) {
  const { theme, style, sections, wedding, events } = data;
  const weddingTitle = wedding.title;
  const brideName = wedding.brideName || "Bride";
  const groomName = wedding.groomName || "Groom";
  const primaryWeddingDate = wedding.primaryWeddingDate;
  const generalLocation = wedding.generalLocation?.city || "Jaipur, Rajasthan";

  const fontStyle = { fontFamily: style?.fontFamily || "Playfair Display, serif" };
  const primaryColor = style?.primaryColor || "#D4AF37";

  return (
    <div className="bg-stone-950 text-stone-100 min-h-screen selection:bg-amber-500 selection:text-stone-950" style={fontStyle}>
      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-stone-800/80 flex items-center justify-between sticky top-0 bg-stone-950/90 backdrop-blur-md z-30">
        <span className="font-serif font-bold tracking-wider text-amber-400 text-lg">
          {weddingTitle}
        </span>
        <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">
          {theme.replace("_", " ")}
        </span>
      </header>

      {/* Render Enabled Sections */}
      <div className="divide-y divide-stone-800/40">
        {sections
          .filter((s) => s.enabled)
          .sort((a, b) => a.order - b.order)
          .map((sec) => (
            <section key={sec.id} className="py-12 px-6 max-w-3xl mx-auto text-center">
              {sec.type === "HERO" && (
                <div className="space-y-4 py-8">
                  {sec.config.coverImageUrl ? (
                    <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden mb-6 border border-stone-800 shadow-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sec.config.coverImageUrl as string}
                        alt="Hero Cover"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null}
                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif" style={{ color: primaryColor }}>
                    {String(sec.config.title || `${brideName} & ${groomName}`)}
                  </h1>
                  <p className="text-xl text-stone-300 font-serif italic">
                    {String(sec.config.subtitle || "We Are Getting Married!")}
                  </p>
                  {sec.config.tagline ? (
                    <p className="text-sm text-stone-400 max-w-lg mx-auto">
                      {String(sec.config.tagline)}
                    </p>
                  ) : null}

                  {primaryWeddingDate && (
                    <div className="inline-block mt-4 px-4 py-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-sm font-mono">
                      📅 {new Date(primaryWeddingDate).toLocaleDateString("en-IN", { dateStyle: "full" })}
                    </div>
                  )}
                </div>
              )}

              {sec.type === "OUR_STORY" && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold font-serif text-amber-400">
                    {String(sec.config.title || "Our Love Story")}
                  </h2>
                  <p className="text-stone-300 text-sm leading-relaxed max-w-xl mx-auto">
                    {String(sec.config.storyText || "Every love story is beautiful, but ours is our favorite.")}
                  </p>
                  {sec.config.brideBio || sec.config.groomBio ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-left">
                      {sec.config.brideBio ? (
                        <div className="p-4 rounded-xl bg-stone-900 border border-stone-800">
                          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                            {brideName}
                          </h4>
                          <p className="text-xs text-stone-300">{String(sec.config.brideBio)}</p>
                        </div>
                      ) : null}
                      {sec.config.groomBio ? (
                        <div className="p-4 rounded-xl bg-stone-900 border border-stone-800">
                          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                            {groomName}
                          </h4>
                          <p className="text-xs text-stone-300">{String(sec.config.groomBio)}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}

              {sec.type === "SCHEDULE" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold font-serif text-amber-400">
                    {String(sec.config.title || "Wedding Ceremonies")}
                  </h2>
                  {sec.config.subtitle ? (
                    <p className="text-xs text-stone-400">{String(sec.config.subtitle)}</p>
                  ) : null}

                  {events && events.length > 0 ? (
                    <div className="space-y-4 text-left">
                      {events.map((evt) => (
                        <div key={evt.id} className="p-5 rounded-2xl bg-stone-900 border border-stone-800 shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-serif font-bold text-base text-amber-300">
                              {evt.name}
                            </h3>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
                              {new Date(evt.startAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          {evt.description && (
                            <p className="text-xs text-stone-400 mb-3">{evt.description}</p>
                          )}
                          {evt.venue && (
                            <div className="text-xs text-stone-300 flex items-center gap-1.5 font-sans">
                              <span className="material-symbols-outlined text-[16px] text-amber-400">location_on</span>
                              <span>{evt.venue.name || "Venue"} {evt.venue.city ? `• ${evt.venue.city}` : ""}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 italic">No ceremonies published yet.</p>
                  )}
                </div>
              )}

              {sec.type === "VENUE" && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold font-serif text-amber-400">
                    {String(sec.config.title || "Venue & Location")}
                  </h2>
                  <p className="text-sm text-stone-300 max-w-lg mx-auto">
                    {String(sec.config.description || generalLocation || "Jaipur, Rajasthan")}
                  </p>
                </div>
              )}

              {sec.type === "DRESS_CODE" && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold font-serif text-amber-400">
                    {String(sec.config.title || "Dress Code")}
                  </h2>
                  <p className="text-sm text-stone-300 max-w-lg mx-auto">
                    {String(sec.config.description || "Traditional Ethnic / Royal Attire.")}
                  </p>
                </div>
              )}

              {sec.type === "RSVP_CTA" && (
                <div className="py-6 px-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                  <h2 className="text-xl font-bold font-serif text-amber-400">
                    {String(sec.config.title || "RSVP & Attendance")}
                  </h2>
                  <p className="text-xs text-stone-300 max-w-md mx-auto">
                    {String(sec.config.description || "Please confirm your attendance using your private invitation link.")}
                  </p>
                  <button
                    disabled
                    className="px-6 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs shadow-md cursor-not-allowed opacity-80"
                  >
                    {String(sec.config.buttonText || "RSVP Now")}
                  </button>
                </div>
              )}
            </section>
          ))}
      </div>
    </div>
  );
}
