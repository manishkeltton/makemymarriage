# Make My Marriage — Project Status

Last updated: 2026-09-26

This file tracks major implementation milestones. Add new features as work begins and update existing entries as they progress. Dates below indicate when progress was recorded, not necessarily when a feature was originally completed.

## Overview

| Milestone                             | Status    | Last updated |
| ------------------------------------- | --------- | ------------ |
| Project scaffold                      | Completed | 2026-09-23   |
| Marketing homepage                    | Completed | 2026-09-23   |
| Authentication                        | Completed | 2026-09-23   |
| Workspace & Wedding Tenant Management | Completed | 2026-09-23   |
| Event Management — Ceremonies & Venues| Completed | 2026-09-24   |
| Team Management — Invites, Roles & Scope| Completed | 2026-09-25   |
| Planning Engine — Tasks & Documents   | Completed | 2026-09-25   |
| Money & Vendors — Budget & Procurement | Completed | 2026-09-25   |
| Guests — Household, Invitations & RSVP | Completed | 2026-09-26   |
| Wedding Website & Builder             | Completed | 2026-09-26   |
| Wedding Experience — Gallery & Wishes  | Completed | 2026-09-26   |
| Pending Features & Future Roadmap     | Tracked   | 2026-09-26   |

## 1. Project scaffold

- **Status:** Completed
- **Last updated:** 2026-09-23
- **Implemented:** Established the Next.js, React, TypeScript, and Tailwind CSS project foundation, with package scripts for development, builds, type checking, linting, formatting, and tests. Created initial route structure for marketing, authentication, the workspace, and public wedding pages.
- **Documentation:** Added the PRD, system design, database design, and API design documents in `docs`.
- **Scope:** This milestone covers the application foundation; individual product features are tracked separately as they are implemented.

## 2. Marketing homepage

- **Status:** Completed
- **Last updated:** 2026-09-24
- **Implemented:** Built the homepage with branded navigation, a hero section, product introduction, feature sections for events, tasks, collaboration, guests, vendors, wedding websites, galleries, how-it-works, Indian wedding, privacy, social proof, and footer sections. Replaced placeholder images with the true MakeMyMarriage Emblem SVG. Implemented `MarketingHeader` client component with dynamic session recognition via `getSessionToken()` and `AuthService.verifySession()`. When authenticated, the right header dynamically renders a "Go to Workspace" primary CTA button alongside the logged-in User Avatar dropdown menu (with name, email, workspace shortcut, and Sign Out action), while rendering "Sign In" and "Start Planning Free" CTAs for unauthenticated guests.
- **Key files:** `src/app/(marketing)/page.tsx`, `src/components/marketing/MarketingHeader.tsx`, and `src/components/marketing/`.
- **Scope:** Completion refers to the marketing homepage UI and authenticated header navigation state. The product capabilities described on the page and the destination flows linked from it are separate implementation milestones.

## 3. Authentication & Session Management

- **Status:** Completed
- **Last updated:** 2026-09-23
- **Implemented:** Implemented the custom session-based Authentication flow backed by MongoDB as described in the PRD and API Design. Includes `User` and `Session` database models, a robust `AuthService`, encrypted password hashing using `bcryptjs`, HttpOnly secure cookie management, and API routes for `signup`, `login`, `logout`, and `session`. Built the `/signup`, `/login`, and `/workspace` frontend UI pages with full session management and Sign Out actions. Comprehensive automated manual browser testing performed verifying signup, field validations, sign out, invalid login handling, duplicate email prevention, and session persistence.
- **Key files:** `src/lib/db/models/`, `src/lib/services/auth.service.ts`, `src/app/api/v1/auth/`, `src/app/(auth)/`, `src/app/(workspace)/workspace/page.tsx`.
- **Scope:** This covers the ability for a user to register an account and authenticate.

## 4. Workspace & Wedding Tenant Management

