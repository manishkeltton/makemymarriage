"use client";

import React, { useEffect, useState, use } from "react";
import { AlbumDTO, MediaDTO } from "@/modules/media/dto/media.dto";

interface PageProps {
  params: Promise<{ weddingId: string }>;
}

export default function GalleryPage({ params }: PageProps) {
  const { weddingId } = use(params);

  const [activeTab, setActiveTab] = useState<"photos" | "albums" | "moderation">("photos");
  const [albums, setAlbums] = useState<AlbumDTO[]>([]);
  const [mediaList, setMediaList] = useState<MediaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");

  // Modals state
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AlbumDTO | null>(null);
  const [albumName, setAlbumName] = useState("");
  const [albumDesc, setAlbumDesc] = useState("");
  const [albumVisibility, setAlbumVisibility] = useState<"GUESTS" | "PUBLIC" | "PRIVATE">("GUESTS");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAlbumId, setUploadAlbumId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const [lightboxItem, setLightboxItem] = useState<MediaDTO | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [albumsRes, mediaRes] = await Promise.all([
        fetch(`/api/v1/weddings/${weddingId}/albums`),
        fetch(`/api/v1/weddings/${weddingId}/media`),
      ]);

      if (albumsRes.ok) {
        const albumsJson = await albumsRes.json();
        if (albumsJson.success) setAlbums(albumsJson.data);
      }

      if (mediaRes.ok) {
        const mediaJson = await mediaRes.json();
        if (mediaJson.success) setMediaList(mediaJson.data);
      }
    } catch (err) {
      console.error("Failed to load gallery data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const [albumsRes, mediaRes] = await Promise.all([
          fetch(`/api/v1/weddings/${weddingId}/albums`),
          fetch(`/api/v1/weddings/${weddingId}/media`),
        ]);

        if (albumsRes.ok) {
          const albumsJson = await albumsRes.json();
          if (albumsJson.success && !ignore) setAlbums(albumsJson.data);
        }

        if (mediaRes.ok) {
          const mediaJson = await mediaRes.json();
          if (mediaJson.success && !ignore) setMediaList(mediaJson.data);
        }
      } catch (err) {
        console.error("Failed to load gallery data:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [weddingId]);

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumName.trim()) return;

    try {
      const url = editingAlbum
        ? `/api/v1/weddings/${weddingId}/albums/${editingAlbum.id}`
        : `/api/v1/weddings/${weddingId}/albums`;
      const method = editingAlbum ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: albumName,
          description: albumDesc,
          visibility: albumVisibility,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowAlbumModal(false);
        setEditingAlbum(null);
        setAlbumName("");
        setAlbumDesc("");
        fetchData();
      } else {
        alert(json.error?.message || "Failed to save album");
      }
    } catch (err) {
      console.error("Save album error:", err);
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm("Are you sure you want to delete this album? Media items will be unlinked.")) return;
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/albums/${albumId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Delete album error:", err);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadProgress("Creating upload intent...");

    try {
      const isVideo = uploadFile.type.startsWith("video/");
      const isAudio = uploadFile.type.startsWith("audio/");
      const mediaType = isVideo ? "VIDEO" : isAudio ? "AUDIO" : "IMAGE";

      // 1. Get Presigned Upload Intent
      const intentRes = await fetch(`/api/v1/weddings/${weddingId}/media/upload-intents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalFilename: uploadFile.name,
          mimeType: uploadFile.type || "application/octet-stream",
          sizeBytes: uploadFile.size,
          mediaType,
          albumId: uploadAlbumId || undefined,
        }),
      });

      const intentJson = await intentRes.json();
      if (!intentJson.success) {
        alert(intentJson.error?.message || "Failed to get upload intent");
        return;
      }

      const { media, uploadUrl, uploadKey } = intentJson.data;

      // 2. Upload direct to R2 / Storage Service
      setUploadProgress("Uploading file...");
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": uploadFile.type || "application/octet-stream",
          "Content-Length": uploadFile.size.toString(),
        },
        body: uploadFile,
      });

      if (!putRes.ok) {
        alert("Direct storage upload failed. Please try again.");
        return;
      }

      // 3. Complete Upload & Seal Key
      setUploadProgress("Verifying upload...");
      const completeRes = await fetch(`/api/v1/weddings/${weddingId}/media/${media.id}/complete`, {
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
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadAlbumId("");
        fetchData();
      } else {
        alert(completeJson.error?.message || "Verification failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("An unexpected upload error occurred.");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const handleModerate = async (mediaId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/media/${mediaId}/${action}`, {
        method: "POST",
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Moderation error:", err);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm("Are you sure you want to delete this media item?")) return;
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/media/${mediaId}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Delete media error:", err);
    }
  };

  const approvedMedia = mediaList.filter((m) => m.status === "APPROVED" || m.status === "UPLOADED");
  const pendingMedia = mediaList.filter((m) => m.status === "PENDING_APPROVAL");

  const filteredPhotos = selectedAlbumId
    ? approvedMedia.filter((m) => m.albumId === selectedAlbumId)
    : approvedMedia;

  return (
    <div className="space-y-space-md p-space-md max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-2xl border border-surface-container-high/60 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary font-headline">Gallery &amp; Media Vault</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Organize ceremony photos, manage guest photo submissions, and moderate pending uploads.
          </p>
        </div>
        <div className="flex items-center gap-space-xs">
          <button
            type="button"
            onClick={() => {
              setEditingAlbum(null);
              setAlbumName("");
              setAlbumDesc("");
              setAlbumVisibility("GUESTS");
              setShowAlbumModal(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-surface-container-high bg-surface text-on-surface hover:bg-surface-container text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
            New Album
          </button>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 rounded-xl bg-primary-container text-on-primary hover:opacity-95 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
            Upload Media
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-surface-container-high">
        <div className="flex gap-space-md">
          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "photos"
                ? "border-primary-container text-primary-container font-bold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">photo_library</span>
            Photos &amp; Videos ({approvedMedia.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("albums")}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "albums"
                ? "border-primary-container text-primary-container font-bold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">folder</span>
            Albums ({albums.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("moderation")}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors relative ${
              activeTab === "moderation"
                ? "border-primary-container text-primary-container font-bold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            Moderation Queue
            {pendingMedia.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingMedia.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "photos" && albums.length > 0 && (
          <select
            value={selectedAlbumId}
            onChange={(e) => setSelectedAlbumId(e.target.value)}
            className="text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-1.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
          >
            <option value="">All Albums</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[32px] animate-spin text-primary-container">progress_activity</span>
          Loading gallery items...
        </div>
      ) : activeTab === "photos" ? (
        filteredPhotos.length === 0 ? (
          <div className="py-16 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-surface-container-high p-space-md">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/50">photo_library</span>
            <h3 className="text-sm font-semibold text-on-surface mt-2">No Media Uploaded Yet</h3>
            <p className="text-xs text-on-surface-variant mt-1">Upload high-resolution photos or videos to start building your gallery.</p>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="mt-4 px-4 py-2 bg-primary-container text-on-primary rounded-xl text-xs font-semibold"
            >
              Upload First Media
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-space-sm">
            {filteredPhotos.map((item) => (
              <div
                key={item.id}
                className="group relative bg-surface-container-lowest rounded-xl overflow-hidden border border-surface-container-high shadow-2xs hover:shadow-md transition-all aspect-square flex items-center justify-center bg-stone-900/5 cursor-pointer"
              >
                {item.mediaType === "IMAGE" && item.accessUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.accessUrl}
                    alt={item.originalFilename}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onClick={() => setLightboxItem(item)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 p-2 text-center" onClick={() => setLightboxItem(item)}>
                    <span className="material-symbols-outlined text-[36px] text-primary">
                      {item.mediaType === "VIDEO" ? "movie" : "audiotrack"}
                    </span>
                    <span className="text-[10px] font-medium text-on-surface line-clamp-1">{item.originalFilename}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-1.5 gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMedia(item.id);
                    }}
                    className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs"
                    title="Delete Media"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === "albums" ? (
        albums.length === 0 ? (
          <div className="py-16 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-surface-container-high p-space-md">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/50">create_new_folder</span>
            <h3 className="text-sm font-semibold text-on-surface mt-2">No Albums Created</h3>
            <p className="text-xs text-on-surface-variant mt-1">Create thematic albums for Sangeet, Mehendi, Haldi, or Reception photos.</p>
            <button
              type="button"
              onClick={() => {
                setEditingAlbum(null);
                setAlbumName("");
                setAlbumDesc("");
                setAlbumVisibility("GUESTS");
                setShowAlbumModal(true);
              }}
              className="mt-4 px-4 py-2 bg-primary-container text-on-primary rounded-xl text-xs font-semibold"
            >
              Create First Album
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-space-md">
            {albums.map((album) => (
              <div
                key={album.id}
                className="bg-surface-container-lowest rounded-2xl p-space-md border border-surface-container-high shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="material-symbols-outlined text-[28px] text-primary-container">folder_special</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant uppercase tracking-wider">
                      {album.visibility}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-on-surface mt-3">{album.name}</h3>
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{album.description || "No description provided."}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-surface-container-high flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="font-semibold">{album.itemCount || 0} media items</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAlbum(album);
                        setAlbumName(album.name);
                        setAlbumDesc(album.description || "");
                        setAlbumVisibility(album.visibility);
                        setShowAlbumModal(true);
                      }}
                      className="p-1 rounded hover:bg-surface-container text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAlbum(album.id)}
                      className="p-1 rounded hover:bg-rose-100 text-rose-600"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Moderation Queue Tab */
        pendingMedia.length === 0 ? (
          <div className="py-16 text-center bg-surface-container-lowest rounded-2xl border border-surface-container-high p-space-md">
            <span className="material-symbols-outlined text-[48px] text-emerald-600/60">verified</span>
            <h3 className="text-sm font-semibold text-on-surface mt-2">Moderation Queue Clear</h3>
            <p className="text-xs text-on-surface-variant mt-1">All guest photo and video uploads have been reviewed and approved!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-space-md">
            {pendingMedia.map((item) => (
              <div
                key={item.id}
                className="bg-surface-container-lowest rounded-2xl p-space-md border border-amber-200 bg-amber-50/20 shadow-2xs space-y-3"
              >
                <div className="aspect-video bg-stone-900/10 rounded-xl overflow-hidden flex items-center justify-center">
                  {item.mediaType === "IMAGE" && item.accessUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.accessUrl} alt={item.originalFilename} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[36px] text-primary">{item.mediaType === "VIDEO" ? "movie" : "audiotrack"}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface truncate">{item.originalFilename}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 uppercase">Pending</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Uploaded by Guest Household ({item.uploadedByHouseholdId || "Guest"})
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-surface-container-high">
                  <button
                    type="button"
                    onClick={() => handleModerate(item.id, "approve")}
                    className="flex-1 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModerate(item.id, "reject")}
                    className="flex-1 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Album Form Modal */}
      {showAlbumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-space-md border border-surface-container-high shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-on-surface">{editingAlbum ? "Edit Album" : "Create New Album"}</h2>
            <form onSubmit={handleSaveAlbum} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Album Name *</label>
                <input
                  type="text"
                  required
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  placeholder="e.g. Sangeet Night Highlights"
                  className="w-full text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Description</label>
                <textarea
                  rows={3}
                  value={albumDesc}
                  onChange={(e) => setAlbumDesc(e.target.value)}
                  placeholder="Brief description of photos in this album..."
                  className="w-full text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Visibility</label>
                <select
                  value={albumVisibility}
                  onChange={(e) => setAlbumVisibility(e.target.value as "GUESTS" | "PUBLIC" | "PRIVATE")}
                  className="w-full text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                >
                  <option value="GUESTS">Invited Guests Only</option>
                  <option value="PUBLIC">Public (Website &amp; Guests)</option>
                  <option value="PRIVATE">Organisers Only (Private)</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAlbumModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95"
                >
                  Save Album
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Media Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-space-md border border-surface-container-high shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-on-surface">Upload Photo / Video</h2>
            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Select File *</label>
                <input
                  type="file"
                  required
                  accept="image/*,video/*,audio/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-on-surface file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-surface-container file:text-xs file:font-semibold"
                />
              </div>
              {albums.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Album (Optional)</label>
                  <select
                    value={uploadAlbumId}
                    onChange={(e) => setUploadAlbumId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  >
                    <option value="">No Album (Unsorted)</option>
                    {albums.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {uploading && (
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs font-medium text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  {uploadProgress}
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-surface-container disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-4 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95 disabled:opacity-50"
                >
                  Upload Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md" onClick={() => setLightboxItem(null)}>
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxItem(null)}
              className="absolute -top-10 right-0 p-1.5 text-white hover:text-stone-300"
            >
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>
            {lightboxItem.mediaType === "IMAGE" && lightboxItem.accessUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={lightboxItem.accessUrl} alt={lightboxItem.originalFilename} className="max-w-full max-h-[80vh] rounded-xl object-contain" />
            ) : lightboxItem.mediaType === "VIDEO" && lightboxItem.accessUrl ? (
              <video src={lightboxItem.accessUrl} controls className="max-w-full max-h-[80vh] rounded-xl" />
            ) : (
              <div className="p-8 bg-surface-container-lowest rounded-xl text-center text-on-surface">
                <p className="text-sm font-semibold">{lightboxItem.originalFilename}</p>
                {lightboxItem.accessUrl && (
                  <a href={lightboxItem.accessUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block px-4 py-2 bg-primary-container text-on-primary rounded-xl text-xs font-semibold">
                    Download File
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
