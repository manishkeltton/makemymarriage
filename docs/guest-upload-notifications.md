# V1 Guest-Upload Notifications Specification & Implementation

Last updated: 2026-10-02

This document details the architecture, transition detection rules, atomic deduplication, server-side recipient resolution, security constraints, and QA flows for V1 Guest-Upload Notifications across the Make My Marriage workspace.

---

## 1. Trigger Conditions & State Transition Detection

Guest-upload notifications are triggered ONLY when a guest completes a photo, video, or media file upload that successfully seals with provider verification (`StorageService.verifyAndSeal`) and transitions from `PENDING_UPLOAD` to `PENDING_APPROVAL`:

- **Public Guest Upload Completion:** `POST /api/v1/public/guest-access/[token]/media/[mediaId]/complete` (`MediaService.completeUpload`)
- **Organiser Member Uploads:** Member uploads transition directly from `PENDING_UPLOAD` to `APPROVED` and bypass moderation notifications completely (0 notifications emitted).

---

## 2. Durable Deduplication & Concurrency Safety

- **Atomic State Update:** Transition from `PENDING_UPLOAD` to `PENDING_APPROVAL` is executed atomically via `MediaRepository.updateStatusFromPendingUpload`.
- **Idempotency:** Repeated or concurrent completion calls for a media item that has already completed `PENDING_APPROVAL` return the existing record without duplicate notification dispatch or state regression.
- **Deduplication Key:** Notifications are deduplicated per recipient and media item: `dedupKey = ${recipientUserId}_GUEST_UPLOAD_${mediaId}`.
- **MongoDB Sparse Unique Index:** Handles duplicate insertion attempts gracefully with code `11000`, suppressing duplicate notifications per recipient.

---

## 3. Server-Side Recipient Resolution & Secret Privacy

- **Recipient Resolution:** Resolved server-side by querying active members of the target wedding workspace who possess `gallery` functional permission or `ADMIN` role (`TeamMemberRepository.findActiveMembersByWeddingId(weddingId)`).
- **Public Request Protection:** Public callers cannot specify recipient IDs or link destinations.
- **Uploader Identity:** Looked up server-side from `GuestHouseholdRepository.findByIdAndWeddingId` using `uploadedByHouseholdId`.
- **Secret & Token Privacy:** Raw invitation tokens, storage credentials, object keys, and signed URLs are NEVER placed in notification titles, messages, links, or deduplication payloads. Public responses expose `PublicMediaDTO` only.

---

## 4. Stale Notification Policy & Security Scope

When fetching user notifications via `NotificationService.getUserNotifications`:
- Verifies active workspace membership.
- Verifies user has `gallery` permission or `ADMIN` role.
- Performs batch lookup on `MediaModel.find`.
- Omits notifications for deleted media items or users whose `gallery` management permission was revoked. Unread count strictly reflects accessible notifications.

---

## 5. Gallery Deep-Link URL Contract

- Target URL: `/workspace/[weddingId]/gallery?mediaId=[mediaId]`
- Deep Link Handling (`GalleryPage`):
  - Reading `mediaId` search parameter auto-selects the `moderation` queue tab if media is `PENDING_APPROVAL`, or `photos` tab if `APPROVED`.
  - Item container renders visual highlight ring (`ring-4 ring-amber-500 border-amber-500 animate-pulse`).
  - Target media is resolved even if missing from currently loaded page or filters (`GET /api/v1/weddings/[weddingId]/media/[mediaId]`).

---

## 6. Delivery Reliability & Retries

- **Atomicity:** Upload verification and status update precede notification creation. If file sealing or metadata validation fails, status remains `PENDING_UPLOAD` and no notifications are emitted.
- **Safe Recovery:** If notification dispatch fails due to network or DB issues, the media status remains safely persisted in `PENDING_APPROVAL`. Guests do NOT need to re-upload files to recover notification delivery.

---

## 7. QA Verification & Test Outcomes

### Verification Outcomes
- `npx vitest run`: **PASS** (28 test files, 242 passed, 100% pass rate).
- `npx tsc --noEmit`: **PASS** (0 errors).
- `npm run lint`: **PASS** (0 errors, 0 warnings with `--max-warnings=0`).
- Unit & integration tests added in `src/__tests__/guest-upload-notifications.test.ts`:
  1. Guest upload completion triggering notifications (`PENDING_UPLOAD` → `PENDING_APPROVAL`).
  2. Member upload completion bypass (`PENDING_UPLOAD` → `APPROVED`, 0 notifications).
  3. Concurrent & duplicate completion requests suppression (idempotent, 0 duplicate notifications).
  4. Server-side recipient resolution & `gallery` permission filtering.
  5. Privacy protection (no raw tokens, keys, or signed URLs in notification payloads).
  6. Stale media / permission revocation notification filtering in `getUserNotifications`.

### Chrome QA Fixtures
1. **Fixture 1: Public Guest Upload & Moderation Alert**
   - Access public digital invitation at `/invitation/[token]` or `/g/[token]`.
   - Submit photo upload via gallery tab.
   - Verify upload seals and completes with `PENDING_APPROVAL` status.
   - Log into workspace as organiser with `gallery` permission -> Notification bell displays new notification:
     - Title: `New Guest Photo Uploaded`
     - Message: `[Household Name] uploaded "[Filename]" for moderation.`
     - Link: `/workspace/[weddingId]/gallery?mediaId=[mediaId]`

2. **Fixture 2: Notification Click & Moderation Queue Deep Link**
   - Click notification item in `NotificationCenter`.
   - Workspace navigates to `/workspace/[weddingId]/gallery?mediaId=[mediaId]`.
   - Active tab automatically switches to `Moderation Queue`.
   - Target pending photo card renders highlighted with amber pulse ring.