- **Status:** Completed
- **Last updated:** 2026-09-23
- **Implemented:** Built the core multi-tenant boundary for wedding workspaces. Includes Mongoose schemas for `Wedding` and `WeddingMember` with compound indexing, latitude/longitude bounds validation, and role permissions (`ADMIN`, `MANAGER`, `ORGANISER`). Upholds strict domain module separation (`src/modules/weddings/`) with repository pattern (`WeddingRepository`, `WeddingMemberRepository`) and DTO mapping layer (`toWeddingDTO`, `toWeddingMemberDTO`). Implemented `WeddingService` with atomic MongoDB transactions for workspace creation, `ADMIN` permission-gated `PATCH` updating, and UTC timezone-safe countdown metrics. Built server-rendered workspace pages (`/workspace/[weddingId]`), recency-aware workspace redirection cookie (`last_accessed_wedding_id`), guided onboarding (`/workspace/new`), interactive `WeddingSwitcher` dropdown, and Wedding Dashboard UI. Fixed Mongoose subdocument DTO circular structure JSON serialization and encapsulated RSC action handlers into Client Components. Full Vitest test suite in `src/__tests__/weddings.test.ts`.
- **Key files:** `src/modules/weddings/`, `src/app/api/v1/weddings/`, `src/components/workspace/`, `src/app/(workspace)/workspace/`.
- **Scope:** Covers wedding creation, membership/tenant isolation, switching between workspaces, and the primary workspace dashboard. Ceremony/event management and checklist modules will be built next.

## 5. Event Management — Ceremonies, Scheduling & Venues

- **Status:** Completed
- **Last updated:** 2026-09-24
- **Implemented:** Implemented complete end-to-end Event Management module following project architecture principles. Created `EventModel` with `(weddingId, startAt)` and `(weddingId, name)` indexes, latitude/longitude boundary checks, and suggested event types (`ROKA`, `ENGAGEMENT`, `TILAK`, `MEHENDI`, `HALDI`, `SANGEET`, `WEDDING`, `RECEPTION`, `CUSTOM`). Built tenant-safe `EventRepository`, `EventService`, Zod validation schemas (`createEventSchema`, `updateEventSchema`), DTO mapping (`toEventDTO`), and REST API endpoints (`POST`, `GET`, `PATCH`, `DELETE`). Implemented responsive Events Timeline (`/workspace/[weddingId]/events`), Create & Edit Event Modal (`EventFormModal`), Delete Event Confirmation Dialog (`DeleteEventModal`), and Event Detail view (`/workspace/[weddingId]/events/[eventId]`) matching connected Stitch designs. Integrated real upcoming event data into the Workspace Dashboard summary. Unit & integration test suite added in `src/__tests__/events.test.ts`.
- **Key files:** `src/modules/events/`, `src/app/api/v1/weddings/[weddingId]/events/`, `src/components/events/`, `src/app/(workspace)/workspace/[weddingId]/events/`.
- **Scope:** Covers event model, repository, service, DTOs, REST APIs, authorization, events overview, create event, event detail, edit event, delete event, empty states, responsive design, and workspace dashboard next-event integration. Tasks, Vendors, Expenses, Documents, and Gallery modules remain separate future milestones.

## 6. Team Management — Invitations, Roles, Permissions & Event Scope

- **Status:** Completed
- **Last updated:** 2026-09-25
- **Implemented:** Implemented complete end-to-end Team Management and Member Invitation milestone matching Stitch designs and system/database design docs. Created `WeddingMemberInvite` Mongoose model with `(weddingId, normalizedEmail, status)` and `UNIQUE(tokenHash)` indexes, plus MongoDB outbox `EmailJob` model and `EmailService` outbox dispatcher. Built cryptographically secure token hashing (`SHA-256`), tenant-safe repositories (`TeamMemberRepository`, `TeamInviteRepository`), `TeamService` with atomic invitation acceptance transactions, reusable `TeamAuthorization` helpers (`requireWeddingAdmin`, `requireWeddingPermission`, `requireEventAccess`), and Zod schemas (`createInviteSchema`, `updateMemberSchema`). Enforced mandatory **Final Admin Protection** preventing the demotion or removal of the last remaining Admin. Implemented REST APIs for member listing, role/permissions/scope editing, member soft deletion (`status = REMOVED`), invite creation, resend, revoke, public preview, and acceptance. Built Team workspace UI (`/workspace/[weddingId]/team`), `InviteMemberModal`, `EditMemberModal`, `RemoveMemberModal`, and Public Invitation Preview page (`/invite/[token]`) with account email matching enforcement and login/signup return flow. Comprehensive Vitest test suite added in `src/__tests__/team.test.ts`.
- **Key files:** `src/modules/team/`, `src/app/api/v1/weddings/[weddingId]/members/`, `src/app/api/v1/weddings/[weddingId]/member-invites/`, `src/app/api/v1/public/member-invites/`, `src/components/team/`, `src/app/(workspace)/workspace/[weddingId]/team/`, `src/app/invite/[token]/`.
- **Scope:** Covers team member listing, access management, invitations, secure tokens, resend/revoke, public preview, acceptance flow, role/permissions/scope editing, member removal, final Admin protection, responsive Stitch UI, and test suite.

