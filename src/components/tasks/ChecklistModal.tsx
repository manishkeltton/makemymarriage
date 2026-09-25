"use client";

import React, { useState } from "react";
import { TaskDTO } from "@/modules/tasks/dto/task.dto";

interface ChecklistModalProps {
  weddingId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (generatedTasks: TaskDTO[]) => void;
}

const CATEGORIES = [
  { id: "Venue", label: "Venue & Location", icon: "location_on", count: 4 },
  { id: "Catering", label: "Catering & Menu", icon: "restaurant", count: 4 },
  { id: "Photography", label: "Photography & Video", icon: "photo_camera", count: 4 },
  { id: "Decoration", label: "Decoration & Themes", icon: "palette", count: 3 },
  { id: "Ceremony & Puja", label: "Ceremony & Puja Samagri", icon: "auto_awesome", count: 5 },
  { id: "Invitations", label: "Invitations & RSVPs", icon: "mail", count: 4 },
  { id: "Clothing", label: "Outfits & Fitting", icon: "checkroom", count: 4 },
];

export function ChecklistModal({ weddingId, isOpen, onClose, onSuccess }: ChecklistModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    CATEGORIES.map((c) => c.id)
  );
  const [duplicateHandling, setDuplicateHandling] = useState<
    "SKIP_EXISTING" | "REPLACE_EXISTING" | "ALLOW_DUPLICATES"
  >("SKIP_EXISTING");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const selectAll = () => setSelectedCategories(CATEGORIES.map((c) => c.id));
  const deselectAll = () => setSelectedCategories([]);

  const totalSelectedTasks = CATEGORIES.filter((c) => selectedCategories.includes(c.id)).reduce(
    (acc, curr) => acc + curr.count,
    0
  );

  const handleGenerate = async () => {
    if (selectedCategories.length === 0) {
      setError("Please select at least one category.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/checklist/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: selectedCategories,
          duplicateHandling,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to generate checklist.");
        setLoading(false);
        return;
      }

      onSuccess(data.data || []);
      onClose();
    } catch (err: unknown) {
      console.error("Error generating checklist:", err);
      setError("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-surface-container-high space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-surface-container-high/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">bolt</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                Generate Hindu Wedding Checklist
              </h2>
              <p className="font-body-md text-xs text-on-surface-variant">
                Predefined ceremonial task templates for Indian weddings (No AI required)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-error">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Categories Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-on-surface uppercase tracking-wider">
              Select Categories ({selectedCategories.length}/{CATEGORIES.length})
            </span>
            <div className="flex items-center gap-2 text-primary-container font-medium">
              <button onClick={selectAll} type="button" className="hover:underline cursor-pointer">
                Select All
              </button>
              <span>•</span>
              <button onClick={deselectAll} type="button" className="hover:underline cursor-pointer">
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <div
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-primary-fixed/20 border-primary-container text-on-surface"
                      : "bg-surface-container-low/40 border-surface-container-high text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        isSelected ? "text-primary-container" : "text-on-surface-variant"
                      }`}
                    >
                      {cat.icon}
                    </span>
                    <span className="font-semibold text-xs truncate">{cat.label}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-[11px] font-bold">
                    {cat.count} tasks
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Duplicate Strategy Option */}
        <div className="space-y-2 pt-1 border-t border-surface-container-high/60">
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider">
            Duplicate Handling Strategy
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDuplicateHandling("SKIP_EXISTING")}
              className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                duplicateHandling === "SKIP_EXISTING"
                  ? "bg-primary-container text-on-primary border-primary-container font-semibold shadow-xs"
                  : "bg-surface-container-low border-surface-container-high text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              Skip Existing
            </button>
            <button
              type="button"
              onClick={() => setDuplicateHandling("REPLACE_EXISTING")}
              className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                duplicateHandling === "REPLACE_EXISTING"
                  ? "bg-primary-container text-on-primary border-primary-container font-semibold shadow-xs"
                  : "bg-surface-container-low border-surface-container-high text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              Replace Existing
            </button>
            <button
              type="button"
              onClick={() => setDuplicateHandling("ALLOW_DUPLICATES")}
              className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                duplicateHandling === "ALLOW_DUPLICATES"
                  ? "bg-primary-container text-on-primary border-primary-container font-semibold shadow-xs"
                  : "bg-surface-container-low border-surface-container-high text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              Allow Duplicates
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-container-high/60 text-xs">
          <span className="text-on-surface-variant font-medium">
            Generating <strong>{totalSelectedTasks}</strong> suggested tasks
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-surface-container-high text-on-surface font-semibold hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || selectedCategories.length === 0}
              className="px-5 py-2.5 rounded-lg bg-tertiary hover:bg-[#3D1800] text-on-tertiary font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-on-tertiary/30 border-t-on-tertiary rounded-full animate-spin" />
              )}
              <span>Generate Tasks</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
