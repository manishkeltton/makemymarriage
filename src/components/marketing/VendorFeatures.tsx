import React from "react";

export function VendorFeatures() {
  return (
    <section className="w-full bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12">
          <span className="font-label-md text-label-md uppercase tracking-wider text-primary-container font-semibold block mb-2">Clear Financial Accounting</span>
          <h2 className="font-headline-lg text-headline-lg sm:text-[34px] text-on-surface font-bold tracking-tight mb-3">
            Keep wedding spending understandable.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Track vendors, contracts, advances, installments, due dates, and who paid what — without turning your wedding into complicated accounting software.
          </p>
        </div>

        {/* Financial Dashboard Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-md p-6 lg:p-8">
          {/* 4 Top Financial Summary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pb-6 bg-surface-container-low p-5 rounded-lg mb-8">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">Total Target Budget</span>
              <span className="font-headline-lg text-headline-lg text-on-surface font-bold">₹14,00,000</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">Total Contracted</span>
              <span className="font-headline-lg text-headline-lg text-on-surface font-bold">₹12,40,000</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1 font-semibold">Total Paid to Date</span>
              <span className="font-headline-lg text-headline-lg text-secondary font-bold">₹8,20,000</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-primary-container uppercase tracking-wider block mb-1 font-semibold">Remaining Outstanding</span>
              <span className="font-headline-lg text-headline-lg text-primary-container font-bold">₹4,20,000</span>
            </div>
          </div>

          {/* Ledger Items */}
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Vendor Payment Schedule</h3>
          <div className="space-y-3">
            {/* Item 1 */}
            <div className="p-4 bg-surface-container-low rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-surface-container-lowest flex items-center justify-center text-primary-container shrink-0 shadow-sm">
                  <span aria-hidden="true" className="material-symbols-outlined text-[22px]">yard</span>
                </div>
                <div>
                  <span className="font-headline-sm text-body-md text-on-surface block">Royal Palace Decorators</span>
                  <span className="text-on-surface-variant font-body-sm">Stage fabrication & mandap floral installation (Contract: ₹2.5L)</span>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-6">
                <div className="text-right">
                  <span className="font-headline-sm text-body-md text-on-surface block">₹50,000 Due</span>
                  <span className="text-body-sm text-amber-800 font-medium">Due in 3 days</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm block">Paid by: Bride&apos;s Father</span>
                  <span className="text-on-surface-variant font-body-sm">NEFT Pending</span>
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="p-4 bg-surface-container-low rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-surface-container-lowest flex items-center justify-center text-secondary shrink-0 shadow-sm">
                  <span aria-hidden="true" className="material-symbols-outlined text-[22px]">photo_camera</span>
                </div>
                <div>
                  <span className="font-headline-sm text-body-md text-on-surface block">Luminary Studios (Photography & Cinema)</span>
                  <span className="text-on-surface-variant font-body-sm">Installment 2 of 3 • 4-camera team + candid trailer</span>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-6">
                <div className="text-right">
                  <span className="font-headline-sm text-body-md text-secondary block">₹1,00,000 Paid</span>
                  <span className="text-body-sm text-secondary font-medium">Receipt #LS-991</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm block">Paid by: Aarav (Groom)</span>
                  <span className="text-on-surface-variant font-body-sm">UPI Confirmed</span>
                </div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="p-4 bg-surface-container-low rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-surface-container-lowest flex items-center justify-center text-primary-container shrink-0 shadow-sm">
                  <span aria-hidden="true" className="material-symbols-outlined text-[22px]">hotel</span>
                </div>
                <div>
                  <span className="font-headline-sm text-body-md text-on-surface block">Heritage Grand Courtyard & Banquets</span>
                  <span className="text-on-surface-variant font-body-sm">Room block reservation balance (24 Deluxe Rooms)</span>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-6">
                <div className="text-right">
                  <span className="font-headline-sm text-body-md text-on-surface block">₹2,00,000 Pending</span>
                  <span className="text-body-sm text-on-surface-variant">Due: 15 Nov</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm block">Assigned: Bride&apos;s Father</span>
                  <span className="text-on-surface-variant font-body-sm">Awaiting Bank Transfer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