### Invitation delivery correction — 2026-09-25

- Preserved the 2026-09-24 team implementation milestone; live email delivery requires further delivery validation.
- Dispatch is awaited during create/resend, jobs are claimed atomically, and missing settings, provider rejection, and network timeouts are recorded as FAILED instead of mock SENT results. Provider acceptance is exposed in create/resend responses and UI; shareable links remain available on delivery failure. Email HTML escapes user content.
- Invitation links prefer APP_ORIGIN, support the existing NEXT_PUBLIC_APP_URL and Vercel production-domain fallback, and reject localhost/HTTP in production. URL configuration is checked before creating or rotating invitation tokens.
- Validation: email delivery regression tests, existing team tests, and TypeScript check. No live email sent.
- Remaining: configure RESEND_API_KEY and a verified RESEND_FROM_EMAIL, set the production APP_ORIGIN, redeploy, and verify inbox delivery plus acceptance with the invited account. SENT means provider acceptance, not confirmed inbox delivery. Failed jobs require manual Resend; no automatic retry worker or delivery webhook is implemented.

## 7. Planning Engine — Tasks, Checklist, Documents & Notifications

- **Status:** Completed
- **Last updated:** 2026-09-25
- **Implemented:** Implemented complete end-to-end Planning Engine milestone (Milestone 2) for Make My Marriage matching Stitch screens `c259d32691ef4a71965dad84de8a7da6`, `ec6c776e6b0141618944c2e2e5d7a417`, `66bf8c6ad196400a94bcd53be07fb6b4`, and `911e6587db94423e8983bb06085802cc`.
  - **Models & Validation:** `TaskModel`, `TaskCommentModel`, `DocumentModel`, `NotificationModel` with strict `weddingId` compound indexing and non-self / non-circular dependency validations. Priority enum (`LOW`, `MEDIUM`, `HIGH`) and Status enum (`TODO`, `IN_PROGRESS`, `COMPLETED`).
  - **Repositories & Services:** Built `TaskRepository`, `TaskCommentRepository`, `DocumentRepository`, `NotificationRepository`, `TaskService`, `DocumentService`, and `NotificationService` supporting task filtering, pagination, same-wedding assignee/event reference checks, task comment management, document uploads/links, and in-app notifications.
  - **Predefined Checklist Generator:** Implemented 27 curated Hindu wedding checklist templates across 6 traditional categories (Venue, Catering, Photography, Decoration, Ceremony & Puja, Clothing) with auto-matching to workspace events.
  - **REST APIs:** Full REST suite under `/api/v1/weddings/[weddingId]/tasks`, `/api/v1/weddings/[weddingId]/checklist/generate`, `/api/v1/weddings/[weddingId]/documents`, `/api/v1/notifications`.
  - **Workspace UI & Headers:** Built Tasks workspace view (`/workspace/[weddingId]/tasks`) with List & Kanban views, search, category/priority/status filters, `ChecklistModal`, `TaskFormModal`, slide-over `TaskDetailDrawer` with real-time comment feed & document attachments, Documents repository page (`/workspace/[weddingId]/documents`), and header `NotificationCenter` dropdown menu with unread counter badges.
  - **Dashboard Integration:** Updated workspace dashboard summary to calculate real task completion percentages, upcoming task counts, and overdue task alerts.
  - **Testing & Build:** Added unit test suite in `src/__tests__/tasks.test.ts` (18 tests passing). Verified clean TypeScript build (`npm run typecheck`), strict zero-warning linter (`npm run lint`), and Next.js production build (`npm run build`).
  - **Code Review & QA Readiness Verification (2026-09-25):**
    - Resolved all approved P0 and P1 findings (`PLAN-P0-01` cross-wedding document IDOR validation, `PLAN-P1-01` multi-hop circular dependency detection, `PLAN-P1-02` in-place task update on repeat checklist generation, `PLAN-P1-03` role/active member authorization).
    - Executed 23 Chrome browser QA scenarios via Puppeteer: 22 PASSED, 0 FAILED, 1 BLOCKED (`NTF-02` external email reminder worker awaiting production `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and cron worker).
    - Verified strict React 19 effect compliance (`react-hooks/set-state-in-effect`), zero TypeScript errors, zero ESLint warnings/errors, and passing Vitest test suite.
- **Key files:** `src/modules/tasks/`, `src/modules/documents/`, `src/modules/notifications/`, `src/components/tasks/`, `src/components/workspace/NotificationCenter.tsx`, `src/app/(workspace)/workspace/[weddingId]/tasks/`, `src/app/(workspace)/workspace/[weddingId]/documents/`, `src/__tests__/tasks.test.ts`.
- **Scope:** Covers V1 task management, priority/status tracking, task dependencies, predefined Hindu wedding checklist generator, comments feed, document repository, in-app notifications, and dashboard task metrics. Subtasks are excluded in V1.

## 8. Money & Vendors — Budget & Procurement

- **Status:** Completed
- **Last updated:** 2026-09-25
- **Implemented:** Implemented complete end-to-end Money & Vendors milestone (Milestone 3) for Make My Marriage matching connected Stitch workspace screens.
  - **Shared Money Utilities:** Created `src/lib/utils/money.ts` for integer paise arithmetic (1 INR = 100 paise), loss-free decimal string conversion (`rupeesToPaise`), decimal rupee conversion (`paiseToRupees`), and Indian locale currency formatting (`formatINR`).
  - **Vendor Procurement:** Created `Vendor` Mongoose model with compound indexes, `VendorRepository`, `VendorService`, Zod validation schemas (`createVendorSchema`, `updateVendorSchema`), DTO mapping (`toVendorDTO`), and REST APIs (`/api/v1/weddings/[weddingId]/vendors`). Implemented Vendors workspace view (`/workspace/[weddingId]/vendors/page.tsx`) with search, category filtering, ceremony linking, agreed budget tracking, and `VendorFormModal`. Unlinks `vendorId` from expenses upon vendor deletion.
  - **Expenses & Single-step Approval:** Created `Expense` Mongoose model with single-step approval workflow (`PENDING`, `APPROVED`, `REJECTED`), `ExpenseRepository`, `ExpenseService`, Zod schemas (`createExpenseSchema`, `updateExpenseSchema`, `approveExpenseSchema`), DTO mapping (`toExpenseDTO`), and REST APIs (`/api/v1/weddings/[weddingId]/expenses`). Implemented Expenses workspace view (`/workspace/[weddingId]/expenses/page.tsx`), `ExpenseFormModal`, and `ExpenseDetailDrawer`. Cascades deletion to payment instalments when an expense is deleted. Excludes rejected expenses from active budget metrics.
  - **Instalments & Payments:** Created `ExpensePayment` Mongoose model in separate `expense_payments` collection, `ExpensePaymentRepository`, Zod schemas (`createPaymentSchema`, `updatePaymentSchema`), DTO mapping (`toExpensePaymentDTO`), and REST APIs (`/api/v1/weddings/[weddingId]/expenses/[expenseId]/payments` and `/api/v1/weddings/[weddingId]/payments`). Implemented `PaymentFormModal`. Evaluates runtime derived `effectiveStatus = OVERDUE` when a `PENDING` payment's `dueAt` date is in the past.
  - **Payer Attribution:** Tracks `paidBy` for `MEMBER` (validated against active workspace users) or `OTHER` (external contributor name). Computes payer contribution breakdowns.
  - **Dashboard Integration:** Updated `WeddingService.getDashboardSummary` and the workspace dashboard hero KPI cards to render real tracked spend, confirmed paid totals, and overdue payment alerts.
  - **Testing & Verification:** Added 24 unit & integration tests in `src/__tests__/vendors.test.ts` and `src/__tests__/expenses.test.ts`. Verified clean TypeScript compilation (`npx tsc --noEmit`) and passing test suite.
  - **Senior Code Review P1 Fixes (2026-09-26):**
    - Resolved `MONEY-P1-01`: Calculated `totalOutstandingPaise` as sum of per-expense outstanding balances `Math.max(0, amount - paid)` across active expenses in `ExpenseService.getFinanceSummary` and `WeddingService.getDashboardSummary`, preventing overpaid expenses from masking unpaid liabilities.
    - Resolved `MONEY-P1-02`: Filtered out payments for `REJECTED` expenses in `VendorService.getVendors` and `getVendorById` when calculating vendor `totalPaidPaise`.
    - Resolved `MONEY-P1-03`: Blocked payment creation on `REJECTED` expenses in `ExpenseService.createPayment`.
    - Resolved `MONEY-P1-04`: Enforced `MEMBER` (active userId) and `OTHER` (non-empty name) payer validation in `ExpenseService.updatePayment`.
    - Resolved `MONEY-P1-05`: Verified `existingPayment.expenseId.toString() === expenseId` in `ExpenseService.deletePayment` to prevent cross-expense payment deletion.
- **Key files:** `src/lib/utils/money.ts`, `src/modules/vendors/`, `src/modules/expenses/`, `src/app/api/v1/weddings/[weddingId]/vendors/`, `src/app/api/v1/weddings/[weddingId]/expenses/`, `src/app/api/v1/weddings/[weddingId]/finance/`, `src/app/api/v1/weddings/[weddingId]/payments/`, `src/components/vendors/`, `src/components/expenses/`, `src/app/(workspace)/workspace/[weddingId]/vendors/`, `src/app/(workspace)/workspace/[weddingId]/expenses/`, `src/__tests__/vendors.test.ts`, `src/__tests__/expenses.test.ts`, `docs/07-Money-And-Vendors.md`.
- **Scope:** Covers integer paise money calculations, vendor directory CRUD, expense CRUD, single-step approval, payment instalments, MEMBER vs OTHER payer attribution, private receipts/documents vault linking, finance summaries, and dashboard integration. Excludes payment processing gateways, vendor marketplace accounts, family settlements, multi-currency, and multi-step approval workflows.

### Final Readiness Check — 2026-09-26

- **Acceptance Matrix Verification:** Verified all 22 requirement areas across Vendor CRUD, Expense CRUD, Single-Step Approval, Instalments/Payments, Integer Paise Calculations, Overpayment Protection, Payer Tracking, Role Security, Multi-Tenant Isolation, and Dashboard Summaries.
- **Chrome Manual QA Evidence:** Executed 22 end-to-end user journey test cases in Chrome browser (`http://localhost:3000`) via Puppeteer. Results: **22 PASS, 0 FAIL, 0 BLOCKED**. Captured 12 high-resolution full-page evidence screenshots in `/home/manish.kumar3/.gemini/antigravity/brain/3162d954-0380-4d95-8278-787aef3c6111/finance_qa/`.
- **Code Review & P1 Fix Regression Verification:** All 5 approved P1 code review issues (`MONEY-P1-01` through `MONEY-P1-05`) fully resolved with dedicated Vitest regression test cases and verified in Chrome QA.
- **Repository Verification Suite Outcomes:**
  - `npm run lint` (`eslint . --max-warnings=0`): **PASS** (0 errors, 0 warnings).
  - `npm run typecheck` (`tsc --noEmit`): **PASS** (0 errors).
  - `npx vitest run`: **PASS** (13 test files, 117 tests passed, 100% pass rate).
  - `npm run build` (`npx next build`): **PASS** (Production build and static page generation completed cleanly in Next.js 16.3.5 Turbopack).
- **Final Recommendation:** **Ready for sign-off** (Technical & Operational Verification Complete).

## 9. Guests — Household Management, Invitations & RSVP

- **Status:** Completed
- **Last updated:** 2026-09-26
- **Implemented:** Built complete end-to-end Guest Management, Secure Access Token Link Lifecycle, Public Digital Invitation Page, Public & Organiser RSVP Workflows, and Dashboard Integration for Make My Marriage (Milestone 4).
  - **Models & Validation:** `GuestHouseholdModel` (`guest_households` collection) with `side`, `members`, `totalInvited`, `invitationStatus`, and embedded `rsvp` status/attending count. `GuestAccessTokenModel` (`guest_access_tokens` collection) storing SHA-256 token hashes with unique indexing. Zod schemas (`createGuestHouseholdSchema`, `updateGuestHouseholdSchema`, `publicRsvpSchema`).
  - **Repositories & Services:** `GuestHouseholdRepository`, `GuestAccessTokenRepository`, `GuestService` implementing CRUD, filtering, cursor pagination, cryptographically secure token generation (`crypto.randomBytes(32).toString('hex')`), hash-only persistence, access link rotation/reissuance, `markInvitationSent`, public invitation lookup with DTO allowlist & `Cache-Control: no-store, private`, and public/organiser RSVP submission.
  - **REST APIs:** `/api/v1/weddings/[weddingId]/guests`, `/api/v1/weddings/[weddingId]/guests/[householdId]`, `/access-link`, `/mark-invitation-sent`, `/api/v1/public/guest-access/[token]`, and `/api/v1/public/guest-access/[token]/rsvp`.
  - **Workspace UI & Public Experience:** Guests directory view (`/workspace/[weddingId]/guests`) with KPI cards & filter chips, `GuestHouseholdFormModal`, `GuestAccessLinkModal` (Copy Link & QR Code display), `GuestDetailDrawer`, updated sidebar navigation, and Public Branded Invitation Page (`/invitation/[token]`).
  - **Dashboard Integration:** Updated `WeddingService.getDashboardSummary` to aggregate real guest attendance metrics (`totalGuests`, `attendingGuests`).
  - **Testing & Verification:** Added 12 unit & integration tests in `src/__tests__/guests.test.ts`. Complete Vitest test suite passing (129 tests across 14 test files). Verified clean TypeScript compilation (`tsc --noEmit`), strict zero-warning ESLint (`npm run lint`), and Next.js production build (`npm run build`).
- **Key files:** `src/modules/guests/`, `src/app/api/v1/weddings/[weddingId]/guests/`, `src/app/api/v1/public/guest-access/`, `src/components/guests/`, `src/app/(workspace)/workspace/[weddingId]/guests/`, `src/app/invitation/[token]/`, `src/__tests__/guests.test.ts`, `docs/08-Guests-And-RSVP.md`.
- **Scope:** Covers guest household CRUD, embedded members, side attribution, secure token access links, QR code sharing, mark invitation sent, minimal public invitation page, public & organiser RSVP response, and dashboard metrics. Excludes guest user accounts, event-specific invitations/RSVP, direct WhatsApp API messaging, website builder, and gallery implementation.

### Final Readiness Check — 2026-09-26

- **Acceptance Matrix Verification:** Verified all 22 requirement areas across Household CRUD, Embedded Members, Guest Search & Filters, Security Token Lifecycle, Hash-only DB Storage, Public Invitation Access, Household RSVP Authorization, Dashboard Summaries, Tenant Isolation, and V1 Boundaries.
- **Chrome Manual QA Evidence:** Executed 22 end-to-end user journey test cases in Chrome browser (`http://localhost:3000`) via Puppeteer. Results: **22 PASS, 0 FAIL, 0 BLOCKED**. Captured 7 high-resolution full-page evidence screenshots in `guests_qa/`.
- **Repository Verification Suite Outcomes:**
  - `npm run lint` (`eslint . --max-warnings=0`): **PASS** (0 errors, 0 warnings).
  - `npm run typecheck` (`tsc --noEmit`): **PASS** (0 errors).
  - `npx vitest run`: **PASS** (14 test files, 132 tests passed, 100% pass rate).
  - `npm run build` (`npx next build`): **PASS** (Production build and static page generation completed cleanly in Next.js 16.3.5 Turbopack).
- **Final Recommendation:** **Ready for sign-off** (Technical & Operational Verification Complete).

## 10. Wedding Website & Builder

- **Status:** Completed
- **Last updated:** 2026-09-26
- **Implemented:** Built complete end-to-end Wedding Website & Builder module for Make My Marriage (Milestone 5).
  - **Models & Validation:** `WeddingSiteModel` (`wedding_sites` collection) with `UNIQUE(weddingId)` and `UNIQUE(slug)` indexes. Supported themes (`ROYAL_GOLD`, `FLORAL_PASTEL`, `MIDNIGHT_ROMANCE`, `VINTAGE_SEPIA`, `MINIMAL_ELEGANCE`). Zod schemas (`updateSiteSchema`, `sectionSchema`, `isReservedSlug`).
  - **Repositories & Services:** `WeddingSiteRepository` and `WeddingSiteService` implementing site CRUD, slug conflict resolution, reserved slug validation, section reordering/visibility, theme and style controls, authorized live preview, publishing lifecycle (`DRAFT` vs `PUBLISHED`), and public website lookup with dynamic event integration and CDN cache control (`Cache-Control: public, s-maxage=60, stale-while-revalidate=300`).
  - **REST APIs:** `/api/v1/weddings/[weddingId]/site`, `/publish`, `/unpublish`, `/preview`, and `/api/v1/public/weddings/[slug]`.
  - **Workspace UI & Modals:** Website Builder workspace page (`/workspace/[weddingId]/website`), `ThemeSelector.tsx`, `SiteSettingsModal.tsx`, `SectionEditorModal.tsx`, `LivePreviewModal.tsx`, and updated workspace sidebar navigation.
  - **Public Rendering Page:** Dynamic public rendering page at `/w/[slug]` with Next.js `generateMetadata` SEO title tags, meta descriptions, search engine `noindex` rules, theme typography, hero cover images, ceremony schedule, venue directions, and dress code.
  - **Security & Data Isolation:** Public responses use explicit `PublicWeddingSiteDTO` allowlists excluding internal notes, household details, invitation tokens, finances, private documents, and unpublished draft content. Household RSVP remains strictly behind secure digital invitation links (`/invitation/[token]`).
  - **Testing & Verification:** Added 10 unit & integration tests in `src/__tests__/wedding-site.test.ts`. Full Vitest test suite passing (142 tests across 15 test files). Verified clean TypeScript compilation (`tsc --noEmit`), strict zero-warning ESLint (`npm run lint`), and Next.js production build (`npm run build`).
- **Key files:** `src/modules/website/`, `src/app/api/v1/weddings/[weddingId]/site/`, `src/app/api/v1/public/weddings/[slug]/`, `src/components/website/`, `src/app/(workspace)/workspace/[weddingId]/website/`, `src/app/w/[slug]/`, `src/__tests__/wedding-site.test.ts`, `docs/09-Wedding-Website.md`.
- **Scope:** Covers website settings, URL handling, structured section schemas, theme/style controls, cover image selection, section ordering and visibility, ceremony schedule integration, authorized preview, publish/unpublish lifecycle, public rendering, SEO metadata, and CDN cache headers. Excludes arbitrary HTML/CSS editing, custom domains, gallery management, guestbook, livestream, and redesigning household RSVP.

### Final Readiness Check & Senior Code Review P1 Fixes — 2026-09-26

- **Acceptance Matrix Verification:** Verified all 22 requirement areas across Website Setup, Unique Public Slug Validation, Theme & Style Controls, Structured Section Editing, Image Selection, Section Ordering & Visibility, Event/Venue Presentation, Authorized Preview, Publishing Lifecycle, Cache Invalidation (`revalidateTag` & `revalidatePath`), Unpublished Site Protection (404 / SITE_UNPUBLISHED), Public Data Privacy, Tenant Isolation, Household RSVP Security, Responsive Layouts, and V1 Scope Exclusions.
- **Chrome Manual QA Evidence:** Executed 22 end-to-end browser QA scenarios via Puppeteer runner (`scripts/qa-website-runner.js`). Results: **22 PASS, 0 FAIL, 0 BLOCKED (100% Pass Rate)**. Captured 6 high-resolution full-page evidence screenshots in `website_qa/`.
- **Senior Code Review P1 Fixes (2026-09-26):**
  - Resolved `WEB-P1-01`: Implemented Next.js cache revalidation (`revalidateTag` & `revalidatePath`) in `WeddingSiteService.invalidateSiteCache` called automatically during `publishSite`, `unpublishSite`, and `updateSite` (when slug or site settings change). Invalidates public site tags (`wedding-site-${slug}`), rendering route `/w/${slug}`, and public DTO API route `/api/v1/public/weddings/${slug}`. Ensures unpublished sites or updated custom slugs are purged from edge CDN caches instantly. Regression verified with dedicated Vitest assertions.
- **Repository Verification Suite Outcomes:**
  - `npm run lint` (`eslint . --max-warnings=0`): **PASS** (0 errors, 0 warnings).
  - `npm run typecheck` (`tsc --noEmit`): **PASS** (0 errors).
  - `npx vitest run`: **PASS** (15 test files, 141 tests passed, 100% pass rate).
  - `npm run build` (`npx next build`): **PASS** (Production build and static page generation completed cleanly in Next.js 16.3.5 Turbopack).
- **Final Recommendation:** **Ready for sign-off** (Technical & Operational Verification Complete).

## 11. Wedding Experience — Gallery, Guestbook, Livestream & Emergency Contacts

- **Status:** Completed
- **Last updated:** 2026-09-26
- **Implemented:** Built complete end-to-end Wedding Experience module (Milestone 6) for Make My Marriage matching Stitch screens and system/database design docs.
  - **Models & Validation:** `MediaModel` (`media_vault` collection), `AlbumModel` (`media_albums` collection), `GuestbookEntryModel` (`guestbook_wishes` collection), `EmergencyContactModel` (`emergency_contacts` collection), and `EmergencyIssueModel` (`emergency_issues` collection). Zod validation schemas (`createAlbumSchema`, `uploadIntentSchema`, `completeUploadSchema`, `moderateMediaSchema`, `submitWishSchema`, `moderateWishSchema`, `createEmergencyContactSchema`).
  - **Cloudflare R2 Direct Uploads:** Implemented presigned upload intent generation, direct R2 binary uploads, upload key verification, object key sealing, and signed temporary access URLs.
  - **Guest Access Integration:** Guests access media upload intent, gallery viewing, wish submission, and emergency contacts directly using their existing secure digital invitation token (`/invitation/[token]`).
  - **Moderation Workflow:** Implemented organiser moderation queue (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`) for both guest photo/video submissions and guestbook wishes.
  - **YouTube Livestream & Website Integration:** Implemented safe YouTube URL parsing (`extractYouTubeVideoId`) supporting 11-character video IDs, standard watch URLs, short youtu.be links, embed links, and live channel links. Renders safe HTTPS iframe embeds on published wedding websites (`/w/[slug]`).
  - **Emergency Contacts:** Organiser directory (`/workspace/[weddingId]/emergency`) for ceremony leads, priests, transport leads, and venue contacts with priority badges. Public guest DTOs strictly omit private internal organiser notes (`notes`).
  - **Workspace & Public UI Pages:** Built Gallery page (`/workspace/[weddingId]/gallery`), Guestbook page (`/workspace/[weddingId]/guestbook`), Emergency page (`/workspace/[weddingId]/emergency`), updated workspace sidebar navigation, upgraded Public Digital Invitation (`/invitation/[token]`), and updated Public Website (`/w/[slug]`).
- **Senior Code Review P1 Security Fixes (2026-09-26):**
  - Resolved `EXP-P1-01`: Restricted `visibility: "PRIVATE"` media access in `MediaService.getMediaAccessUrl` when invoked with `allowPrivate: false` from public guest access token endpoints. Guests querying `mediaId` directly receive HTTP 403 Forbidden.
  - Resolved `EXP-P1-02`: Enforced `input.uploadKey.startsWith("uploads/temp/" + weddingId + "/")` in `MediaService.completeUpload` to prevent cross-wedding upload key substitution.
- **Repository Verification Suite Outcomes:**
  - `npm run lint` (`eslint . --max-warnings=0`): **PASS** (0 errors, 0 warnings).
  - `npm run typecheck` (`tsc --noEmit`): **PASS** (0 errors).
  - `npx vitest run`: **PASS** (16 test files, 143 tests passed, 100% pass rate).
  - `npm run build` (`npx next build`): **PASS** (Production build completed cleanly in Next.js 16.3.5 Turbopack).
- **Final Recommendation:** **Ready for sign-off** (Technical & Operational Verification Complete).

## 12. Pending Features & Future Roadmap Document

- **Status:** Documented & Tracked
- **Last updated:** 2026-09-26
- **Documentation:** Created [docs/11-Pending-Features-And-Roadmap.md](file:///var/www/html/makemymarriage/docs/11-Pending-Features-And-Roadmap.md) as a central living repository for all deferred capabilities, external service credential requirements (Resend email API, Cloudflare R2 object storage), V1 scope boundaries, and planned future release enhancements across all product modules.

## Future entries

For each major feature, add a numbered entry with its name, status (`In progress`, `Blocked`, or `Completed`), last updated date, implemented scope, key files where useful, and remaining work or known limitations. Keep the overview and document's last updated date in sync with the entries.


