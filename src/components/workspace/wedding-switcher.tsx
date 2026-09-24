"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWedding } from "./wedding-context";

export function WeddingSwitcher() {
  const { weddings, activeWedding, switchWedding } = useWedding();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!activeWedding) {
    return (
      <Link
        href="/workspace/new"
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-container text-on-primary font-headline-sm text-body-sm font-semibold transition-colors shadow-xs"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        <span>Create Wedding</span>
      </Link>
    );
  }

  const activeDateFormatted = activeWedding.primaryWeddingDate
    ? new Date(activeWedding.primaryWeddingDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex flex-col min-w-0 pr-2">
          <span className="font-headline-sm text-body-sm text-on-surface truncate font-semibold">
            {activeWedding.title}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
            {activeDateFormatted ? `${activeDateFormatted} • ` : ""}
            <span className="capitalize">{activeWedding.role}</span>
          </span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0">
          unfold_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[260px] rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3.5 pt-2 pb-1.5 flex items-center justify-between">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Your Weddings
            </span>
            <span className="font-label-sm text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
              {weddings.length} Active
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto px-1.5 space-y-1">
            {weddings.map((w) => {
              const isSelected = w.id === activeWedding.id;
              const dateStr = w.primaryWeddingDate
                ? new Date(w.primaryWeddingDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              const initials = w.title
                .split("&")
                .map((part) => part.trim()[0])
                .filter(Boolean)
                .join("")
                .slice(0, 2)
                .toUpperCase() || "WM";

              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    switchWedding(w.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-all ${
                    isSelected
                      ? "bg-surface-container-low text-on-surface"
                      : "hover:bg-surface-container-low/60 text-on-surface"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                        isSelected
                          ? "bg-primary-container text-on-primary"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold truncate">{w.title}</span>
                        <span
                          className={`font-label-sm text-[9px] px-1.5 py-0.2 rounded-full font-semibold capitalize ${
                            w.role === "ADMIN"
                              ? "bg-primary-container text-on-primary"
                              : "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {w.role.toLowerCase()}
                        </span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant truncate">
                        {dateStr}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-primary-container text-[18px] shrink-0">
                      check_circle
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-surface-container-high/60 mt-1.5 pt-1.5 px-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push("/workspace/new");
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-primary-container hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Create another wedding</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
