import React from "react";
import { Hero } from "@/components/marketing/Hero";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { EventFeatures } from "@/components/marketing/EventFeatures";
import { TaskFeatures } from "@/components/marketing/TaskFeatures";
import { CollaborationFeatures } from "@/components/marketing/CollaborationFeatures";
import { GuestFeatures } from "@/components/marketing/GuestFeatures";
import { VendorFeatures } from "@/components/marketing/VendorFeatures";
import { WebsiteFeatures } from "@/components/marketing/WebsiteFeatures";
import { GalleryFeatures } from "@/components/marketing/GalleryFeatures";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { IndianWeddings } from "@/components/marketing/IndianWeddings";
import { TrustPrivacy } from "@/components/marketing/TrustPrivacy";
import { SocialProof } from "@/components/marketing/SocialProof";
import Link from "next/link";
import { Logo } from "@/components/marketing/Logo";

export default function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface w-full text-on-surface">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 max-w-7xl mx-auto px-gutter flex items-center justify-between">
          <Link href="/" className="flex items-center gap-space-sm group">
            <Logo className="w-7 h-auto" />
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">MakeMyMarriage</span>
          </Link>
          <nav className="hidden md:flex items-center gap-gutter">
            <Link href="#product" className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors">Product</Link>
            <Link href="#features" className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors">Features</Link>
            <Link href="#how-it-works" className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors">How It Works</Link>
            <Link href="#pricing" className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-space-md">
            <Link href="/login" className="font-headline-sm text-headline-sm text-on-surface-variant hover:text-on-surface px-space-sm py-space-xs transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hidden sm:inline-flex bg-primary-container hover:bg-[#5D1F2C] text-on-primary px-space-lg py-space-sm rounded-lg font-headline-sm text-headline-sm transition-colors shadow-sm">
              Start Planning Free
            </Link>
            <div className="hidden sm:flex w-8 h-8 rounded-full bg-primary items-center justify-center">
              <span aria-hidden="true" className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-20">
        <Hero />
        <ProblemSection />
        <EventFeatures />
        <TaskFeatures />
        <CollaborationFeatures />
        <GuestFeatures />
        <VendorFeatures />
        <WebsiteFeatures />
        <GalleryFeatures />
        <HowItWorks />
        <IndianWeddings />
        <TrustPrivacy />
        <SocialProof />
      </main>
      
      {/* Footer */}
      <footer className="w-full bg-surface-container-low mt-space-xl">
        <div className="max-w-7xl mx-auto px-gutter py-space-xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-space-xl">
            <div className="md:col-span-2 flex flex-col gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <Logo className="w-7 h-auto" />
                <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">MakeMyMarriage</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">Plan your wedding. Together.</p>
            </div>
            <div className="flex flex-col gap-space-sm">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface">Product</span>
              <Link href="#features" className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors">Features</Link>
              <Link href="#how-it-works" className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors">How It Works</Link>
              <Link href="#pricing" className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors">Pricing</Link>
            </div>
            <div className="flex flex-col gap-space-sm">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface">Company</span>
              <Link href="/about" className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors">About</Link>
              <Link href="/contact" className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors">Contact</Link>
            </div>
            <div className="flex flex-col gap-space-sm">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface">Legal</span>
              <Link href="/privacy" className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors">Privacy</Link>
              <Link href="/terms" className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors">Terms</Link>
            </div>
          </div>
          <div className="mt-space-xl pt-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-md border-t border-surface-variant/30">
            <p className="font-body-sm text-body-sm text-on-surface-variant">© {new Date().getFullYear()} MakeMyMarriage Technologies Inc. All rights reserved.</p>
            <div className="flex items-center gap-space-md">
              <Link href="/login" className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors">Sign In</Link>
              <Link href="/signup" className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors">Start Planning</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
