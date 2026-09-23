import React from "react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-surface pt-12 pb-24 px-4 sm:px-6 lg:px-8">
      {/* Subtle architectural ambient gradient (no kitsch) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(118,43,58,0.06),transparent)]"></div>
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 bg-[#F5EDEF] text-primary-container px-3.5 py-1.5 rounded-full font-label-sm text-label-sm uppercase tracking-wider mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
          Wedding planning, built for Indian couples
        </div>
        
        {/* Main Headline */}
        <h1 className="font-display-lg text-display-lg sm:text-[56px] sm:leading-[1.12] text-on-surface max-w-4xl tracking-tight mb-6 font-bold">
          Plan your wedding. <span className="text-primary-container">Together.</span>
        </h1>
        
        {/* Supporting Subhead */}
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-9 font-normal">
          One place for your events, tasks, guests, vendors, expenses and wedding website — built for Indian weddings and everyone helping you plan them.
        </p>
        
        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 mb-5 w-full sm:w-auto">
          <Link href="/signup" className="w-full sm:w-auto bg-primary-container hover:bg-[#5D1F2C] text-on-primary font-headline-sm text-headline-sm px-7 py-3.5 rounded-lg shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2">
            <span>Start Planning Free</span>
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
          <button className="w-full sm:w-auto bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-headline-sm text-headline-sm px-6 py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
            <span aria-hidden="true" className="material-symbols-outlined text-primary-container text-[20px]">play_circle</span>
            <span>See How It Works</span>
          </button>
        </div>
        
        {/* Trust Subtext */}
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-14 flex items-center gap-2 justify-center">
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
          <span>No credit card required</span>
          <span className="opacity-40">•</span>
          <span>Instant couple workspace setup</span>
        </p>

        {/* HERO PRODUCT VISUAL: SaaS Dashboard Mockup */}
        <div className="w-full max-w-6xl rounded-xl bg-surface-container-lowest shadow-[0_20px_50px_-12px_rgba(33,29,28,0.09)] text-left overflow-hidden">
          {/* Top App Bar */}
          <div className="px-6 py-4 bg-surface-container-low flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-headline-sm">
                AM
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-headline-sm text-on-surface">Aarav &amp; Meera’s Wedding</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">Active Workspace</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">The Oberoi Amarvilas, Agra • 62 days to go</p>
              </div>
            </div>
            
            {/* Collaborator Cluster */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-surface-container-lowest bg-[#EAD4D8] text-primary-container items-center justify-center font-label-md">AM</div>
                <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-surface-container-lowest bg-[#D9E3DC] text-secondary items-center justify-center font-label-md">PR</div>
                <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-surface-container-lowest bg-[#FFE2D1] text-tertiary items-center justify-center font-label-md">FD</div>
                <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-surface-container-lowest bg-surface-container-high text-on-surface-variant items-center justify-center font-label-md">+4</div>
              </div>
              <button className="text-body-sm font-headline-sm text-primary-container hover:underline pl-2 flex items-center gap-1">
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">person_add</span> Invite Family
              </button>
            </div>
          </div>

          {/* Ceremony Pill Navigation Bar */}
          <div className="px-6 py-3 bg-surface-container-lowest flex items-center gap-2 overflow-x-auto snap-x snap-mandatory" tabIndex={0} role="region" aria-label="Ceremony Navigation">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mr-2 shrink-0">Ceremonies:</span>
            <button className="snap-start px-3.5 py-1.5 rounded-full font-label-md text-label-md bg-surface-container-low text-on-surface-variant hover:text-on-surface shrink-0">Mehendi (18 Nov)</button>
            <button className="snap-start px-3.5 py-1.5 rounded-full font-label-md text-label-md bg-surface-container-low text-on-surface-variant hover:text-on-surface shrink-0">Haldi (19 Nov)</button>
            <button className="snap-start px-4 py-1.5 rounded-full font-headline-sm text-label-md bg-primary-container text-on-primary shrink-0 shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed"></span>
              Sangeet (20 Nov)
            </button>
            <button className="snap-start px-3.5 py-1.5 rounded-full font-label-md text-label-md bg-surface-container-low text-on-surface-variant hover:text-on-surface shrink-0">Wedding &amp; Pheras (21 Nov)</button>
            <button className="snap-start px-3.5 py-1.5 rounded-full font-label-md text-label-md bg-surface-container-low text-on-surface-variant hover:text-on-surface shrink-0">Reception (22 Nov)</button>
          </div>

          {/* 4 Top KPI Cards */}
          <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-surface-container-low/40">
            <div className="bg-surface-container-lowest p-4 rounded-lg shadow-sm">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">Total Tasks</span>
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-headline-lg text-headline-lg text-on-surface">32 <span className="text-body-md text-on-surface-variant font-normal">/ 47</span></span>
                <span className="font-label-sm text-label-sm text-secondary font-semibold">68% Done</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full w-[68%]"></div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-lg shadow-sm">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">Guest RSVPs</span>
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-headline-lg text-headline-lg text-on-surface">186</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">of 240 invited</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> 28 awaiting responses
              </p>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-lg shadow-sm">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">Expenses Tracked</span>
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-headline-lg text-headline-lg text-on-surface">₹8.4L</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Budget: ₹14.0L</span>
              </div>
              <p className="font-body-sm text-body-sm text-secondary flex items-center gap-1 font-medium">
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">trending_flat</span> 60% budget utilized
              </p>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-lg shadow-sm">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">Upcoming Payments</span>
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-headline-lg text-headline-lg text-primary-container">₹1.75L</span>
                <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm">2 Due</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Next due tomorrow to Studios</p>
            </div>
          </div>

          {/* Two-column Workspace Body */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Active Function Plan & Immediate Tasks */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="material-symbols-outlined text-primary-container text-[20px]">celebration</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Next Up: Sangeet Night</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant">20 Nov • 7:00 PM • Oberoi Lawn</span>
              </div>
              {/* Task Checklist */}
              <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2">
                <div className="bg-surface-container-lowest p-3 rounded flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 h-5 rounded bg-secondary text-on-secondary flex items-center justify-center shrink-0">
                      <span aria-hidden="true" className="material-symbols-outlined text-[14px]">check</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-body-md text-body-md text-on-surface line-through opacity-70 truncate">Finalize DJ sound &amp; lighting cue playlist</p>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Sangeet • Rahul (Cousin)</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm shrink-0">Done</span>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 h-5 rounded bg-secondary text-on-secondary flex items-center justify-center shrink-0">
                      <span aria-hidden="true" className="material-symbols-outlined text-[14px]">check</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-body-md text-body-md text-on-surface line-through opacity-70 truncate">Confirm floral arch staging specifications</p>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Sangeet • Priya (Sister)</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm shrink-0">Done</span>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 h-5 rounded bg-surface-container text-transparent flex items-center justify-center shrink-0"></div>
                    <div className="min-w-0">
                      <p className="font-headline-sm text-body-md text-on-surface truncate">Send digital invitation batch 2 (Overseas families)</p>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Wedding • Aarav (Groom)</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-label-sm text-label-sm shrink-0 font-medium">In Progress</span>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 h-5 rounded bg-surface-container text-transparent flex items-center justify-center shrink-0"></div>
                    <div className="min-w-0">
                      <p className="font-headline-sm text-body-md text-on-surface truncate">Candid studio photographer milestone advance payment</p>
                      <span className="font-label-sm text-label-sm text-primary-container font-medium">Reception • Bride’s Father</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm shrink-0 font-semibold">Due Tomorrow</span>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Live Activity & Organiser Roster */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-headline-sm text-on-surface">Collaborator Stream</span>
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
              </div>
              <div className="bg-surface-container-low rounded-lg p-3.5 flex flex-col gap-3 h-full">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md flex items-center justify-center shrink-0 mt-0.5">
                    PR
                  </div>
                  <div>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      <span className="font-headline-sm text-primary-container">Priya</span> approved final 4-minute Sangeet couple choreography track mix.
                    </p>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">12 minutes ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-md flex items-center justify-center shrink-0 mt-0.5">
                    BF
                  </div>
                  <div>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      <span className="font-headline-sm text-on-surface">Bride’s Father</span> logged <span className="font-semibold text-secondary">₹50,000</span> advance receipt to Royal Palace Decorators.
                    </p>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">1 hour ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md flex items-center justify-center shrink-0 mt-0.5">
                    AG
                  </div>
                  <div>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      <span className="font-headline-sm text-on-surface">Aarav</span> confirmed <span className="font-semibold text-on-surface">Kapoor Family</span> RSVP (5 attending, Mehendi &amp; Reception).
                    </p>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">3 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
