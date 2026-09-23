import React from "react";
import Link from "next/link";

export function SocialProof() {
  return (
    <section className="w-full bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-[#F5EDEF] rounded-2xl p-8 sm:p-14 text-center shadow-lg relative overflow-hidden">
        {/* Background subtle architectural tint ring */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-container/5 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="font-display-lg text-display-lg sm:text-[44px] sm:leading-tight text-on-surface font-bold tracking-tight mb-2">
            Your wedding has enough moving parts.
          </h2>
          <p className="font-headline-lg text-headline-lg sm:text-[28px] text-primary-container font-semibold mb-6">
            Your planning doesn’t have to.
          </p>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
            Join thousands of couples and families organizing calm, beautiful, multi-day celebrations with MakeMyMarriage.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link href="/signup" className="w-full sm:w-auto bg-primary-container hover:bg-[#5D1F2C] text-on-primary font-headline-sm text-headline-sm px-8 py-4 rounded-lg shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2">
              <span>Start Planning Free</span>
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <button className="w-full sm:w-auto bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-headline-sm text-headline-sm px-7 py-4 rounded-lg shadow-sm transition-all">
              Explore All Features
            </button>
          </div>
          
          <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center justify-center gap-2">
            <span aria-hidden="true" className="material-symbols-outlined text-secondary text-[16px]">verified</span>
            <span>No credit card required</span>
            <span className="opacity-40">•</span>
            <span>Invite your family in seconds</span>
          </p>
          
          {/* Small Floating Preview Pill */}
          <div className="mt-8 inline-flex items-center gap-3 bg-surface-container-lowest px-4 py-2 rounded-full shadow-sm">
            <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container font-label-sm flex items-center justify-center">✓</div>
            <span className="font-body-sm text-body-sm text-on-surface font-medium">Aarav & Meera&apos;s Workspace: 68% planned</span>
          </div>
        </div>
      </div>
    </section>
  );
}
