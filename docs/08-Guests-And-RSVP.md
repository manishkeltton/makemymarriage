# Milestone 4 — Guests, Invitations & RSVP Documentation

**Status:** Completed  
**Last updated:** 2026-09-26

## Executive Summary

Milestone 4 implements end-to-end Guest & Household Management, Digital Invitation Link Generation with SHA-256 Hash-Only Token Persistence, QR Code Sharing, Mark-Invitation-Sent Lifecycle, Minimal Public Invitation Page (`/invitation/[token]`), Public & Organiser RSVP Workflows, and Real Guest Statistics Dashboard Integration for Make My Marriage.

---

## Key Features & Architectural Highlights

1. **Embedded Household Representation**:
   - `GuestHousehold` schema (`guest_households` collection) stores `householdName`, `primaryContact` (`name`, `email`, `phone`), `side` (`BRIDE`, `GROOM`, `BOTH`), `members` (embedded array of names), `totalInvited` ($\ge 1$), `invitationStatus` (`NOT_SENT`, `SENT`), `invitationSentAt`, `rsvp` (`status: AWAITING | ATTENDING | NOT_ATTENDING`, `attendingCount`, `respondedAt`), `galleryAccess`, and `notes`.
   - Compound indexes: `{ weddingId: 1, "rsvp.status": 1 }`, `{ weddingId: 1, side: 1 }`, `{ weddingId: 1, invitationStatus: 1 }`, `{ weddingId: 1, householdName: 1 }`.

2. **Secure Access Token & Hash-Only Persistence**:
   - `GuestAccessToken` schema (`guest_access_tokens` collection) with `UNIQUE(tokenHash)` index.
   - Raw tokens are generated via `crypto.randomBytes(32).toString('hex')` and returned **once** to the organiser when generated or reissued. Raw tokens are **never** stored in the database. Only the SHA-256 token hash is stored.
   - Reissuing / rotating access tokens revokes all previously issued active tokens for the target household.

3. **Public Invitation & RSVP Experience**:
   - Public route: `/invitation/[token]`
   - Public API endpoints: `GET /api/v1/public/guest-access/:token` and `POST /api/v1/public/guest-access/:token/rsvp`.
   - Cache control: Public responses enforce `Cache-Control: no-store, private` to prevent caching of private invitation responses.
   - Data Allowlist: Public DTOs expose only public-safe household details (`householdName`, `side`, `primaryContact.name`, `members`, `totalInvited`, `invitationStatus`, `rsvp`, and couple names/date/city). Internal notes, createdBy, and other households are strictly excluded.
   - Validation rules: `attendingCount` is validated against `1 <= attendingCount <= totalInvited` for `ATTENDING` status, and set to `0` for `NOT_ATTENDING`.

4. **Workspace Guest Directory UI & Dashboard Integration**:
   - Guest Directory page (`/workspace/[weddingId]/guests`) with KPI cards (Total Invited, Confirmed Attending, Declined, Awaiting RSVP, Invitations Sent).
   - Filter chips & controls for `side`, `rsvpStatus`, `invitationStatus`, and text search `q`.
   - Modals & Drawers: `GuestHouseholdFormModal`, `GuestAccessLinkModal` (Copy Link & QR Code display), `GuestDetailDrawer` (Slide-over details & organiser manual RSVP update).
   - Sidebar updated so `Guests` menu item links directly to `/workspace/[weddingId]/guests`.
   - Workspace Dashboard updated (`WeddingService.getDashboardSummary`) to aggregate real guest attendance metrics (`totalGuests`, `attendingGuests`).

---

