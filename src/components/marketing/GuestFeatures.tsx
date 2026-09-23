import React from "react";

export function GuestFeatures() {
  return (
    <section className="w-full bg-surface-container-low py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12">
          <span className="font-label-md text-label-md uppercase tracking-wider text-primary-container font-semibold block mb-2">Household Intelligence</span>
          <h2 className="font-headline-lg text-headline-lg sm:text-[34px] text-on-surface font-bold tracking-tight mb-3">
            Guest management built around families.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant font-normal">
            Manage families as collective households, send personalized WhatsApp links, and gather clear RSVPs without forcing guests to register or create accounts.
          </p>
        </div>

        {/* Guest Workspace Table UI Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden">
          {/* Top Metrics Row */}
          <div className="p-6 bg-surface-container-low/50 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">Total Invited</span>
              <span className="font-headline-lg text-headline-lg text-on-surface font-bold">240</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1 font-semibold">Attending</span>
              <span className="font-headline-lg text-headline-lg text-secondary font-bold">186</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-amber-800 uppercase tracking-wider block mb-1 font-semibold">Awaiting Response</span>
              <span className="font-headline-lg text-headline-lg text-amber-800 font-bold">40</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">Declined</span>
              <span className="font-headline-lg text-headline-lg text-on-surface font-bold">14</span>
            </div>
          </div>

          {/* Filter bar */}
          <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-surface-container-lowest">
            <div className="flex items-center gap-2">
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">Filter Side:</span>
              <button className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface font-label-md text-label-md font-semibold">All (64 Families)</button>
              <button className="px-3 py-1 rounded-full bg-transparent text-on-surface-variant hover:text-on-surface font-label-md text-label-md">Bride (34)</button>
              <button className="px-3 py-1 rounded-full bg-transparent text-on-surface-variant hover:text-on-surface font-label-md text-label-md">Groom (30)</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">link</span>
                No Guest Account Required
              </span>
            </div>
          </div>

          {/* Household Roster */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">Household / Family</th>
                  <th className="px-6 py-3 font-semibold">Side</th>
                  <th className="px-6 py-3 font-semibold">Headcount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Dietary & Logistics</th>
                  <th className="px-6 py-3 font-semibold text-right">Invitation Link</th>
                </tr>
              </thead>
              <tbody className="divide-y-0 text-body-sm font-body-sm text-on-surface">
                {/* Row 1 */}
                <tr className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-headline-sm text-body-md text-on-surface block">Sharma Family</span>
                    <span className="text-on-surface-variant font-body-sm">Dr. Alok & Sunita Sharma (+2 children)</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-medium">Bride&apos;s Side</span>
                  </td>
                  <td className="px-6 py-4 font-headline-sm">4 Guests</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold inline-flex items-center gap-1">
                      <span aria-hidden="true" className="material-symbols-outlined text-[12px]">check</span> Confirmed
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-on-surface font-medium">2 Jain, 2 Regular</span>
                    <span className="text-on-surface-variant block font-body-sm">Attending: Haldi, Sangeet, Wedding</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="px-3 py-1.5 rounded bg-surface-container text-primary-container font-headline-sm text-body-sm hover:bg-surface-container-high transition-colors inline-flex items-center gap-1">
                      <span>Copy Link</span>
                      <span aria-hidden="true" className="material-symbols-outlined text-[14px]">content_copy</span>
                    </button>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-surface-container-low/40 transition-colors bg-surface-container-low/20">
                  <td className="px-6 py-4">
                    <span className="font-headline-sm text-body-md text-on-surface block">Kapoor Family</span>
                    <span className="text-on-surface-variant font-body-sm">Vikram Kapoor & Family</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-medium">Groom&apos;s Side</span>
                  </td>
                  <td className="px-6 py-4 font-headline-sm">5 Guests</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-label-sm text-label-sm font-medium inline-flex items-center gap-1">
                      <span aria-hidden="true" className="material-symbols-outlined text-[12px]">schedule</span> Awaiting RSVP
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-on-surface-variant">Invite dispatched via WhatsApp on 10 Nov</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="px-3 py-1.5 rounded bg-surface-container text-on-surface font-headline-sm text-body-sm hover:bg-surface-container-high transition-colors inline-flex items-center gap-1">
                      <span>Resend</span>
                      <span aria-hidden="true" className="material-symbols-outlined text-[14px]">send</span>
                    </button>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-headline-sm text-body-md text-on-surface block">Malhotra Family</span>
                    <span className="text-on-surface-variant font-body-sm">Rajesh & Neha Malhotra (+1)</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-medium">Bride&apos;s Side</span>
                  </td>
                  <td className="px-6 py-4 font-headline-sm">3 Guests</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold inline-flex items-center gap-1">
                      <span aria-hidden="true" className="material-symbols-outlined text-[12px]">check</span> Confirmed
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-on-surface font-medium">Arriving 19 Nov (Flight AI-402)</span>
                    <span className="text-on-surface-variant block font-body-sm">Airport pickup scheduled</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="px-3 py-1.5 rounded bg-surface-container text-primary-container font-headline-sm text-body-sm hover:bg-surface-container-high transition-colors inline-flex items-center gap-1">
                      <span>Copy Link</span>
                      <span aria-hidden="true" className="material-symbols-outlined text-[14px]">content_copy</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
