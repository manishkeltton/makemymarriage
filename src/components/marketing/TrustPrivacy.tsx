import React from "react";

export function TrustPrivacy() {
  return (
    <section className="w-full bg-surface-container-low py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-label-md text-label-md uppercase tracking-wider text-primary-container font-semibold block mb-2">Absolute Privacy</span>
          <h2 className="font-headline-lg text-headline-lg sm:text-[34px] text-on-surface font-bold tracking-tight mb-3">
            Your wedding information stays yours.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant font-normal">
            Designed with bank-grade standards to protect sensitive family details, guest phone numbers, and financial commitments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-surface-container-low text-primary-container flex items-center justify-center mb-4">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Controlled Team Access</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Choose exactly who can see sensitive areas like master budgets, guest telephone numbers, contracts, and private notes.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-surface-container-low text-primary-container flex items-center justify-center mb-4">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">photo_library</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Private Media Protection</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              You decide whether photos and guestbook memories are strictly visible to verified family or open to all attending guests.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-surface-container-low text-primary-container flex items-center justify-center mb-4">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Isolated Workspaces</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Each wedding functions inside its own isolated database partition with end-to-end encryption for stored documents and contacts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
