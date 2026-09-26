"use client";

import React, { useState, useEffect } from "react";
import { WebsiteSectionDTO } from "@/modules/website/dto/wedding-site.dto";

interface SectionEditorModalProps {
  isOpen: boolean;
  section: WebsiteSectionDTO | null;
  onClose: () => void;
  onSave: (updatedSection: WebsiteSectionDTO) => void;
}

const SAMPLE_WEDDING_IMAGES = [
  { label: "Royal Palace", url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80" },
  { label: "Traditional Ceremony", url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80" },
  { label: "Floral Mandap", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80" },
  { label: "Romantic Couple", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80" },
];

export function SectionEditorModal({
  isOpen,
  section,
  onClose,
  onSave,
}: SectionEditorModalProps) {
  const [enabled, setEnabled] = useState(true);
  const [config, setConfig] = useState<Record<string, unknown>>({});

  useEffect(() => {
    let isMounted = true;
    if (section) {
      void Promise.resolve().then(() => {
        if (isMounted) {
          setEnabled(section.enabled);
          setConfig({ ...section.config });
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [section, isOpen]);

  if (!isOpen || !section) return null;

  const updateConfigKey = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...section,
      enabled,
      config,
    });
    onClose();
  };

  const renderSectionSpecificFields = () => {
    switch (section.type) {
      case "HERO":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Main Headline / Couple Title
              </label>
              <input
                type="text"
                value={(config.title as string) || ""}
                onChange={(e) => updateConfigKey("title", e.target.value)}
                placeholder="e.g. Rahul & Neha"
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={(config.subtitle as string) || ""}
                onChange={(e) => updateConfigKey("subtitle", e.target.value)}
                placeholder="e.g. We Are Getting Married!"
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Tagline / Welcome Note
              </label>
              <textarea
                rows={2}
                value={(config.tagline as string) || ""}
                onChange={(e) => updateConfigKey("tagline", e.target.value)}
                placeholder="e.g. Join us in celebrating our wedding ceremony in Jaipur."
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Hero Background Image URL
              </label>
              <input
                type="text"
                value={(config.coverImageUrl as string) || ""}
                onChange={(e) => updateConfigKey("coverImageUrl", e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm font-mono focus:ring-2 focus:ring-primary"
              />

              {/* Sample Selection */}
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-[11px] text-on-surface-variant self-center font-medium">Quick Select Image:</span>
                {SAMPLE_WEDDING_IMAGES.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => updateConfigKey("coverImageUrl", img.url)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-container border border-outline/20 hover:bg-surface-container-high text-on-surface"
                  >
                    {img.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline/20">
              <input
                type="checkbox"
                id="showCountdown"
                checked={config.showCountdown !== false}
                onChange={(e) => updateConfigKey("showCountdown", e.target.checked)}
                className="w-4 h-4 rounded text-primary border-outline/30 focus:ring-primary"
              />
              <label htmlFor="showCountdown" className="text-xs font-bold text-on-surface cursor-pointer">
                Show Live Wedding Countdown Timer
              </label>
            </div>
          </div>
        );

      case "OUR_STORY":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Section Title
              </label>
              <input
                type="text"
                value={(config.title as string) || "Our Love Story"}
                onChange={(e) => updateConfigKey("title", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Story Text / Narrative
              </label>
              <textarea
                rows={4}
                value={(config.storyText as string) || ""}
                onChange={(e) => updateConfigKey("storyText", e.target.value)}
                placeholder="Share how you first met, your first date, or proposal..."
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Bride Bio / Quote
                </label>
                <textarea
                  rows={2}
                  value={(config.brideBio as string) || ""}
                  onChange={(e) => updateConfigKey("brideBio", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Groom Bio / Quote
                </label>
                <textarea
                  rows={2}
                  value={(config.groomBio as string) || ""}
                  onChange={(e) => updateConfigKey("groomBio", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
                />
              </div>
            </div>
          </div>
        );

      case "SCHEDULE":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Schedule Section Title
              </label>
              <input
                type="text"
                value={(config.title as string) || "Wedding Ceremonies & Events"}
                onChange={(e) => updateConfigKey("title", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Schedule Subtitle / Description
              </label>
              <input
                type="text"
                value={(config.subtitle as string) || ""}
                onChange={(e) => updateConfigKey("subtitle", e.target.value)}
                placeholder="Key ceremonies and timing details for our guests"
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
              />
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl border border-outline/20 text-xs text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              <span>
                This section automatically embeds and displays your active wedding ceremonies and venues configured under the Events module.
              </span>
            </div>
          </div>
        );

      case "VENUE":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Venue Section Title
              </label>
              <input
                type="text"
                value={(config.title as string) || "Venue & Location"}
                onChange={(e) => updateConfigKey("title", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Location Overview / Travel Directions
              </label>
              <textarea
                rows={3}
                value={(config.description as string) || ""}
                onChange={(e) => updateConfigKey("description", e.target.value)}
                placeholder="Details on flight connections, recommended hotels, or shuttle services..."
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
              />
            </div>
          </div>
        );

      case "COUPLE":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Bride Name
                </label>
                <input
                  type="text"
                  value={(config.brideName as string) || ""}
                  onChange={(e) => updateConfigKey("brideName", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Groom Name
                </label>
                <input
                  type="text"
                  value={(config.groomName as string) || ""}
                  onChange={(e) => updateConfigKey("groomName", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Bride Tagline / Title
                </label>
                <input
                  type="text"
                  value={(config.brideTitle as string) || "The Bride"}
                  onChange={(e) => updateConfigKey("brideTitle", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Groom Tagline / Title
                </label>
                <input
                  type="text"
                  value={(config.groomTitle as string) || "The Groom"}
                  onChange={(e) => updateConfigKey("groomTitle", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
                />
              </div>
            </div>
          </div>
        );

      case "DRESS_CODE":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Section Title
              </label>
              <input
                type="text"
                value={(config.title as string) || "Dress Code & Attire"}
                onChange={(e) => updateConfigKey("title", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Attire Guidance &amp; Palette Suggestions
              </label>
              <textarea
                rows={3}
                value={(config.description as string) || ""}
                onChange={(e) => updateConfigKey("description", e.target.value)}
                placeholder="e.g. Sangeet: Indo-Western / Pastel Ethnic. Wedding: Traditional Royal Ethnic."
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
              />
            </div>
          </div>
        );

      case "RSVP_CTA":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                CTA Title
              </label>
              <input
                type="text"
                value={(config.title as string) || "RSVP & Attendance"}
                onChange={(e) => updateConfigKey("title", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Instructions / Description
              </label>
              <textarea
                rows={3}
                value={(config.description as string) || ""}
                onChange={(e) => updateConfigKey("description", e.target.value)}
                placeholder="Please use your personal digital invitation link sent via email to confirm attendance for your household."
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Button Text
              </label>
              <input
                type="text"
                value={(config.buttonText as string) || "RSVP Now"}
                onChange={(e) => updateConfigKey("buttonText", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Section Title
              </label>
              <input
                type="text"
                value={(config.title as string) || ""}
                onChange={(e) => updateConfigKey("title", e.target.value)}
                placeholder="Custom Section Title"
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Body Content
              </label>
              <textarea
                rows={4}
                value={(config.description as string) || (config.content as string) || ""}
                onChange={(e) => updateConfigKey("description", e.target.value)}
                placeholder="Add custom text or section details..."
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-on-surface text-sm"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-container-high my-8 flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">edit_note</span>
            <h2 className="text-xl font-bold font-serif text-on-surface">
              Configure {section.type.replace("_", " ")} Section
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 overflow-y-auto pr-1">
          {/* Section Visibility */}
          <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-outline/20">
            <div>
              <span className="block text-xs font-bold text-on-surface">
                Section Visibility
              </span>
              <span className="text-[11px] text-on-surface-variant">
                Toggle whether this section appears on your published website.
              </span>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 rounded text-primary border-outline/30 focus:ring-primary cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-surface-container-high/60" />

          {renderSectionSpecificFields()}

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
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-md"
            >
              Apply Section Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
