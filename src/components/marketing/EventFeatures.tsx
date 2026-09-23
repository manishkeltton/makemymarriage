import React from "react";

export function EventFeatures() {
  return (
    <section className="w-full bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-12">
          <span className="font-label-md text-label-md uppercase tracking-wider text-primary-container font-semibold block mb-2">
            Multidimensional Architecture
          </span>
          <h2 className="font-headline-lg text-headline-lg sm:text-[34px] text-on-surface font-bold tracking-tight mb-3">
            One wedding. Every event.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Plan every function separately while keeping the whole celebration interconnected. Distinct venues, timelines, guest subsets, and vendor teams per event.
          </p>
        </div>

        {/* Ceremony Switcher UI Container */}
        <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden">
          {/* Tab Bar */}
          <div className="flex items-center overflow-x-auto bg-surface-container-low px-4 pt-4 gap-2 snap-x snap-mandatory" tabIndex={0} role="tablist" aria-label="Ceremony selector">
            <button role="tab" className="snap-start px-5 py-3 rounded-t-lg font-headline-sm text-body-md text-on-surface-variant hover:text-on-surface bg-transparent transition-colors shrink-0">
              Mehendi &amp; Sundowner
            </button>
            <button role="tab" className="snap-start px-5 py-3 rounded-t-lg font-headline-sm text-body-md text-on-surface-variant hover:text-on-surface bg-transparent transition-colors shrink-0">
              Haldi &amp; Phoolon Ki Holi
            </button>
            <button role="tab" aria-selected="true" className="snap-start px-5 py-3 rounded-t-lg font-headline-sm text-body-md text-primary-container bg-surface-container-lowest shadow-sm flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-primary-container"></span>
              Sangeet Gala
            </button>
            <button role="tab" className="snap-start px-5 py-3 rounded-t-lg font-headline-sm text-body-md text-on-surface-variant hover:text-on-surface bg-transparent transition-colors shrink-0">
              Wedding &amp; Pheras
            </button>
            <button role="tab" className="snap-start px-5 py-3 rounded-t-lg font-headline-sm text-body-md text-on-surface-variant hover:text-on-surface bg-transparent transition-colors shrink-0">
              Grand Reception
            </button>
          </div>

          {/* Tab Content View (Sangeet Active) */}
          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Info Panel */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F5EDEF] text-primary-container font-label-sm text-label-sm font-semibold">Ceremony 03</span>
                    <span className="text-on-surface-variant font-label-sm text-label-sm">Day 2 Evening</span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface mb-2 font-bold">Sangeet &amp; Musical Night</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                    Curated evening performances, coupled choreography, live percussionists, and dinner buffet.
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <span aria-hidden="true" className="material-symbols-outlined text-primary-container text-[20px] mt-0.5">location_on</span>
                      <div>
                        <span className="font-headline-sm text-body-md text-on-surface block">Grand Mughal Ballroom &amp; Terrace Lawn</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">The Oberoi Amarvilas, Agra</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span aria-hidden="true" className="material-symbols-outlined text-primary-container text-[20px] mt-0.5">schedule</span>
                      <div>
                        <span className="font-headline-sm text-body-md text-on-surface block">7:30 PM – 1:30 AM</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Performances commence promptly at 8:45 PM</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span aria-hidden="true" className="material-symbols-outlined text-primary-container text-[20px] mt-0.5">supervisor_account</span>
                      <div>
                        <span className="font-headline-sm text-body-md text-on-surface block">Event Leads</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Priya (Bride’s Sister) &amp; Rahul (Groom’s Cousin)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mini Event Budget Tracker */}
                <div className="p-4 bg-surface-container-low rounded-lg">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Sangeet Allocation</span>
                    <span className="font-headline-sm text-body-sm text-on-surface font-semibold">₹3.80L / ₹4.00L</span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mb-2">
                    <div className="bg-primary-container h-full rounded-full w-[95%]"></div>
                  </div>
                  <span className="font-body-sm text-label-sm text-on-surface-variant">Includes sound, lighting truss, choreographer, and dry ice</span>
                </div>
              </div>

              {/* Right Detail Matrix (Vendors & Tasks) */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Assigned Vendors Card */}
                <div className="p-5 bg-surface-container-low rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-headline-sm text-headline-sm text-on-surface">Assigned Vendors</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">4 Contracts</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-surface-container-lowest rounded shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-body-sm text-on-surface">DJ Sunny &amp; Sound Consoles</span>
                        <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Confirmed</span>
                      </div>
                      <span className="font-body-sm text-label-sm text-on-surface-variant block mt-1">₹85,000 • Advance Paid</span>
                    </div>
                    <div className="p-3 bg-surface-container-lowest rounded shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-body-sm text-on-surface">Nritya Choreography Crew</span>
                        <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Confirmed</span>
                      </div>
                      <span className="font-body-sm text-label-sm text-on-surface-variant block mt-1">₹60,000 • Rehearsals Active</span>
                    </div>
                    <div className="p-3 bg-surface-container-lowest rounded shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-body-sm text-on-surface">Stage LED Walls &amp; Truss</span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-label-sm text-label-sm font-medium">Pending Tech Rider</span>
                      </div>
                      <span className="font-body-sm text-label-sm text-on-surface-variant block mt-1">₹1,10,000 • Advance Due 18 Nov</span>
                    </div>
                  </div>
                </div>

                {/* Function Tasks Card */}
                <div className="p-5 bg-surface-container-low rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-headline-sm text-headline-sm text-on-surface">Function Tasks</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">12 Active</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-surface-container-lowest rounded shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-body-sm text-on-surface">Review sequence of family performances</span>
                        <span className="font-label-sm text-label-sm text-primary-container font-medium">High</span>
                      </div>
                      <span className="font-body-sm text-label-sm text-on-surface-variant block mt-1">Assigned to: Priya • Due 17 Nov</span>
                    </div>
                    <div className="p-3 bg-surface-container-lowest rounded shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-body-sm text-on-surface">Arrange stage green rooms for bride party</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Normal</span>
                      </div>
                      <span className="font-body-sm text-label-sm text-on-surface-variant block mt-1">Assigned to: Rahul • Due 19 Nov</span>
                    </div>
                    <div className="p-3 bg-surface-container-lowest rounded shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-body-sm text-on-surface">Verify generator backup for audio rig</span>
                        <span className="font-label-sm text-label-sm text-primary-container font-medium">High</span>
                      </div>
                      <span className="font-body-sm text-label-sm text-on-surface-variant block mt-1">Assigned to: Hotel Coordinator</span>
                    </div>
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
