import React from "react";
import Image from "next/image";

export function WebsiteFeatures() {
  return (
    <section className="w-full bg-surface-container-low py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12">
          <span className="font-label-md text-label-md uppercase tracking-wider text-primary-container font-semibold block mb-2">Guest-Facing Experience</span>
          <h2 className="font-headline-lg text-headline-lg sm:text-[34px] text-on-surface font-bold tracking-tight mb-3">
            Plan privately. Share beautifully.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Turn your wedding plan directly into a clean, customizable public website with multi-day events, venues, galleries, guestbook, and YouTube live stream.
          </p>
        </div>

        {/* Side-by-Side Builder & Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Website Customizer Drawer UI (5 Cols) */}
          <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-5">
              <span className="font-headline-sm text-headline-sm text-on-surface">Website Modules</span>
              <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Live at: mmm.page/aarav-meera</span>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="material-symbols-outlined text-primary-container text-[20px]">palette</span>
                  <div>
                    <span className="font-headline-sm text-body-sm text-on-surface block">Theme Aesthetic</span>
                    <span className="text-on-surface-variant font-body-sm">Warm Editorial Ivory & Deep Burgundy</span>
                  </div>
                </div>
                <span className="w-4 h-4 rounded-full bg-primary-container"></span>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant text-[20px]">favorite</span>
                  <div>
                    <span className="font-headline-sm text-body-sm text-on-surface block">Our Story & Welcome</span>
                    <span className="text-on-surface-variant font-body-sm">Published</span>
                  </div>
                </div>
                <span aria-hidden="true" className="material-symbols-outlined text-secondary text-[20px]">toggle_on</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant text-[20px]">calendar_month</span>
                  <div>
                    <span className="font-headline-sm text-body-sm text-on-surface block">Ceremony Itinerary</span>
                    <span className="text-on-surface-variant font-body-sm">5 events synced with live updates</span>
                  </div>
                </div>
                <span aria-hidden="true" className="material-symbols-outlined text-secondary text-[20px]">toggle_on</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant text-[20px]">map</span>
                  <div>
                    <span className="font-headline-sm text-body-sm text-on-surface block">Venues & Google Maps</span>
                    <span className="text-on-surface-variant font-body-sm">One-click directions enabled</span>
                  </div>
                </div>
                <span aria-hidden="true" className="material-symbols-outlined text-secondary text-[20px]">toggle_on</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant text-[20px]">live_tv</span>
                  <div>
                    <span className="font-headline-sm text-body-sm text-on-surface block">Pheras YouTube Livestream</span>
                    <span className="text-on-surface-variant font-body-sm">Stream link connected</span>
                  </div>
                </div>
                <span aria-hidden="true" className="material-symbols-outlined text-secondary text-[20px]">toggle_on</span>
              </div>
            </div>
          </div>

          {/* Right: Preview of Aarav & Meera's Live Site (7 Cols) */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden">
            {/* Browser chrome */}
            <div className="px-4 py-3 bg-surface-container-high flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-surface-variant"></span>
                <span className="w-3 h-3 rounded-full bg-surface-variant"></span>
                <span className="w-3 h-3 rounded-full bg-surface-variant"></span>
              </div>
              <div className="mx-auto text-on-surface-variant font-label-sm text-label-sm bg-surface-container-lowest px-4 py-1 rounded text-center w-64 truncate">
                makemymarriage.com/aarav-meera
              </div>
            </div>

            {/* Website Preview Interior */}
            <div className="p-8 bg-[#FBF8F4] text-center">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container font-semibold">Celebrate With Us</span>
              <h3 className="font-display-lg text-[32px] leading-tight text-[#211D1C] font-bold mt-2 mb-2">Aarav & Meera</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-8 font-normal">November 18–22, 2025 • Agra, Uttar Pradesh</p>

              {/* Curated Visual preview */}
              <div className="w-full h-48 rounded-lg overflow-hidden mb-8 shadow-sm relative">
                <Image 
                  alt="Sophisticated editorial photograph of an Indian bride and groom standing together in ivory and ceremonial burgundy wedding attire against warm sandstone palace architecture with natural light" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1e6E95LBWuAj1-Nggu3TZFVzmrXfDsu8ZLFvCwa-0NZX-AZbXXM7serOLq4Z0ScPpxao3pdJ3RwtmR9jUBS_1bpDkZgW_UF0SmSa-gWd96xPMObawARz0p9TXEMChQ6E4Mt6yoo6CmPzfZH2jAsLlgfxvOgD9sQIvRVLVoR3cj-AIPS4Sj4LuPHuyeIfPAOErnryJObnhb68dmY7ftCKqhKsvR1vKDlHGu_Bt-R-Y5vzf6TIoEij4"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Schedule Itinerary Preview */}
              <div className="text-left space-y-3 max-w-md mx-auto">
                <div className="p-3 bg-surface-container-lowest rounded shadow-sm flex items-center justify-between">
                  <div>
                    <span className="font-headline-sm text-body-sm text-on-surface block">The Sangeet Celebration</span>
                    <span className="text-on-surface-variant font-body-sm">20 Nov • 7:30 PM • Oberoi Lawn</span>
                  </div>
                  <span aria-hidden="true" className="material-symbols-outlined text-primary-container text-[18px]">open_in_new</span>
                </div>
                <div className="p-3 bg-surface-container-lowest rounded shadow-sm flex items-center justify-between">
                  <div>
                    <span className="font-headline-sm text-body-sm text-on-surface block">The Wedding Muhurat & Pheras</span>
                    <span className="text-on-surface-variant font-body-sm">21 Nov • 4:00 PM • Mandap Courtyard</span>
                  </div>
                  <span aria-hidden="true" className="material-symbols-outlined text-primary-container text-[18px]">open_in_new</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
