import React from "react";

export function IndianWeddings() {
  return (
    <section className="w-full bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="font-label-md text-label-md uppercase tracking-wider text-primary-container font-semibold block mb-2">Tailored Architecture</span>
          <h2 className="font-headline-lg text-headline-lg sm:text-[34px] text-on-surface font-bold tracking-tight mb-3">
            Built around the way Indian weddings are actually planned.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Multiple functions. Multiple organizers. Extended families. One shared operational ground.
          </p>

          {/* Ceremony Tag Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <span className="px-3.5 py-1.5 rounded-full bg-[#F5EDEF] text-primary-container font-label-md text-label-md font-semibold">Mehendi</span>
            <span className="px-3.5 py-1.5 rounded-full bg-[#F5EDEF] text-primary-container font-label-md text-label-md font-semibold">Haldi Ceremony</span>
            <span className="px-3.5 py-1.5 rounded-full bg-[#F5EDEF] text-primary-container font-label-md text-label-md font-semibold">Sangeet Night</span>
            <span className="px-3.5 py-1.5 rounded-full bg-[#F5EDEF] text-primary-container font-label-md text-label-md font-semibold">Pheras & Muhurat</span>
            <span className="px-3.5 py-1.5 rounded-full bg-[#F5EDEF] text-primary-container font-label-md text-label-md font-semibold">Reception Gala</span>
            <span className="px-3.5 py-1.5 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md">+ Custom Puja / Cocktail</span>
          </div>
        </div>

        {/* Problem vs MakeMyMarriage Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-surface-container-low rounded-xl">
            <div className="w-8 h-8 rounded bg-surface-container-lowest text-primary-container flex items-center justify-center mb-4 shadow-sm">
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">family_restroom</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">The Extended Family Problem</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Generic Western wedding apps assume only two people plan the wedding. MakeMyMarriage empowers uncles, aunts, siblings, and coordinators with dedicated ceremonial ownership.
            </p>
          </div>

          <div className="p-6 bg-surface-container-low rounded-xl">
            <div className="w-8 h-8 rounded bg-surface-container-lowest text-primary-container flex items-center justify-center mb-4 shadow-sm">
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">groups</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">The Household RSVP Problem</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Indian invitations go to whole households, not individual email inboxes. Our system groups families together so one head of household can RSVP for 5 members in 1 click.
            </p>
          </div>

          <div className="p-6 bg-surface-container-low rounded-xl">
            <div className="w-8 h-8 rounded bg-surface-container-lowest text-primary-container flex items-center justify-center mb-4 shadow-sm">
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">payments</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">The Fragmented Spend Problem</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Advances, cash envelopes, NEFT transfers, and UPI splits happen across both sets of parents. Our ledger tracks exactly who made each payment and what balance remains.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
