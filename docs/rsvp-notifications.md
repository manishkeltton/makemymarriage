# V1 RSVP Notifications Specification & Implementation

Last updated: 2026-10-02

This document details the architecture, transition detection rules, atomic deduplication, server-side recipient resolution, security constraints, and QA flows for V1 RSVP Notifications across the Make My Marriage workspace.

---

## 1. RSVP Triggers & State Transition Detection

RSVP notifications are triggered when an RSVP status or attending count is updated via:
1. Public RSVP Submission (`POST /api/v1/public/guest-access/[token]/rsvp` / `GuestService.submitPublicRsvp`)
2. Organiser Workspace Update (`PATCH /api/v1/weddings/[weddingId]/guests/[householdId]` / `GuestService.updateHousehold`)

### Transition Comparison Rules
- Compares normalized `status` (`AWAITING`, `ATTENDING`, `NOT_ATTENDING`) and `attendingCount` against persisted previous state.
- **Suppression:** Identical status/count values, `respondedAt`-only changes, and non-RSVP household edits (e.g. updating notes or member names without changing RSVP status/count) are ignored and emit 0 notifications.
- **First Response:** Transition from `AWAITING` to `ATTENDING` or `NOT_ATTENDING`.
- **Status / Count Update:** Transition between responded states (e.g. `ATTENDING (2)` → `ATTENDING (4)` or `ATTENDING (2)` → `NOT_ATTENDING (0)`).

---

## 2. Durable Transition Identification & Atomic Deduplication

- `transitionKey` format: `${oldStatus}_${oldCount}_TO_${newStatus}_${newCount}_AT_${respondedAtTimestamp}`
- `dedupKey` format: `${recipientUserId}_RSVP_${householdId}_${transitionKey}`
- **Sequence Preservation:** An `A → B → A` sequence (e.g. `ATTENDING` → `NOT_ATTENDING` → `ATTENDING`) at different timestamps generates unique `transitionKey`s and `dedupKey`s, ensuring subsequent valid transitions trigger new notifications.
- **Atomic Deduplication:** Identical retries of the exact same transition reuse the same `dedupKey`, suppressing duplicate insertions via MongoDB sparse unique indexing.

---

## 3. Server-Side Recipient Resolution & Security Constraints

- **Recipient Eligibility:** Resolved server-side by querying active members of the target wedding workspace who possess `guests` functional permission or `ADMIN` role (`TeamMemberRepository.findActiveMembersByWeddingId(weddingId)`).
- **Public Request Protection:** Public request bodies do NOT dictate recipient IDs or wedding ownership.
- **Token Privacy:** Public responses expose `PublicGuestAccessDTO` only. Raw invitation tokens and secret URLs are never placed in notification titles, messages, logs, or delivery links.
- **Deep Link Navigation:**
  - Target URL: `/workspace/[weddingId]/guests?householdId=[householdId]`
  - Clicking an RSVP notification opens the Guest Directory and slide-over `GuestDetailDrawer` for the exact household.

---

## 4. Stale Notification Policy & Access Revocation

When fetching user notifications via `NotificationService.getUserNotifications`:
- Verifies active workspace membership.
- Verifies user has `guests` permission or `ADMIN` role.
- Verifies target guest household exists in database (`GuestHouseholdModel.find`).
- Omit notifications for deleted households or users whose guest management permissions were revoked. Unread count strictly reflects accessible notifications.

---

---

## 5. Delivery, Reliability & Partial Failure Retries

- **Atomicity:** RSVP state persistence and notification dispatch are executed atomically. If household updates fail, no notifications are emitted.
- **Reliable Retries:** If notification creation fails or encounters a transient database issue, the RSVP change remains safely persisted in MongoDB. Guests do NOT need to resubmit their RSVP.
- **Concurrent Requests:** Concurrent submissions for the exact same transition reuse the deterministic `dedupKey`. MongoDB sparse unique index catches duplicate inserts with code `11000` and returns `{ success: true, notification: null }` without throwing errors or creating duplicate alerts.

---

## 6. QA Verification & Test Fixtures

### Test Outcomes
- `npm run lint`: **PASS** (0 errors, 0 warnings with `--max-warnings=0`).
- `npx tsc --noEmit`: **PASS** (0 errors).
- `npx vitest run`: **PASS** (27 test files, 237 passed, 100% pass rate).
- Unit & integration tests added in `src/__tests__/rsvp-notifications.test.ts`:
  1. First response alerts (`AWAITING` → `ATTENDING` / `NOT_ATTENDING`).
  2. Status/count update alerts (`ATTENDING (2)` → `ATTENDING (4)`).
  3. Identical retries and `respondedAt`-only changes suppression.
  4. `A → B → A` transition sequence preservation.
  5. Server-side recipient resolution and permission revocation filtering.
  6. Public token isolation and deep link formatting.

### Chrome QA Fixtures
1. **Fixture 1: Public Guest Access & Submission**
   - Access URL: `/g/[token]`
   - Perform RSVP submission (e.g. set 2 guests attending).
   - Expected Output: Returns `PublicGuestAccessDTO` response (no internal user IDs or raw tokens exposed).
   - Notification Output: Active workspace members with `guests` permission receive in-app notification:
     - Title: `RSVP Received from [Household Name]`
     - Message: `Responded ATTENDING (2 guests)`
     - Link: `/workspace/[weddingId]/guests?householdId=[householdId]`

2. **Fixture 2: In-App Notification Center & Deep Linking**
   - Open `/workspace/[weddingId]/guests` as workspace organiser.
   - Click bell icon in header (`NotificationCenter`).
   - Notification appears with `mark_email_read` icon.
   - Click notification -> navigates to `/workspace/[weddingId]/guests?householdId=[householdId]`, automatically revealing `GuestDetailDrawer`.

