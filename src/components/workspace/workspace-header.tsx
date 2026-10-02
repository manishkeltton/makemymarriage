"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { NotificationCenter } from "./NotificationCenter";
import { useWedding } from "./wedding-context";
import { useQuickActions } from "./quick-actions-context";
import { WorkspaceSearchModal } from "./workspace-search-modal";

export interface WorkspaceHeaderProps {
  user?: {
    name: string;
    email: string;
  };
  onOpenMobileSidebar?: () => void;
}

export function WorkspaceHeader({ user, onOpenMobileSidebar }: WorkspaceHeaderProps) {
  const { activeWedding } = useWedding();
  const { openQuickAction } = useQuickActions();

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isAddMenuOpen) {
        setIsAddMenuOpen(false);
        addButtonRef.current?.focus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAddMenuOpen]);

  const handleSelectAction = (
    action: "ADD_CEREMONY" | "CREATE_TASK" | "ADD_GUEST" | "INVITE_ORGANISER"
  ) => {
    setIsAddMenuOpen(false);
    openQuickAction(action, undefined, addButtonRef.current);
  };

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
        {/* Search Command Input Button */}
        <button
          ref={searchButtonRef}
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="relative hidden md:flex items-center h-[38px] w-48 sm:w-60 px-3 rounded-lg bg-surface-container-lowest text-on-surface-variant font-body-sm text-xs shadow-xs border border-surface-container-high/40 hover:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container transition-all cursor-pointer text-left"
          aria-label="Search workspace"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-[18px] mr-2">
            search
          </span>
          <span className="flex-1 truncate text-on-surface-variant/70 font-medium">
            Search workspace...
          </span>
          <span className="ml-2 px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-[10px] text-on-surface-variant font-semibold shrink-0">
            ⌘K
          </span>
        </button>

        <NotificationCenter weddingId={activeWedding?.id} />

        {/* Add Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            ref={addButtonRef}
            type="button"
            disabled={!activeWedding}
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            aria-expanded={isAddMenuOpen}
            aria-haspopup="menu"
            aria-controls="workspace-add-menu"
            aria-label="Add new workspace item"
            className="h-[38px] px-3.5 sm:px-4 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="hidden sm:inline">Add</span>
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>

          {isAddMenuOpen && (
            <div
              id="workspace-add-menu"
              role="menu"
              aria-orientation="vertical"
              className="absolute right-0 mt-1.5 w-48 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => handleSelectAction("ADD_CEREMONY")}
                className="w-full text-left px-3.5 py-2 hover:bg-surface-container-low focus:bg-surface-container-low text-xs font-medium text-on-surface flex items-center gap-2.5 focus:outline-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-primary-container">
                  event
                </span>
                <span>Add Ceremony</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleSelectAction("CREATE_TASK")}
                className="w-full text-left px-3.5 py-2 hover:bg-surface-container-low focus:bg-surface-container-low text-xs font-medium text-on-surface flex items-center gap-2.5 focus:outline-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-primary-container">
                  check_circle
                </span>
                <span>Create Task</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleSelectAction("ADD_GUEST")}
                className="w-full text-left px-3.5 py-2 hover:bg-surface-container-low focus:bg-surface-container-low text-xs font-medium text-on-surface flex items-center gap-2.5 focus:outline-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-primary-container">
                  person_add
                </span>
                <span>Add Guest Family</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleSelectAction("INVITE_ORGANISER")}
                className="w-full text-left px-3.5 py-2 hover:bg-surface-container-low focus:bg-surface-container-low text-xs font-medium text-on-surface flex items-center gap-2.5 focus:outline-none cursor-pointer"
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

      <WorkspaceSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        weddingId={activeWedding?.id}
        triggerRef={searchButtonRef}
      />
    </header>
  );
}
