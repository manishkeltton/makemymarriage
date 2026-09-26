"use client";

import React from "react";
import { WEBSITE_THEMES, WebsiteTheme } from "@/modules/website/dto/wedding-site.dto";

interface ThemeSelectorProps {
  currentTheme: WebsiteTheme;
  style: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  onThemeChange: (theme: WebsiteTheme, defaultStyle: { primaryColor: string; secondaryColor: string; fontFamily: string }) => void;
  onStyleChange: (style: { primaryColor?: string; secondaryColor?: string; fontFamily?: string }) => void;
}

const THEME_PREVIEWS: Record<
  WebsiteTheme,
  { name: string; description: string; primary: string; secondary: string; font: string; bg: string }
> = {
  ROYAL_GOLD: {
    name: "Royal Gold",
    description: "Opulent regal theme with warm gold accents & crimson heritage tones.",
    primary: "#D4AF37",
    secondary: "#8B0000",
    font: "Playfair Display",
    bg: "bg-amber-950/20 border-amber-500/30",
  },
  BLUSH_ROMANCE: {
    name: "Blush Romance",
    description: "Soft romantic blush pink & champagne gold floral aesthetic.",
    primary: "#E89CAE",
    secondary: "#F5ECE0",
    font: "Cormorant Garamond",
    bg: "bg-rose-950/20 border-rose-400/30",
  },
  MODERN_MINIMAL: {
    name: "Modern Minimal",
    description: "Clean contemporary monochromatic layout with crisp typography.",
    primary: "#111827",
    secondary: "#F3F4F6",
    font: "Inter",
    bg: "bg-zinc-900/30 border-zinc-700/40",
  },
  ELEGANT_TRADITIONAL: {
    name: "Elegant Traditional",
    description: "Classic rich maroon & gold traditional Indian wedding palette.",
    primary: "#800020",
    secondary: "#D4AF37",
    font: "Playfair Display",
    bg: "bg-red-950/20 border-red-800/30",
  },
  FLORAL_PASTEL: {
    name: "Floral Pastel",
    description: "Soft romantic pastel blooms with rose & sage botanical feel.",
    primary: "#E89CAE",
    secondary: "#6B8E23",
    font: "Cormorant Garamond",
    bg: "bg-rose-950/20 border-rose-400/30",
  },
  MIDNIGHT_ROMANCE: {
    name: "Midnight Romance",
    description: "Elegant deep velvet night palette with silver-starlight highlights.",
    primary: "#1A1A2E",
    secondary: "#E0E1DD",
    font: "Cinzel",
    bg: "bg-slate-950/40 border-slate-700/40",
  },
  VINTAGE_SEPIA: {
    name: "Vintage Sepia",
    description: "Timeless classic sepia warm tone with nostalgic serif elegance.",
    primary: "#704214",
    secondary: "#F5ECE0",
    font: "Playfair Display",
    bg: "bg-amber-900/15 border-amber-800/30",
  },
  MINIMAL_ELEGANCE: {
    name: "Minimal Elegance",
    description: "Refined architectural minimalism with subtle luxury highlights.",
    primary: "#111827",
    secondary: "#E5E7EB",
    font: "Plus Jakarta Sans",
    bg: "bg-stone-900/30 border-stone-700/40",
  },
};

const FONT_OPTIONS = [
  "Playfair Display",
  "Cormorant Garamond",
  "Cinzel",
  "Inter",
  "Plus Jakarta Sans",
];

export function ThemeSelector({
  currentTheme,
  style,
  onThemeChange,
  onStyleChange,
}: ThemeSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-on-surface font-serif mb-1">
          Select Wedding Website Theme
        </h3>
        <p className="text-xs text-on-surface-variant">
          Choose a theme preset to automatically configure typography, color palettes, and hero styling.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {WEBSITE_THEMES.map((themeKey) => {
          const info = THEME_PREVIEWS[themeKey];
          const isSelected = currentTheme === themeKey;
          return (
            <div
              key={themeKey}
              onClick={() =>
                onThemeChange(themeKey, {
                  primaryColor: info.primary,
                  secondaryColor: info.secondary,
                  fontFamily: info.font,
                })
              }
              className={`cursor-pointer rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
                info.bg
              } ${
                isSelected
                  ? "ring-2 ring-primary border-primary shadow-lg scale-[1.02]"
                  : "hover:border-outline/50 hover:bg-surface-container-high/40 opacity-85 hover:opacity-100"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-serif font-bold text-sm text-on-surface">
                    {info.name}
                  </span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold">
                      <span className="material-symbols-outlined text-[12px]">check</span> Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">
                  {info.description}
                </p>
              </div>

              <div className="pt-3 border-t border-outline/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                    style={{ backgroundColor: info.primary }}
                    title={`Primary: ${info.primary}`}
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                    style={{ backgroundColor: info.secondary }}
                    title={`Secondary: ${info.secondary}`}
                  />
                </div>
                <span className="font-mono text-[11px] text-on-surface-variant/80">
                  {info.font}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Style Customization */}
      <div className="bg-surface-container-low rounded-2xl p-5 border border-outline/20 space-y-4 mt-6">
        <h4 className="text-sm font-bold text-on-surface font-serif flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">palette</span>
          Custom Styling & Controls
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Primary Accent Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={style.primaryColor || "#D4AF37"}
                onChange={(e) => onStyleChange({ primaryColor: e.target.value })}
                className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border border-outline/30 p-0.5"
              />
              <input
                type="text"
                value={style.primaryColor || "#D4AF37"}
                onChange={(e) => onStyleChange({ primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-surface-container border border-outline/30 rounded-xl text-on-surface font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Secondary Accent Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={style.secondaryColor || "#8B0000"}
                onChange={(e) => onStyleChange({ secondaryColor: e.target.value })}
                className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border border-outline/30 p-0.5"
              />
              <input
                type="text"
                value={style.secondaryColor || "#8B0000"}
                onChange={(e) => onStyleChange({ secondaryColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-surface-container border border-outline/30 rounded-xl text-on-surface font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Font Family
            </label>
            <select
              value={style.fontFamily || "Playfair Display"}
              onChange={(e) => onStyleChange({ fontFamily: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-surface-container border border-outline/30 rounded-xl text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