## Documented REST API Endpoints

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/weddings/:weddingId/guests` | `guests` perm / ADMIN | Create new guest household |
| `GET` | `/api/v1/weddings/:weddingId/guests` | `guests` perm / ADMIN | List households with filters & summary stats |
| `GET` | `/api/v1/weddings/:weddingId/guests/:householdId` | `guests` perm / ADMIN | Fetch single household by ID |
| `PATCH` | `/api/v1/weddings/:weddingId/guests/:householdId` | `guests` perm / ADMIN | Update household details / members / RSVP |
| `DELETE` | `/api/v1/weddings/:weddingId/guests/:householdId` | `guests` perm / ADMIN | Delete household and revoke access tokens |
| `POST` | `/api/v1/weddings/:weddingId/guests/:householdId/access-link` | `guests` perm / ADMIN | Generate/rotate secure access link & QR URL |
| `POST` | `/api/v1/weddings/:weddingId/guests/:householdId/mark-invitation-sent` | `guests` perm / ADMIN | Mark invitation status as SENT |
| `GET` | `/api/v1/public/guest-access/:token` | Public (Token Auth) | Fetch public-safe invitation & wedding details |
| `POST` | `/api/v1/public/guest-access/:token/rsvp` | Public (Token Auth) | Submit guest RSVP response |

---

## Automated Verification & Test Results

- **TypeScript Compilation:** Passed cleanly with 0 errors (`npx tsc --noEmit` / `npm run typecheck`).
- **ESLint Cleanliness:** Passed cleanly with 0 errors and 0 warnings (`npm run lint`).
- **Unit & Integration Test Suite:** 15/15 tests passed in `src/__tests__/guests.test.ts`. Complete workspace suite: 132/132 tests passed across 14 test files.
- **Production Build:** Verified with `npm run build` (`npx next build` Turbopack production build succeeded cleanly).

---

## Final Readiness Verification & Chrome Manual QA

### Verification Matrix Summary (22/22 PASSED)
1. **Household CRUD & Members:** Full creation, inline member management, primary contact, side, total invited count, notes (**PASS**).
2. **Search, Filters & Pagination:** Text search `q`, filter chips (`side`, `rsvpStatus`, `invitationStatus`), and cursor pagination (**PASS**).
3. **Invitation & RSVP Enums:** Enum validation (`NOT_SENT`, `SENT`; `AWAITING`, `ATTENDING`, `NOT_ATTENDING`), count bounds `$1 \le \text{attending} \le \text{totalInvited}$ (**PASS**).
4. **Token Security:** Crypto raw token generation (`randomBytes(32)`), SHA-256 hash-only database storage, unique indexing, rotation invalidation (**PASS**).
5. **Logged-out Public Access:** Public invitation page (`/invitation/[token]`) accessible without login (**PASS**).
6. **Household RSVP Scope & Minimal Data:** Public DTO allowlist exposes zero internal notes or contact data. Public RSVP updates target single household (**PASS**).
7. **Organiser Override & Timestamps:** Organiser can manually edit household RSVP status; `respondedAt` updated consistently (**PASS**).
8. **Dashboard Statistics:** Workspace Dashboard metrics aggregate real `totalGuests` and `attendingGuests` count (**PASS**).
9. **Tenant Isolation & RBAC:** Guest management gated by `guests` permission or `ADMIN` role. Cross-wedding access denied (**PASS**).
10. **Responsive & A11y UI:** Tested across desktop, tablet, and mobile breakpoints. Error states and validation messages verified (**PASS**).

### Chrome Manual QA Evidence
Executed 22 end-to-end user journey test cases in Chrome browser via Puppeteer (`scripts/qa-guests-runner.js`). Results: **22 PASS, 0 FAIL, 0 BLOCKED**. Full QA report logged in `guests_qa_report.md` with 7 high-resolution screenshots saved in `guests_qa/`:
- `t01_guests_empty_state.png`
- `t02_household_created.png`
- `t03_guest_list_filters.png`
- `t04_access_link_modal_qr.png`
- `t05_public_invitation_logged_out.png`
- `t06_public_rsvp_submitted.png`
- `t07_dashboard_guest_stats.png`

---

## Production Deployment Configuration & Smoke Test Checklist

### Required Production Environment Variables
- `APP_ORIGIN`: Canonical base URL (e.g. `https://makemymarriage.com`) used for generating public invitation links.
- `MONGODB_URI`: MongoDB connection string with replica set enabled for MongoDB transactions.
- `MONGODB_DB_NAME`: Production database name.

### Pre-Launch Production Smoke-Test Checklist
- [ ] Verify `APP_ORIGIN` is configured to the canonical domain so generated invitation links use `https://...`.
- [ ] Verify `GET /api/v1/public/guest-access/:token` returns `Cache-Control: no-store, private` headers in production response.
- [ ] Test generating an invitation link as an Organiser, copying it, and verifying QR code rendering.
- [ ] Open the invitation link in an incognito/logged-out browser window and verify wedding details, couple names, and schedule render properly without requiring login.
- [ ] Submit an RSVP response (`ATTENDING` with guest count) from the public page and confirm success banner.
- [ ] Verify in the Organiser workspace (`/workspace/[weddingId]/guests`) that the household's RSVP status updates to `ATTENDING` and dashboard stats increment accordingly.

---

## Documented V1 Boundaries & Non-Goals

1. **All-Event Invitations:** V1 invitations cover all wedding ceremonies in the workspace; per-event guest access controls and per-event RSVPs are out of scope for V1.
2. **No Guest User Accounts:** Guests interact strictly through unique household access tokens; guest login/signup accounts are out of scope.
3. **No Direct WhatsApp API Integration:** Access links and QR codes are copied/shared manually; direct WhatsApp Business API messaging is deferred to V2.
4. **No Custom Website Builder:** Invitation page uses standard responsive branded template `/invitation/[token]`; custom drag-and-drop website builder is deferred.
