"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/marketing/Logo";
import { WeddingSwitcher } from "./wedding-switcher";

export interface WorkspaceSidebarProps {
  weddingId?: string;
  user?: {
    name: string;
    email: string;
  };
  role?: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function WorkspaceSidebar({
  weddingId,
  user,
  role = "Admin",
  isOpenMobile = false,
  onCloseMobile,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  const navPrefix = weddingId ? `/workspace/${weddingId}` : "/workspace";

  const planningNav = [
    { name: "Dashboard", href: navPrefix, icon: "space_dashboard", exact: true },
    { name: "Events", href: `${navPrefix}/events`, icon: "calendar_month", comingSoon: false },
    { name: "Tasks", href: `${navPrefix}/tasks`, icon: "check_circle", comingSoon: false },
    { name: "Guests", href: `${navPrefix}/guests`, icon: "group", comingSoon: false },
    { name: "Vendors", href: `${navPrefix}/vendors`, icon: "storefront", comingSoon: false },
    { name: "Expenses", href: `${navPrefix}/expenses`, icon: "payments", comingSoon: false },
    { name: "Documents", href: `${navPrefix}/documents`, icon: "description", comingSoon: false },
  ];

  const guestExperienceNav = [
    { name: "Wedding Website", href: `${navPrefix}/website`, icon: "language", comingSoon: false },
    { name: "Gallery", href: `${navPrefix}/gallery`, icon: "photo_library", comingSoon: true },
    { name: "Guestbook", href: `${navPrefix}/guestbook`, icon: "edit_note", comingSoon: true },
    { name: "Emergency", href: `${navPrefix}/emergency`, icon: "emergency", comingSoon: true },
  ];

  const governanceNav = [
    { name: "Team", href: `${navPrefix}/team`, icon: "shield_person", comingSoon: false },
    { name: "Settings", href: `${navPrefix}/settings`, icon: "tune", exact: false },
  ];

  const checkActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-surface-container-lowest text-on-surface">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div className="h-16 px-space-md flex items-center justify-between gap-space-sm border-b border-surface-container-high/40">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="h-8 w-8 text-primary-container" />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">
                MakeMyMarriage
              </span>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* Wedding Switcher Container */}
        <div className="px-space-md py-space-xs border-b border-surface-container-high/40">
          <WeddingSwitcher />
        </div>

        {/* Navigation Sections Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-space-sm py-space-xs space-y-space-md">
          {/* Section 1: Planning */}
          <nav className="space-y-0.5">
            <div className="px-space-sm pb-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Planning
              </span>
            </div>
            {planningNav.map((item) => {
              const isActive = checkActive(item);
              return (
                <Link
                  key={item.name}
                  href={item.comingSoon ? "#" : item.href}
                  onClick={(e) => {
                    if (item.comingSoon) {
                      e.preventDefault();
                      alert(`${item.name} module is coming soon!`);
                    }
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`flex items-center justify-between px-space-sm py-1.5 rounded-lg transition-colors text-xs font-medium ${
                    isActive
                      ? "bg-surface-container-low text-primary-container font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  {item.comingSoon && (
                    <span className="font-label-sm text-[9px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="h-px bg-surface-container-high/60 mx-space-sm" />

          {/* Section 2: Guest Experience */}
          <nav className="space-y-0.5">
            <div className="px-space-sm pb-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Guest Experience
              </span>
            </div>
            {guestExperienceNav.map((item) => {
              const isActive = checkActive(item);
              return (
                <Link
                  key={item.name}
                  href={item.comingSoon ? "#" : item.href}
                  onClick={(e) => {
                    if (item.comingSoon) {
                      e.preventDefault();
                      alert(`${item.name} module is coming soon!`);
                    }
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`flex items-center justify-between px-space-sm py-1.5 rounded-lg transition-colors text-xs font-medium ${
                    isActive
                      ? "bg-surface-container-low text-primary-container font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  {item.comingSoon && (
                    <span className="font-label-sm text-[9px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="h-px bg-surface-container-high/60 mx-space-sm" />

          {/* Section 3: Governance */}
          <nav className="space-y-0.5">
            <div className="px-space-sm pb-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Governance
              </span>
            </div>
            {governanceNav.map((item) => {
              const isActive = checkActive(item);
              return (
                <Link
                  key={item.name}
                  href={item.comingSoon ? "#" : item.href}
                  onClick={(e) => {
                    if (item.comingSoon) {
                      e.preventDefault();
                      alert(`${item.name} module is coming soon!`);
                    }
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`flex items-center justify-between px-space-sm py-1.5 rounded-lg transition-colors text-xs font-medium ${
                    isActive
                      ? "bg-surface-container-low text-primary-container font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  {item.comingSoon && (
                    <span className="font-label-sm text-[9px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Area */}
      <div className="p-space-sm space-y-space-xs border-t border-surface-container-high/60">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            alert("Need help? Contact support at support@makemymarriage.com");
          }}
          className="flex items-center gap-space-sm px-space-sm py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface font-body-sm text-xs transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">help_outline</span>
          <span>Help &amp; Support</span>
        </a>

        {/* Signed-in User Pill */}
        <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs shrink-0 uppercase">
              {user?.name?.[0] || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-xs text-on-surface font-semibold truncate">
                {user?.name || "User Account"}
              </span>
              <span className="font-label-sm text-[11px] text-on-surface-variant capitalize truncate">
                {role}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign Out"
            className="p-1 rounded text-on-surface-variant hover:text-primary-container hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 z-40 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-surface-container-high/60">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
