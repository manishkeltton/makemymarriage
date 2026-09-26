# Make My Marriage — Milestone 10: Wedding Experience

Last updated: 2026-09-26

This document details the architecture, models, APIs, security rules, moderation controls, guest invitation experience, YouTube livestream handling, emergency contacts, website integrations, and verification suite for **Milestone 6 — Wedding Experience**.

---

## 1. Overview & Scope

The Wedding Experience module powers photo and video gallery management, guest media uploads, guestbook wishes, YouTube livestream rendering, emergency contacts, and public invitation & website integrations.

### In-Scope
1. **Albums & Gallery Management:** Album CRUD, visibility levels (`GUESTS`, `PUBLIC`, `PRIVATE`), ceremony/event linking, cover preview, and photo/video grid.
2. **Authorised Organiser Uploads:** Presigned R2 upload URLs (300s expiry), upload completion verification via ETag & metadata checks (`verifyAndSeal`), signed access URLs with bounded 60-second lifetime.
3. **Guest Access & Uploads via Token:** Invitation token lookup, verification of `GuestHousehold.galleryAccess`, guest upload intent, file metadata checks, initial `PENDING_APPROVAL` status.
4. **Moderation Queue & Controls:** Organiser feed for reviewing pending guest uploads and guestbook wishes, approve/reject state transitions, strict filtering of unapproved media from public/guest endpoints.
5. **Guestbook Wishes:** Submission of text, audio, and video wishes through invitation links, initial `PENDING` review status, organiser moderation, public/invitation display of approved wishes.
6. **YouTube Livestream Integrations:** Safe parsing of YouTube video URLs/IDs, regex validation (`^[a-zA-Z0-9_-]{11}$`), and sanitized iframe rendering (`https://www.youtube.com/embed/...`) without arbitrary script or iframe injection.
7. **Emergency Contacts & Issues:** Prioritized contact directory with name, role, phone, email, event linking, and public DTO allowlists that strip internal organiser notes (`notes`).
8. **Digital Invitation & Website Integrations:** Public digital invitation page (`/invitation/[token]`) tabs for Gallery, Guestbook, and Event Contacts. Website builder support for livestream, gallery, guestbook, and emergency sections.
9. **Automated Testing Suite:** Unit and integration tests covering tenant isolation, upload verification, token revocation, moderation state transitions, YouTube URL parsing, and contact privacy.

---

## 2. Models & Database Schemas

### 2.1 `Media` (`media` collection)
Stores file metadata for objects in Cloudflare R2 (MongoDB does not store binary files).
- `weddingId` (ObjectId, ref: Wedding, index: true)
- `albumId` (ObjectId, optional, ref: Album, index: true)
- `objectKey` (string, unique)
- `originalFilename` (string)
- `mimeType` (string)
- `sizeBytes` (number)
- `mediaType` (`IMAGE` | `VIDEO` | `AUDIO` | `DOCUMENT`)
- `visibility` (`PUBLIC` | `RESTRICTED` | `PRIVATE`)
- `status` (`PENDING_UPLOAD` | `UPLOADED` | `PENDING_APPROVAL` | `APPROVED` | `REJECTED`)
- `uploadedByType` (`MEMBER` | `GUEST`)
- `uploadedByUserId` (ObjectId, optional, ref: User)
- `uploadedByHouseholdId` (ObjectId, optional, ref: GuestHousehold)
- `createdAt`, `updatedAt` (Date)

### 2.2 `Album` (`albums` collection)
Stores metadata for gallery albums.
- `weddingId` (ObjectId, ref: Wedding, index: true)
- `eventId` (ObjectId, optional, ref: Event, index: true)
- `name` (string)
- `description` (string, optional)
- `visibility` (`GUESTS` | `PUBLIC` | `PRIVATE`)
- `createdBy` (ObjectId, ref: User)
- `createdAt`, `updatedAt` (Date)

### 2.3 `GuestbookEntry` (`guestbook_entries` collection)
Stores guest wishes and media attachments.
- `weddingId` (ObjectId, ref: Wedding, index: true)
- `householdId` (ObjectId, optional, ref: GuestHousehold, index: true)
- `guestName` (string)
- `type` (`TEXT` | `AUDIO` | `VIDEO`)
- `text` (string, optional)
- `mediaId` (ObjectId, optional, ref: Media)
- `status` (`PENDING` | `APPROVED` | `REJECTED`, index: true)
- `moderatedAt` (Date, optional)
- `moderatedBy` (ObjectId, optional, ref: User)
- `createdAt` (Date)

### 2.4 `EmergencyContact` (`emergency_contacts` collection)
Stores emergency contacts for events and wedding operations.
- `weddingId` (ObjectId, ref: Wedding, index: true)
- `eventId` (ObjectId, optional, ref: Event, index: true)
- `name` (string)
- `role` (string)
- `phone` (string, optional)
- `email` (string, optional)
- `priority` (number, default: 0, index: true)
- `notes` (string, optional - restricted to workspace members)
- `createdBy` (ObjectId, ref: User)
- `createdAt`, `updatedAt` (Date)

