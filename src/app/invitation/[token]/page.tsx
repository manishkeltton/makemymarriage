"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { PublicGuestAccessDTO } from "@/modules/guests/dto/guest.dto";
import { PublicMediaDTO, PublicAlbumDTO } from "@/modules/media/dto/media.dto";
import { PublicGuestbookEntryDTO } from "@/modules/guestbook/dto/guestbook.dto";

interface PublicInvitationPageProps {
  params: Promise<{ token: string }>;
}

export default function PublicInvitationPage({ params }: PublicInvitationPageProps) {
  const { token } = use(params);

  const [data, setData] = useState<PublicGuestAccessDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"rsvp" | "gallery" | "guestbook" | "contacts">("rsvp");

  // RSVP Form State
  const [selectedStatus, setSelectedStatus] = useState<"ATTENDING" | "NOT_ATTENDING">("ATTENDING");
  const [attendingCount, setAttendingCount] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Gallery State
  const [albums, setAlbums] = useState<PublicAlbumDTO[]>([]);
  const [galleryMedia, setGalleryMedia] = useState<PublicMediaDTO[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Guestbook State
  const [guestbookEntries, setGuestbookEntries] = useState<PublicGuestbookEntryDTO[]>([]);
  const [guestbookLoading, setGuestbookLoading] = useState(false);
  const [wishText, setWishText] = useState("");
  const [wishSubmitting, setWishSubmitting] = useState(false);
  const [wishSuccess, setWishSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchInvitation = async () => {
      try {
        const res = await fetch(`/api/v1/public/guest-access/${token}`, {
          cache: "no-store",
        });
        const result = await res.json();

        if (isMounted) {
          if (res.ok && result.success && result.data) {
            setData(result.data);
            setSelectedStatus(
              result.data.rsvp?.status === "NOT_ATTENDING" ? "NOT_ATTENDING" : "ATTENDING"
            );
            setAttendingCount(
              result.data.rsvp?.attendingCount && result.data.rsvp.attendingCount > 0
                ? result.data.rsvp.attendingCount
                : result.data.totalInvited || 1
            );
          } else {
            setError(result.error?.message || "Invitation link is invalid, expired, or revoked.");
          }
        }
      } catch (err: unknown) {
        console.error("Error fetching invitation:", err);
        if (isMounted) setError("Unable to load invitation details.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchInvitation();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const fetchGallery = async () => {
    setGalleryLoading(true);
    try {
      const res = await fetch(`/api/v1/public/guest-access/${token}/gallery`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAlbums(json.data.albums || []);
          setGalleryMedia(json.data.media || []);
        }
      }
    } catch (err) {
      console.error("Fetch gallery error:", err);
    } finally {
      setGalleryLoading(false);
    }
  };

  const fetchGuestbook = async () => {
    setGuestbookLoading(true);
    try {
      const res = await fetch(`/api/v1/public/guest-access/${token}/guestbook`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setGuestbookEntries(json.data);
      }
    } catch (err) {
      console.error("Fetch guestbook error:", err);
    } finally {
      setGuestbookLoading(false);
    }
  };

  // Fetch Gallery or Guestbook when switching tabs
  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      if (activeTab === "gallery" && data?.galleryAccess) {
        setGalleryLoading(true);
        try {
          const res = await fetch(`/api/v1/public/guest-access/${token}/gallery`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && !ignore) {
              setAlbums(json.data.albums || []);
              setGalleryMedia(json.data.media || []);
            }
          }
        } catch (err) {
          console.error("Fetch gallery error:", err);
        } finally {
          if (!ignore) setGalleryLoading(false);
        }
      } else if (activeTab === "guestbook") {
        setGuestbookLoading(true);
        try {
          const res = await fetch(`/api/v1/public/guest-access/${token}/guestbook`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && !ignore) setGuestbookEntries(json.data);
          }
        } catch (err) {
          console.error("Fetch guestbook error:", err);
        } finally {
          if (!ignore) setGuestbookLoading(false);
        }
      }
    };
    void loadData();
    return () => {
      ignore = true;
    };
  }, [activeTab, data, token]);

  const handleSubmitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        status: selectedStatus,
        attendingCount: selectedStatus === "ATTENDING" ? attendingCount : 0,
      };

      const res = await fetch(`/api/v1/public/guest-access/${token}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok && result.success && result.data) {
        setData(result.data);
        setSubmittedSuccess(true);
      } else {
        setError(result.error?.message || "Failed to submit RSVP response.");
      }
    } catch (err: unknown) {
      console.error("Error submitting RSVP:", err);
      setError("Failed to submit RSVP response.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadSuccess(false);

    try {
      const isVideo = uploadFile.type.startsWith("video/");
      const isAudio = uploadFile.type.startsWith("audio/");
      const mediaType = isVideo ? "VIDEO" : isAudio ? "AUDIO" : "IMAGE";

      // 1. Get Intent
      const intentRes = await fetch(`/api/v1/public/guest-access/${token}/media/upload-intents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalFilename: uploadFile.name,
          mimeType: uploadFile.type || "application/octet-stream",
          sizeBytes: uploadFile.size,
          mediaType,
        }),
      });

      const intentJson = await intentRes.json();
      if (!intentJson.success) {
        alert(intentJson.error?.message || "Upload intent failed");
        return;
      }

      const { media, uploadUrl, uploadKey } = intentJson.data;

      // 2. Direct R2 Upload
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": uploadFile.type || "application/octet-stream",
          "Content-Length": uploadFile.size.toString(),
        },
        body: uploadFile,
      });

      if (!putRes.ok) {
        alert("Direct upload failed.");
        return;
      }

      // 3. Complete
      const completeRes = await fetch(`/api/v1/public/guest-access/${token}/media/${media.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadKey,
          objectKey: media.objectKey,
          mimeType: media.mimeType,
          sizeBytes: media.sizeBytes,
        }),
      });

      const completeJson = await completeRes.json();
      if (completeJson.success) {
        setUploadSuccess(true);
        setUploadFile(null);
        fetchGallery();
      } else {
        alert(completeJson.error?.message || "Verification failed");
      }
    } catch (err) {
      console.error("Guest upload error:", err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishText.trim() || !data) return;

    setWishSubmitting(true);
    setWishSuccess(false);

    try {
      const res = await fetch(`/api/v1/public/guest-access/${token}/guestbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: data.householdName,
          type: "TEXT",
          text: wishText,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setWishSuccess(true);
        setWishText("");
        fetchGuestbook();
      } else {
        alert(json.error?.message || "Failed to submit wish");
      }
    } catch (err) {
      console.error("Submit wish error:", err);
    } finally {
      setWishSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
          <span className="text-base font-medium">Opening your wedding invitation...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface-container-low flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-3xl shadow-xl border border-surface-container-high text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto text-3xl">
            <span className="material-symbols-outlined">link_off</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-on-surface">Invitation Access Issue</h2>
          <p className="text-sm text-on-surface-variant">
            {error || "The invitation link is invalid, expired, or has been revoked."}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-md"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const coupleTitle =
    data.wedding.brideName && data.wedding.groomName
      ? `${data.wedding.brideName} & ${data.wedding.groomName}`
      : data.wedding.title;

  return (
    <div className="min-h-screen bg-surface-container-low py-8 sm:py-12 px-4 flex flex-col items-center">
      {/* Container Card */}
      <div className="max-w-2xl w-full bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container-high overflow-hidden animate-in fade-in duration-300">
        {/* Header Hero */}
        <div className="bg-gradient-to-b from-primary/15 via-primary-container/20 to-surface-container-lowest p-6 sm:p-8 text-center space-y-3 border-b border-surface-container-high">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-container/50 text-on-primary-container text-xs font-bold uppercase tracking-widest">
            Wedding Invitation
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-on-surface tracking-tight">
            {coupleTitle}
          </h1>

          {data.wedding.primaryWeddingDate && (
            <p className="text-sm font-medium text-primary flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-base">calendar_month</span>
              {new Date(data.wedding.primaryWeddingDate).toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}

          {(data.wedding.locationName || data.wedding.cityName) && (
            <p className="text-xs text-on-surface-variant flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-sm">location_on</span>
              {[data.wedding.locationName, data.wedding.cityName].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        {/* Guest Household Banner */}
        <div className="p-4 bg-surface-container-low border-b border-surface-container-high text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Cordially Invited</p>
          <h2 className="text-xl font-bold font-serif text-on-surface">{data.householdName}</h2>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-surface-container-high bg-surface-container-lowest">
          <button
            type="button"
            onClick={() => setActiveTab("rsvp")}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "rsvp" ? "border-primary text-primary" : "border-transparent text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            RSVP
          </button>
          {data.galleryAccess && (
            <button
              type="button"
              onClick={() => setActiveTab("gallery")}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === "gallery" ? "border-primary text-primary" : "border-transparent text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              Gallery &amp; Uploads
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab("guestbook")}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "guestbook" ? "border-primary text-primary" : "border-transparent text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
            Wishes
          </button>
        </div>

        {/* Tab 1: RSVP */}
        {activeTab === "rsvp" && (
          <div className="p-6 sm:p-8 space-y-6">
            {submittedSuccess && (
              <div className="p-4 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 rounded-2xl text-sm font-medium text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <p className="font-bold text-base font-serif">Thank You!</p>
                <p className="text-xs">Your RSVP response has been recorded successfully.</p>
              </div>
            )}

            <form onSubmit={handleSubmitRsvp} className="space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant text-center">
                Please Confirm Your Presence
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedStatus === "ATTENDING"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm"
                      : "border-outline/30 bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  <input
                    type="radio"
                    name="rsvpStatus"
                    value="ATTENDING"
                    checked={selectedStatus === "ATTENDING"}
                    onChange={() => setSelectedStatus("ATTENDING")}
                    className="sr-only"
                  />
                  <span className="material-symbols-outlined text-2xl text-emerald-600 mb-1">check_circle</span>
                  <span className="font-bold text-xs">Joyfully Accepts</span>
                </label>

                <label
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedStatus === "NOT_ATTENDING"
                      ? "border-error bg-error-container/40 text-on-error-container shadow-sm"
                      : "border-outline/30 bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  <input
                    type="radio"
                    name="rsvpStatus"
                    value="NOT_ATTENDING"
                    checked={selectedStatus === "NOT_ATTENDING"}
                    onChange={() => setSelectedStatus("NOT_ATTENDING")}
                    className="sr-only"
                  />
                  <span className="material-symbols-outlined text-2xl text-error mb-1">cancel</span>
                  <span className="font-bold text-xs">Regretfully Declines</span>
                </label>
              </div>

              {selectedStatus === "ATTENDING" && (
                <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-container space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Number of Guests Attending *
                  </label>
                  <select
                    value={attendingCount}
                    onChange={(e) => setAttendingCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline/30 rounded-xl text-on-surface font-bold text-xs"
                  >
                    {Array.from({ length: data.totalInvited }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} Guest{n > 1 ? "s" : ""} (Max {data.totalInvited})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-95 transition-all shadow-md disabled:opacity-50"
              >
                {submitting ? "Submitting..." : submittedSuccess ? "Update RSVP Response" : "Submit RSVP Response"}
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Gallery & Guest Uploads */}
        {activeTab === "gallery" && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Upload Box */}
            <form onSubmit={handleGuestUpload} className="p-4 bg-surface-container-low rounded-2xl border border-surface-container space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface text-center">Share Your Photos &amp; Videos</h3>
              <p className="text-xs text-on-surface-variant text-center">Upload memories to the official wedding gallery.</p>
              <input
                type="file"
                accept="image/*,video/*"
                required
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-on-surface file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-primary-container file:text-on-primary file:text-xs file:font-semibold"
              />
              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="w-full py-2.5 bg-primary-container text-on-primary font-bold text-xs rounded-xl hover:opacity-95 disabled:opacity-50"
              >
                {uploading ? "Uploading Memory..." : "Upload Photo / Video"}
              </button>
              {uploadSuccess && (
                <p className="text-xs text-emerald-600 font-bold text-center">Photo uploaded successfully! Pending organiser approval.</p>
              )}
            </form>

            {/* Gallery Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Wedding Memories</h4>
                {albums.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {albums.map((a) => (
                      <span key={a.id} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {a.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {galleryLoading ? (
                <div className="py-8 text-center text-xs text-on-surface-variant">Loading gallery photos...</div>
              ) : galleryMedia.length === 0 ? (
                <div className="py-8 text-center text-xs text-on-surface-variant">No public photos uploaded yet. Be the first to share!</div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {galleryMedia.map((m) => (
                    <div key={m.id} className="aspect-square bg-stone-900/10 rounded-xl overflow-hidden">
                      {m.mediaType === "IMAGE" && m.accessUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={m.accessUrl} alt={m.originalFilename} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-200">
                          <span className="material-symbols-outlined text-[24px]">movie</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Guestbook Wishes */}
        {activeTab === "guestbook" && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Wish Submission Form */}
            <form onSubmit={handleSubmitWish} className="p-4 bg-surface-container-low rounded-2xl border border-surface-container space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface text-center">Send Your Wishes</h3>
              <textarea
                rows={3}
                required
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                placeholder="Write your blessings and message for the bride and groom..."
                className="w-full text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={wishSubmitting || !wishText.trim()}
                className="w-full py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-95 disabled:opacity-50"
              >
                {wishSubmitting ? "Sending Wish..." : "Send Warm Wishes"}
              </button>
              {wishSuccess && (
                <p className="text-xs text-emerald-600 font-bold text-center">Your wish has been submitted for review!</p>
              )}
            </form>

            {/* Approved Wishes List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">Guest Wishes</h4>
              {guestbookLoading ? (
                <div className="py-8 text-center text-xs text-on-surface-variant">Loading guest wishes...</div>
              ) : guestbookEntries.length === 0 ? (
                <div className="py-8 text-center text-xs text-on-surface-variant">No approved wishes yet. Leave a wish for the couple above!</div>
              ) : (
                <div className="space-y-3">
                  {guestbookEntries.map((w) => (
                    <div key={w.id} className="p-3 bg-surface-container-low rounded-xl border border-surface-container space-y-1">
                      <p className="text-xs font-bold text-on-surface">{w.guestName}</p>
                      {w.text && <p className="text-xs text-on-surface-variant italic">&ldquo;{w.text}&rdquo;</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-surface-container-low border-t border-surface-container-high text-center">
          <p className="text-[11px] text-on-surface-variant font-serif">
            Powered by Make My Marriage — Premier Wedding Management Platform
          </p>
        </div>
      </div>
    </div>
  );
}
