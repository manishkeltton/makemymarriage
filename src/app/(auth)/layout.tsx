import React from "react";
import Link from "next/link";
import { Logo } from "@/components/marketing/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface flex flex-col sm:flex-row w-full text-on-surface">
      {/* Left side: Branding (Hidden on mobile) */}
      <div className="hidden sm:flex sm:w-1/2 bg-surface-container-low flex-col justify-between p-12 border-r border-surface-variant/30">
        <div>
          <Link href="/" className="flex items-center gap-space-sm group w-fit">
            <Logo className="w-8 h-auto" />
            <span className="font-headline-sm text-[20px] text-on-surface tracking-tight font-bold">MakeMyMarriage</span>
          </Link>
          <div className="mt-24">
            <h1 className="font-display-lg text-[40px] text-primary-container font-bold tracking-tight mb-4 leading-tight">
              Plan your entire wedding together, from one place.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md leading-relaxed">
              Join thousands of couples and families organizing calm, beautiful, multi-day celebrations with absolute privacy and intelligent workflows.
            </p>
          </div>
        </div>
        <div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">© {new Date().getFullYear()} MakeMyMarriage Technologies Inc.</p>
        </div>
      </div>

      {/* Right side: Auth forms */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-24 py-12 bg-surface">
        {/* Mobile Logo */}
        <div className="sm:hidden flex items-center justify-center gap-space-sm mb-12">
          <Logo className="w-8 h-auto" />
          <span className="font-headline-sm text-[20px] text-on-surface tracking-tight font-bold">MakeMyMarriage</span>
        </div>
        
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
