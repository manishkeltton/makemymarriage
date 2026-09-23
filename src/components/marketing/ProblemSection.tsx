import React from "react";

export function ProblemSection() {
  return (
    <section className="w-full bg-surface-container-low py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-label-md text-label-md uppercase tracking-wider text-primary-container font-semibold block mb-2">
            The Reality of Indian Weddings
          </span>
          <h2 className="font-headline-lg text-headline-lg sm:text-[36px] text-on-surface font-bold tracking-tight mb-4">
            Wedding planning gets messy fast.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant font-normal">
            Tasks live in chats. Guest lists live in spreadsheets. Vendor details sit in PDFs. Payments are remembered by different people across different households.
          </p>
        </div>

        {/* Before vs After Converging Architecture Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Fragmented State (5 Floating Cards) */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-surface-container-lowest p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-error mb-1.5">
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">chat</span>
                <span className="font-label-md text-label-md">WhatsApp Group</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">42 unread voice notes on catering count updates</p>
            </div>
            
            <div className="bg-surface-container-lowest p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-error mb-1.5">
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">table_view</span>
                <span className="font-label-md text-label-md">Spreadsheets</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">Guest_List_v4_FINAL_edited_Nov12.xlsx</p>
            </div>
            
            <div className="bg-surface-container-lowest p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-error mb-1.5">
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                <span className="font-label-md text-label-md">Vendor Contracts</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">Photographer terms locked inside unopened PDF</p>
            </div>
            
            <div className="bg-surface-container-lowest p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-error mb-1.5">
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">screenshot</span>
                <span className="font-label-md text-label-md">Payment Screenshots</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">UPI receipt lost in camera roll</p>
            </div>
            
            <div className="bg-surface-container-lowest p-4 rounded-lg shadow-sm sm:col-span-2">
              <div className="flex items-center gap-2 text-error mb-1.5">
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">checklist</span>
                <span className="font-label-md text-label-md">Personal Notes App</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">Bride’s sister has her own checklist that no one else can see</p>
            </div>
          </div>

          {/* Center Converge Indicator */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-4">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">sync_alt</span>
            </div>
            <span className="font-label-sm text-label-sm text-primary-container font-semibold mt-2 uppercase tracking-wide">Unified into</span>
          </div>

          {/* Right: Unified Workspace Solution */}
          <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">MakeMyMarriage Core Engine</span>
            </div>
            <h3 className="font-headline-lg text-headline-lg text-on-surface mb-3 font-bold">
              Your Single Wedding Workspace
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6 leading-relaxed">
              Bring tasks, guests, ceremonies, vendors, and payments into one disciplined operational hub. Everyone sees exactly what they need — without adding more noise.
            </p>
            
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-on-surface text-body-sm font-medium">
                <span aria-hidden="true" className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                <span>No lost attachments or conflicting spreadsheet tabs</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface text-body-sm font-medium">
                <span aria-hidden="true" className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                <span>Explicit ceremonial ownership across extended family leads</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface text-body-sm font-medium">
                <span aria-hidden="true" className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                <span>One source of truth updated simultaneously for bride and groom</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
