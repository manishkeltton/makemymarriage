import React from "react";

export function CollaborationFeatures() {
  return (
    <section className="w-full bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-label-md text-label-md uppercase tracking-wider text-primary-container font-semibold block mb-2">
            Scoped Permissions
          </span>
          <h2 className="font-headline-lg text-headline-lg sm:text-[34px] text-on-surface font-bold tracking-tight mb-4">
            Everyone helps. Everyone knows what they own.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Give family members and organizers clear access to what they need without creating different, isolated spreadsheets for everyone.
          </p>
        </div>

        {/* Permission Matrix Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Groom Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary font-headline-sm flex items-center justify-center">AG</div>
                <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold">Workspace Owner</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Aarav (Groom)</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Full Admin Control</p>
              <div className="space-y-2 pt-2 border-t-0 bg-surface-container-low p-3 rounded">
                <div className="flex items-center justify-between text-label-sm font-headline-sm text-on-surface">
                  <span className="">Budget &amp; Spend</span>
                  <span className="text-secondary">Full Access</span>
                </div>
                <div className="flex items-center justify-between text-label-sm font-headline-sm text-on-surface">
                  <span className="">Guest Allocation</span>
                  <span className="text-secondary">Full Access</span>
                </div>
                <div className="flex items-center justify-between text-label-sm font-headline-sm text-on-surface">
                  <span className="">Website &amp; RSVP</span>
                  <span className="text-secondary">Full Access</span>
                </div>
              </div>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-4 block">Invited as Workspace Administrator</span>
          </div>

          {/* Bride Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary font-headline-sm flex items-center justify-center">MR</div>
                <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold">Workspace Owner</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Meera (Bride)</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Full Admin Control</p>
              <div className="space-y-2 pt-2 bg-surface-container-low p-3 rounded">
                <div className="flex items-center justify-between text-label-sm font-headline-sm text-on-surface">
                  <span className="">Budget &amp; Spend</span>
                  <span className="text-secondary">Full Access</span>
                </div>
                <div className="flex items-center justify-between text-label-sm font-headline-sm text-on-surface">
                  <span className="">Guest Allocation</span>
                  <span className="text-secondary">Full Access</span>
                </div>
                <div className="flex items-center justify-between text-label-sm font-headline-sm text-on-surface">
                  <span className="">Design &amp; Styling</span>
                  <span className="text-secondary">Full Access</span>
                </div>
              </div>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-4 block">Invited as Workspace Administrator</span>
          </div>

          {/* Priya (Sister) */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-[#EAD4D8] text-primary-container font-headline-sm flex items-center justify-center">PR</div>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">Ceremony Lead</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Priya (Sister / Organiser)</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Scoped to Sangeet &amp; Haldi</p>
              <div className="space-y-2 pt-2 bg-surface-container-low p-3 rounded">
                <div className="flex items-center justify-between text-label-sm font-headline-sm text-on-surface">
                  <span className="">Tasks &amp; Vendors</span>
                  <span className="text-secondary">Can Edit (Assigned)</span>
                </div>
                <div className="flex items-center justify-between text-label-sm font-headline-sm text-on-surface">
                  <span className="">Overall Budgets</span>
                  <span className="text-on-surface-variant">Hidden</span>
                </div>
                <div className="flex items-center justify-between text-label-sm font-headline-sm text-on-surface">
                  <span className="">Guest List RSVP</span>
                  <span className="text-on-surface-variant">View Only</span>
                </div>
              </div>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-4 block">Cannot view master financial ledger</span>
          </div>
        </div>
      </div>
    </section>
  );
}
