import React from "react";
import Image from "next/image";

export function GalleryFeatures() {
  return (
    <section className="w-full bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12">
          <span className="font-label-md text-label-md uppercase tracking-wider text-primary-container font-semibold block mb-2">Ceremonial Media Hub</span>
          <h2 className="font-headline-lg text-headline-lg sm:text-[34px] text-on-surface font-bold tracking-tight mb-3">
            Keep the memories together too.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            A centralized space where family and guests can upload high-resolution photos, record voice notes, and sign your digital guestbook — with zero app download or account creation needed.
          </p>
        </div>

        {/* Masonry Media & Wishes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Photo 1 */}
          <div className="rounded-xl overflow-hidden bg-surface-container-lowest shadow-sm">
            <div className="h-52 w-full relative overflow-hidden">
              <Image 
                alt="Artistic close-up photograph of delicate bridal henna mehendi applied on hands with intricate Indian floral patterns and natural warm lighting" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC531GNvSaTaLLMfZwnB8_j9XiXkOg9OH2Hkq8rv-cGAgcyPOAN4mLOHs3qSM9smHFdj8-UIeSnVehwQ0NWAfVM65CISmc9-XPBAaaUGEzAe1MGLhurS1gezbFPG0mcTHCHQ1cYebfx834pVXNfqofePyy0BSxaZ7CndS5RSaJHCPIMseebFobnQzFTqxylFrpFoLGLSLegH3XXm5ej6AkgGt628kEzGqG3q2r_Yz_xJGrlx3KAjqfd"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-primary-container font-semibold">Mehendi Album</span>
              <span className="text-on-surface-variant font-label-sm text-label-sm">Uploaded by Sneha</span>
            </div>
          </div>

          {/* Voice Wish Card */}
          <div className="rounded-xl bg-surface-container-lowest shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span aria-hidden="true" className="material-symbols-outlined text-primary-container text-[20px]">mic</span>
                <span className="font-headline-sm text-body-sm text-on-surface">Voice Blessing</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 italic">
                &quot;Aarav and Meera, wishing you both a lifetime of laughter, joy and unconditional love from London...&quot;
              </p>
            </div>
            <div className="p-2.5 bg-surface-container-low rounded flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface font-medium">Dadi & Dada Ji</span>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">0:48s</span>
            </div>
          </div>

          {/* Photo 2 */}
          <div className="rounded-xl overflow-hidden bg-surface-container-lowest shadow-sm">
            <div className="h-52 w-full relative overflow-hidden">
              <Image 
                alt="Candid moment of laughter and celebration during haldi ceremony with yellow marigold petals flying in warm sunlight" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDel5qgD8yOtaJSETDkhT5zt7Hv9NldWb6dANx5ugOXymuIxc-pxTiNBlDEtpCBo0TOmBL4GeiYwv_D6eQOiHtE1_pF2-EIrhCRvHJW2bl03rrV-I6kOEfwG39HHdV0IaTApHOEEndmxsEwSvr-jdbCAZw_LAxcNjA9KeKkAxFqtaC4ydzcxoXMn_1NbzBE_Xv90328VT3mEjO3ugoiZlAiygSXKwCqfKnBfayMSQJrZRC3gGq9PhBA"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-primary-container font-semibold">Haldi Moments</span>
              <span className="text-on-surface-variant font-label-sm text-label-sm">34 photos added</span>
            </div>
          </div>

          {/* Guestbook Wish Card */}
          <div className="rounded-xl bg-surface-container-lowest shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span aria-hidden="true" className="material-symbols-outlined text-secondary text-[20px]">edit_note</span>
                <span className="font-headline-sm text-body-sm text-on-surface">Guestbook Entry</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                &quot;The most organized and joyous Indian wedding we have ever attended! Can&apos;t wait for Sangeet tonight.&quot;
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">Kavita Chachi</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">2h ago</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
