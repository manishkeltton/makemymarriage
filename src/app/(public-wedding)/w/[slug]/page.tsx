import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { WeddingSiteService } from "@/modules/website/services/wedding-site.service";
import { PublicWeddingSiteDTO } from "@/modules/website/dto/wedding-site.dto";
import { buildYouTubeEmbedUrl } from "@/modules/website/utils/livestream";

interface PublicWebsitePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PublicWebsitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await WeddingSiteService.getPublicSiteBySlug(slug);

  if (!result.success || !result.data) {
    return {
      title: "Wedding Website Not Found | MakeMyMarriage",
      description: "The requested wedding website could not be found or is not currently published.",
      robots: { index: false, follow: false },
    };
  }

  const site = result.data;
  const title = site.seo?.title || `${site.wedding.title} — Wedding Website`;
  const description =
    site.seo?.description || `Join us in celebrating the wedding of ${site.wedding.title}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    robots: {
      index: !site.seo?.noIndex,
      follow: !site.seo?.noIndex,
    },
  };
}

export default async function PublicWebsitePage({ params }: PublicWebsitePageProps) {
  const { slug } = await params;
  const result = await WeddingSiteService.getPublicSiteBySlug(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const data: PublicWeddingSiteDTO = result.data;
  const { theme, style, sections, wedding, events } = data;
  const weddingTitle = wedding.title;
  const brideName = wedding.brideName || "Bride";
  const groomName = wedding.groomName || "Groom";
  const primaryWeddingDate = wedding.primaryWeddingDate;
  const generalLocation = wedding.generalLocation?.city || "Jaipur, Rajasthan";

  const primaryColor = style?.primaryColor || "#D4AF37";
  const fontFamily = style?.fontFamily || "Playfair Display";

  return (
    <div
      className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-stone-950 font-serif"
      style={{ fontFamily: `${fontFamily}, serif` }}
    >
      {/* Header Bar */}
      <header className="px-6 py-5 border-b border-stone-800/80 flex items-center justify-between sticky top-0 bg-stone-950/90 backdrop-blur-md z-40">
        <span className="font-serif font-bold tracking-wider text-amber-400 text-xl">
          {weddingTitle}
        </span>
        <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">
          {theme.replace("_", " ")}
        </span>
      </header>

      {/* Main Sections */}
      <main className="divide-y divide-stone-800/50">
        {sections
          .filter((s) => s.enabled)
          .sort((a, b) => a.order - b.order)
          .map((sec) => (
            <section key={sec.id} className="py-16 px-6 max-w-4xl mx-auto text-center">
              {sec.type === "HERO" && (
                <div className="space-y-6 py-12">
                  {sec.config.coverImageUrl ? (
                    <div className="w-full h-80 sm:h-[450px] rounded-3xl overflow-hidden mb-8 border border-stone-800 shadow-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sec.config.coverImageUrl as string}
                        alt="Hero Cover"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null}
                  <h1
                    className="text-4xl sm:text-6xl font-extrabold tracking-tight font-serif"
                    style={{ color: primaryColor }}
                  >
                    {String(sec.config.title || `${brideName} & ${groomName}`)}
                  </h1>
                  <p className="text-2xl text-stone-300 font-serif italic">
                    {String(sec.config.subtitle || "We Are Getting Married!")}
                  </p>
                  {sec.config.tagline ? (
                    <p className="text-base text-stone-400 max-w-xl mx-auto">
                      {String(sec.config.tagline)}
                    </p>
                  ) : null}

                  {primaryWeddingDate && (
                    <div className="inline-block mt-6 px-6 py-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-base font-mono shadow-lg">
                      📅 {new Date(primaryWeddingDate).toLocaleDateString("en-IN", { dateStyle: "full" })}
                    </div>
                  )}
                </div>
              )}

              {sec.type === "OUR_STORY" && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold font-serif text-amber-400">
                    {String(sec.config.title || "Our Love Story")}
                  </h2>
                  <p className="text-stone-300 text-base leading-relaxed max-w-2xl mx-auto font-sans">
                    {String(sec.config.storyText || "Every love story is beautiful, but ours is our favorite.")}
                  </p>
                  {sec.config.brideBio || sec.config.groomBio ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 text-left font-sans">
                      {sec.config.brideBio ? (
                        <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800 shadow-md">
                          <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">
                            {brideName}
                          </h4>
                          <p className="text-sm text-stone-300">{String(sec.config.brideBio)}</p>
                        </div>
                      ) : null}
                      {sec.config.groomBio ? (
                        <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800 shadow-md">
                          <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">
                            {groomName}
                          </h4>
                          <p className="text-sm text-stone-300">{String(sec.config.groomBio)}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}

              {sec.type === "SCHEDULE" && (
                <div className="space-y-8">
                  <h2 className="text-3xl font-bold font-serif text-amber-400">
                    {String(sec.config.title || "Wedding Ceremonies")}
                  </h2>
                  {sec.config.subtitle ? (
                    <p className="text-sm text-stone-400 font-sans">{String(sec.config.subtitle)}</p>
                  ) : null}

                  {events && events.length > 0 ? (
                    <div className="space-y-5 text-left font-sans">
                      {events.map((evt) => (
                        <div key={evt.id} className="p-6 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-lg">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <h3 className="font-serif font-bold text-xl text-amber-300">
                              {evt.name}
                            </h3>
                            <span className="text-xs px-3 py-1 rounded-full bg-stone-800 text-amber-300 font-mono self-start sm:self-auto">
                              {new Date(evt.startAt).toLocaleDateString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                            </span>
                          </div>
                          {evt.description && (
                            <p className="text-sm text-stone-400 mb-4">{evt.description}</p>
                          )}
                          {evt.venue && (
                            <div className="text-sm text-stone-300 flex items-center gap-2 font-sans pt-2 border-t border-stone-800">
                              <span className="material-symbols-outlined text-[18px] text-amber-400">location_on</span>
                              <span className="font-medium">
                                {evt.venue.name || "Venue"} {evt.venue.city ? `• ${evt.venue.city}` : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-stone-500 italic font-sans">No ceremonies scheduled yet.</p>
                  )}
                </div>
              )}

              {sec.type === "LIVESTREAM" && (() => {
                const embedUrl = buildYouTubeEmbedUrl(sec.config.youtubeUrl as string || sec.config.youtubeVideoId as string);
                return (
                  <div className="space-y-6">
                    <h2 className="text-3xl font-bold font-serif text-amber-400">
                      {String(sec.config.title || "Live Stream")}
                    </h2>
                    <p className="text-sm text-stone-300 font-sans max-w-xl mx-auto">
                      {String(sec.config.description || "Watch our wedding ceremonies live from anywhere in the world.")}
                    </p>
                    {embedUrl ? (
                      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-stone-800 shadow-2xl bg-stone-900 mt-4">
                        <iframe
                          src={embedUrl}
                          title="YouTube Wedding Livestream"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-stone-400 font-sans text-sm italic">
                        Livestream link not configured yet. Check back closer to the ceremony!
                      </div>
                    )}
                  </div>
                );
              })()}

              {sec.type === "VENUE" && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold font-serif text-amber-400">
                    {String(sec.config.title || "Venue & Location")}
                  </h2>
                  <p className="text-base text-stone-300 max-w-xl mx-auto font-sans leading-relaxed">
                    {String(sec.config.description || generalLocation || "Jaipur, Rajasthan")}
                  </p>
                </div>
              )}

              {sec.type === "DRESS_CODE" && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold font-serif text-amber-400">
                    {String(sec.config.title || "Dress Code")}
                  </h2>
                  <p className="text-base text-stone-300 max-w-xl mx-auto font-sans leading-relaxed">
                    {String(sec.config.description || "Traditional Ethnic / Royal Attire.")}
                  </p>
                </div>
              )}

              {sec.type === "RSVP_CTA" && (
                <div className="py-10 px-6 rounded-3xl bg-gradient-to-b from-amber-950/30 to-stone-900 border border-amber-500/30 space-y-4 shadow-xl">
                  <h2 className="text-2xl sm:text-3xl font-bold font-serif text-amber-400">
                    {(sec.config.title as string) || "RSVP & Attendance"}
                  </h2>
                  <p className="text-sm text-stone-300 max-w-lg mx-auto font-sans leading-relaxed">
                    {String(sec.config.description ||
                      "Please use your personal digital invitation link sent to your email or WhatsApp to confirm your household attendance.")}
                  </p>
                  <div className="pt-2 font-sans">
                    <span className="inline-block px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                      Please check your household email for your digital RSVP link
                    </span>
                  </div>
                </div>
              )}
            </section>
          ))}
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-stone-800 text-center text-xs text-stone-500 font-sans">
        <p>© {new Date().getFullYear()} {weddingTitle}. Powered by MakeMyMarriage.</p>
      </footer>
    </div>
  );
}