---

## 3. Security & Access Control Rules

1. **Tenant Isolation:** All operations enforce `weddingId` matching. Presigned upload URLs, media completions, access URL requests, guestbook submissions, and contact queries strictly enforce same-wedding boundary checks.
2. **Guest Token Verification:** Guest upload and guestbook endpoints require a raw invitation token. The token is hashed via SHA-256 and matched against `guest_access_tokens`. The associated `GuestHousehold` must exist and have `galleryAccess == true`. Revoked tokens return `HTTP 401 FORBIDDEN / ACCESS_REVOKED`.
3. **Short-Lived Signed URLs:** File delivery utilizes 60-second presigned GET URLs from Cloudflare R2 (`StorageService.accessUrl`). Pre-signed URLs expire quickly to prevent unauthorized sharing or caching of revoked content.
4. **Moderation Rules:** Guest uploads (`uploadedByType == "GUEST"`) and guestbook entries start in `PENDING_APPROVAL` / `PENDING` status. Unapproved items are strictly hidden from guest listing responses, website sections, and public media delivery handlers.
5. **Emergency Contact Privacy:** Public DTOs (`PublicEmergencyContactDTO`) filter out internal organiser notes (`notes`).

---

## 4. API Specification Overview

### 4.1 Organiser Media & Albums APIs
- `POST /api/v1/weddings/:weddingId/albums` — Create album
- `GET /api/v1/weddings/:weddingId/albums` — List albums
- `PATCH /api/v1/weddings/:weddingId/albums/:albumId` — Update album
- `DELETE /api/v1/weddings/:weddingId/albums/:albumId` — Delete album
- `POST /api/v1/weddings/:weddingId/media/upload-intents` — Generate presigned upload URL
- `POST /api/v1/weddings/:weddingId/media/:mediaId/complete` — Verify upload metadata & mark uploaded
- `GET /api/v1/weddings/:weddingId/media` — List wedding media (filtered by status, album, visibility)
- `GET /api/v1/weddings/:weddingId/media/:mediaId/access-url` — Get 60s signed access URL
- `DELETE /api/v1/weddings/:weddingId/media/:mediaId` — Delete media from R2 and MongoDB
- `POST /api/v1/weddings/:weddingId/media/:mediaId/approve` — Approve pending guest upload
- `POST /api/v1/weddings/:weddingId/media/:mediaId/reject` — Reject pending guest upload

### 4.2 Public Guest Access Token APIs
- `POST /api/v1/public/guest-access/:token/media/upload-intents` — Guest presigned upload URL
- `POST /api/v1/public/guest-access/:token/media/:mediaId/complete` — Complete guest upload (`PENDING_APPROVAL`)
- `GET /api/v1/public/guest-access/:token/media/:mediaId/access-url` — Access approved media URL
- `GET /api/v1/public/guest-access/:token/gallery` — View approved guest gallery media & albums
- `POST /api/v1/public/guest-access/:token/guestbook` — Submit guestbook wish
- `GET /api/v1/public/guest-access/:token/guestbook` — List approved guestbook wishes

### 4.3 Workspace Guestbook & Emergency APIs
- `GET /api/v1/weddings/:weddingId/guestbook` — List guestbook entries (all statuses)
- `POST /api/v1/weddings/:weddingId/guestbook/:entryId/approve` — Approve wish
- `POST /api/v1/weddings/:weddingId/guestbook/:entryId/reject` — Reject wish
- `DELETE /api/v1/weddings/:weddingId/guestbook/:entryId` — Delete wish
- `POST /api/v1/weddings/:weddingId/emergency-contacts` — Create contact
- `GET /api/v1/weddings/:weddingId/emergency-contacts` — List contacts
- `PATCH /api/v1/weddings/:weddingId/emergency-contacts/:contactId` — Update contact
- `DELETE /api/v1/weddings/:weddingId/emergency-contacts/:contactId` — Delete contact

---

## 5. Implementation & Verification Matrix

- [x] Create `docs/10-Wedding-Experience.md`
- [x] Implement `Media` and `Album` Mongoose models
- [x] Implement `GuestbookEntry` Mongoose model
- [x] Implement `EmergencyContact` Mongoose model
- [x] Implement Repositories, DTOs, Zod schemas, and Services
- [x] Implement REST API handlers
- [x] Implement Workspace UI pages (`/gallery`, `/guestbook`, `/emergency`)
- [x] Update Public Digital Invitation (`/invitation/[token]`) with tabs
- [x] Update Website Builder & Public Website (`/w/[slug]`)
- [x] Build Vitest test suite `src/__tests__/wedding-experience.test.ts`
- [x] Senior Code Review P1 Security Fixes:
  - `EXP-P1-01`: Restricted `visibility: "PRIVATE"` media access in `getMediaAccessUrl` for guest token callers.
  - `EXP-P1-02`: Enforced `input.uploadKey.startsWith("uploads/temp/" + weddingId + "/")` in `completeUpload` to prevent cross-wedding temp key substitution.
- [x] Run repository verification suite (`typecheck`, `lint`, `vitest`, `build`)
