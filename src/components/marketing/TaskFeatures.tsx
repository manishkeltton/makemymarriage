import React from "react";

export function TaskFeatures() {
  return (
    <section className="w-full bg-surface-container-low py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left: Kanban / Task Matrix UI */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="material-symbols-outlined text-primary-container text-[20px]">view_kanban</span>
              <span className="font-headline-sm text-headline-sm text-on-surface">Wedding Logistics Matrix</span>
            </div>
            <span className="font-label-md text-label-md bg-surface-container px-2.5 py-1 rounded text-on-surface-variant font-medium">
              47 Items Across 5 Functions
            </span>
          </div>

          {/* 3-Column Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Column 1: To Do */}
            <div className="bg-surface-container-low rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-semibold">To Do</span>
                <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center font-label-sm text-label-sm">2</span>
              </div>
              <div className="space-y-2.5">
                <div className="bg-surface-container-lowest p-3 rounded shadow-sm">
                  <span className="px-2 py-0.5 rounded bg-[#F5EDEF] text-primary-container font-label-sm text-label-sm block w-fit mb-1.5 font-medium">Sangeet</span>
                  <p className="font-headline-sm text-body-sm text-on-surface mb-2">Approve Sangeet décor 3D stage rendering</p>
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm flex items-center justify-center">PR</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Nov 15</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded shadow-sm">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm block w-fit mb-1.5 font-medium">General</span>
                  <p className="font-headline-sm text-body-sm text-on-surface mb-2">Finalize return gift packaging hampers</p>
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm flex items-center justify-center">MR</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Nov 16</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="bg-surface-container-low rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-semibold">In Progress</span>
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-label-sm text-label-sm">2</span>
              </div>
              <div className="space-y-2.5">
                <div className="bg-surface-container-lowest p-3 rounded shadow-sm">
                  <span className="px-2 py-0.5 rounded bg-[#F5EDEF] text-primary-container font-label-sm text-label-sm block w-fit mb-1.5 font-medium">Pheras</span>
                  <p className="font-headline-sm text-body-sm text-on-surface mb-2">Book traditional Varanasi Shehnai troupe</p>
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm flex items-center justify-center">BF</span>
                    <span className="font-label-sm text-label-sm text-primary-container font-semibold">Due Today</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded shadow-sm">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm block w-fit mb-1.5 font-medium">Guests</span>
                  <p className="font-headline-sm text-body-sm text-on-surface mb-2">Dispatch digital invitations via WhatsApp</p>
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm flex items-center justify-center">AG</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Nov 14</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Completed */}
            <div className="bg-surface-container-low rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-semibold">Done</span>
                <span className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-sm text-label-sm">32</span>
              </div>
              <div className="space-y-2.5">
                <div className="bg-surface-container-lowest p-3 rounded shadow-sm opacity-80">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm block w-fit mb-1.5 font-medium">Catering</span>
                  <p className="font-headline-sm text-body-sm text-on-surface line-through mb-2">Finalize banquet food tasting menu</p>
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant font-label-sm flex items-center justify-center">AM</span>
                    <span className="font-label-sm text-label-sm text-secondary font-medium">Finished</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded shadow-sm opacity-80">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm block w-fit mb-1.5 font-medium">Media</span>
                  <p className="font-headline-sm text-body-sm text-on-surface line-through mb-2">Book candid photography &amp; drone crew</p>
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant font-label-sm flex items-center justify-center">AG</span>
                    <span className="font-label-sm text-label-sm text-secondary font-medium">Finished</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Editorial Content */}
        <div className="lg:col-span-5">
          <span className="font-label-md text-label-md uppercase tracking-wider text-primary-container font-semibold block mb-2">
            Task Management
          </span>
          <h2 className="font-headline-lg text-headline-lg sm:text-[34px] text-on-surface font-bold tracking-tight mb-4">
            Know exactly what needs to happen next.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-6 leading-relaxed">
            Create tasks, assign responsibilities, set deadlines, and keep every ceremony moving without creating another wedding WhatsApp group.
          </p>
          <div className="space-y-4">
            <div className="p-4 bg-surface-container-lowest rounded-lg shadow-sm">
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-1">Ceremony Tagging</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Filter instantly between Mehendi, Sangeet, Pheras, or Reception to keep day-of logistics crystal clear.
              </p>
            </div>
            <div className="p-4 bg-surface-container-lowest rounded-lg shadow-sm">
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-1">Clear Single Ownership</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Every task has one unambiguous lead family member or planner accountable for delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
