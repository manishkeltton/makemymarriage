import React from "react";

export function HowItWorks() {
  return (
    <section className="w-full bg-surface-container-low py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-label-md text-label-md uppercase tracking-wider text-primary-container font-semibold block mb-2">Simple Orchestration</span>
          <h2 className="font-headline-lg text-headline-lg sm:text-[34px] text-on-surface font-bold tracking-tight mb-3">
            From &quot;we&apos;re getting married&quot; to wedding day.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant font-normal">
            A calm, structured 4-step roadmap designed for how multi-day celebrations unfold.
          </p>
        </div>

        {/* 4-Step Process Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm relative flex flex-col justify-between">
            <div>
              <span className="font-display-lg text-[28px] text-primary-container font-bold block mb-4">01</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Create workspace</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Set wedding dates, couples profile, and primary celebration venues in under 60 seconds.
              </p>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-6 block">Takes &lt; 2 minutes</span>
          </div>

          {/* Step 2 */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm relative flex flex-col justify-between">
            <div>
              <span className="font-display-lg text-[28px] text-primary-container font-bold block mb-4">02</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Add events & team</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Organize Mehendi, Haldi, Sangeet, and Reception. Invite designated family leads with scoped permissions.
              </p>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-6 block">Role-based assignments</span>
          </div>

          {/* Step 3 */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm relative flex flex-col justify-between">
            <div>
              <span className="font-display-lg text-[28px] text-primary-container font-bold block mb-4">03</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Coordinate everything</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Assign tasks, track vendor contracts, log payment installments, and manage household guest lists together.
              </p>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-6 block">Real-time collaboration</span>
          </div>

          {/* Step 4 */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm relative flex flex-col justify-between">
            <div>
              <span className="font-display-lg text-[28px] text-primary-container font-bold block mb-4">04</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Publish & share</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Launch your private website with live maps, stream links, and seamless 1-click WhatsApp RSVPs.
              </p>
            </div>
            <span className="font-label-sm text-label-sm text-secondary font-semibold mt-6 block">Guest-friendly execution</span>
          </div>
        </div>
      </div>
    </section>
  );
}
