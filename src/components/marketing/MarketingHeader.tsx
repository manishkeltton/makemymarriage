"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/marketing/Logo";

export interface MarketingHeaderUser {
  id?: string;
  name: string;
  email: string;
}

export interface MarketingHeaderProps {
  initialUser?: MarketingHeaderUser | null;
}

export function MarketingHeader({ initialUser }: MarketingHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<MarketingHeaderUser | null>(initialUser || null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync session state on mount or client hydration if needed
  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const res = await fetch("/api/v1/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data && isMounted) {
            setUser(data.data);
          }
        } else if (res.status === 401 && isMounted) {
          setUser(null);
        }
      } catch {
        // Fall back to initialUser
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close user profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "U";

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 max-w-7xl mx-auto px-gutter flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-space-sm group">
          <Logo className="w-7 h-auto" />
          <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">
            MakeMyMarriage
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-gutter">
          <Link
            href="#product"
            className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Product
          </Link>
          <Link
            href="#features"
            className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#pricing"
            className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Pricing
          </Link>
        </nav>

        {/* Dynamic Right Header Section */}
        <div className="flex items-center gap-space-md">
          {user ? (
            /* Logged-In User Header View */
            <div className="flex items-center gap-space-sm">
              <Link
                href="/workspace"
                className="hidden sm:inline-flex items-center gap-1.5 bg-primary-container hover:bg-[#5D1F2C] text-on-primary px-space-lg py-space-sm rounded-lg font-headline-sm text-headline-sm transition-all shadow-sm active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                <span>Go to Workspace</span>
              </Link>

              {/* User Avatar & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-9 h-9 rounded-full bg-primary-container text-on-primary font-bold text-sm flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-primary-container/20 shadow-xs"
                  aria-label="User profile menu"
                >
                  {userInitial}
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-surface-container-high/40">
                      <p className="font-headline-sm text-xs font-semibold text-on-surface truncate">
                        {user.name}
                      </p>
                      <p className="font-body-sm text-[11px] text-on-surface-variant truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/workspace"
                        onClick={() => setIsDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 hover:bg-surface-container-low text-xs font-medium text-on-surface flex items-center gap-2.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-primary-container">
                          space_dashboard
                        </span>
                        <span>Go to Workspace</span>
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-surface-container-low text-xs font-medium text-error flex items-center gap-2.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-error">
                          logout
                        </span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Logged-Out Guest Header View */
            <div className="flex items-center gap-space-md">
              <Link
                href="/login"
                className="font-headline-sm text-headline-sm text-on-surface-variant hover:text-on-surface px-space-sm py-space-xs transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="hidden sm:inline-flex bg-primary-container hover:bg-[#5D1F2C] text-on-primary px-space-lg py-space-sm rounded-lg font-headline-sm text-headline-sm transition-colors shadow-sm"
              >
                Start Planning Free
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-[24px]">
              {isMobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-surface-container-high/40 bg-surface px-gutter py-space-md space-y-space-md shadow-lg animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-space-sm">
            <Link
              href="#product"
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface py-1"
            >
              Product
            </Link>
            <Link
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface py-1"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface py-1"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface py-1"
            >
              Pricing
            </Link>
          </nav>
          {user ? (
            <div className="pt-space-sm border-t border-surface-container-high/40 flex flex-col gap-space-sm">
              <div className="flex items-center gap-space-sm px-1 py-1">
                <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary font-bold text-sm flex items-center justify-center shrink-0">
                  {userInitial}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline-sm text-xs text-on-surface font-semibold truncate">
                    {user.name}
                  </span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant truncate">
                    {user.email}
                  </span>
                </div>
              </div>
              <Link
                href="/workspace"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center bg-primary-container hover:bg-[#5D1F2C] text-on-primary py-space-sm rounded-lg font-headline-sm text-headline-sm transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                <span>Go to Workspace</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-center border border-outline-variant/60 text-error py-space-sm rounded-lg font-headline-sm text-headline-sm transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-space-sm border-t border-surface-container-high/40 flex flex-col gap-space-sm">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center border border-outline-variant/60 text-on-surface py-space-sm rounded-lg font-headline-sm text-headline-sm"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center bg-primary-container hover:bg-[#5D1F2C] text-on-primary py-space-sm rounded-lg font-headline-sm text-headline-sm"
              >
                Start Planning Free
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
