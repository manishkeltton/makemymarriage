"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationCenter } from "./NotificationCenter";
import { useWedding } from "./wedding-context";

export interface WorkspaceHeaderProps {
  user?: {
    name: string;
    email: string;
  };
  onOpenMobileSidebar?: () => void;
}

export function WorkspaceHeader({ user, onOpenMobileSidebar }: WorkspaceHeaderProps) {
  const router = useRouter();
  const { activeWedding } = useWedding();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface/90 backdrop-blur-md z-30 border-b border-surface-container-high/60 px-4 sm:px-6 flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Left: Mobile Drawer Button & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
          aria-label="Open navigation menu"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-on-surface-variant text-xs sm:text-sm font-medium">
          <Link href="/workspace" className="text-on-surface hover:text-primary-container transition-colors">
            Workspace
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface-variant truncate font-semibold">
            {activeWedding?.title || "Overview"}
          </span>
        </nav>
      </div>

      {/* Right: Search, Notifications, + Add Menu, User Avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Command Input */}
        <div className="relative hidden md:flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search workspace..."
            onClick={() => alert("Search shortcut (⌘K) coming soon!")}
            className="h-[38px] w-48 sm:w-60 pl-9 pr-12 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-xs shadow-xs border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary-container"
          />
          <span className="absolute right-2.5 px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-[10px] text-on-surface-variant font-semibold">
            ⌘K
          </span>
        </div>

        <NotificationCenter weddingId={activeWedding?.id} />

        {/* Add Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="h-[38px] px-3.5 sm:px-4 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="hidden sm:inline">Add</span>
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>

          {isAddMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                type="button"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  alert("Events module coming next!");
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-surface-container-low text-xs font-medium text-on-surface flex items-center gap-2.5"
              >
                <span className="material-symbols-outlined text-[18px] text-primary-container">
                  event
                </span>
                <span>Add Ceremony</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  if (activeWedding) router.push(`/workspace/${activeWedding.id}/tasks`);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-surface-container-low text-xs font-medium text-on-surface flex items-center gap-2.5"
              >
                <span className="material-symbols-outlined text-[18px] text-primary-container">
                  check_circle
                </span>
                <span>Create Task</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  alert("Guests module coming next!");
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-surface-container-low text-xs font-medium text-on-surface flex items-center gap-2.5"
              >
                <span className="material-symbols-outlined text-[18px] text-primary-container">
                  person_add
                </span>
                <span>Add Guest Family</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  alert("Team governance module coming next!");
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-surface-container-low text-xs font-medium text-on-surface flex items-center gap-2.5"
              >
                <span className="material-symbols-outlined text-[18px] text-primary-container">
                  group_add
                </span>
                <span>Invite Organiser</span>
              </button>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs uppercase shadow-xs">
          {user?.name?.[0] || "U"}
        </div>
      </div>
    </header>
  );
}
