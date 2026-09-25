# Make My Marriage — Project Status

Last updated: 2026-09-25

This file tracks major implementation milestones. Add new features as work begins and update existing entries as they progress. Dates below indicate when progress was recorded, not necessarily when a feature was originally completed.

## Overview

| Milestone                             | Status    | Last updated |
| ------------------------------------- | --------- | ------------ |
| Project scaffold                      | Completed | 2026-09-23   |
| Marketing homepage                    | Completed | 2026-09-23   |
| Authentication                        | Completed | 2026-09-23   |
| Workspace & Wedding Tenant Management | Completed | 2026-09-23   |
| Event Management — Ceremonies & Venues| Completed | 2026-09-24   |
| Team Management — Invites, Roles & Scope| In progress | 2026-09-25   |

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

- **Status:** In progress
- **Last updated:** 2026-09-25
- **Implemented:** Implemented complete end-to-end Team Management and Member Invitation milestone matching Stitch designs and system/database design docs. Created `WeddingMemberInvite` Mongoose model with `(weddingId, normalizedEmail, status)` and `UNIQUE(tokenHash)` indexes, plus MongoDB outbox `EmailJob` model and `EmailService` outbox dispatcher. Built cryptographically secure token hashing (`SHA-256`), tenant-safe repositories (`TeamMemberRepository`, `TeamInviteRepository`), `TeamService` with atomic invitation acceptance transactions, reusable `TeamAuthorization` helpers (`requireWeddingAdmin`, `requireWeddingPermission`, `requireEventAccess`), and Zod schemas (`createInviteSchema`, `updateMemberSchema`). Enforced mandatory **Final Admin Protection** preventing the demotion or removal of the last remaining Admin. Implemented REST APIs for member listing, role/permissions/scope editing, member soft deletion (`status = REMOVED`), invite creation, resend, revoke, public preview, and acceptance. Built Team workspace UI (`/workspace/[weddingId]/team`), `InviteMemberModal`, `EditMemberModal`, `RemoveMemberModal`, and Public Invitation Preview page (`/invite/[token]`) with account email matching enforcement and login/signup return flow. Comprehensive Vitest test suite added in `src/__tests__/team.test.ts`.
- **Key files:** `src/modules/team/`, `src/app/api/v1/weddings/[weddingId]/members/`, `src/app/api/v1/weddings/[weddingId]/member-invites/`, `src/app/api/v1/public/member-invites/`, `src/components/team/`, `src/app/(workspace)/workspace/[weddingId]/team/`, `src/app/invite/[token]/`.
- **Scope:** Covers team member listing, access management, invitations, secure tokens, resend/revoke, public preview, acceptance flow, role/permissions/scope editing, member removal, final Admin protection, responsive Stitch UI, and test suite.

### Invitation delivery correction — 2026-09-25

- Preserved the 2026-09-24 team implementation milestone; live email delivery requires further deployment validation.
- Dispatch is awaited during create/resend, jobs are claimed atomically, and missing settings, provider rejection, and network timeouts are recorded as FAILED instead of mock SENT results. Provider acceptance is exposed in create/resend responses and UI; shareable links remain available on delivery failure. Email HTML escapes user content.
- Invitation links prefer APP_ORIGIN, support the existing NEXT_PUBLIC_APP_URL and Vercel production-domain fallback, and reject localhost/HTTP in production. URL configuration is checked before creating or rotating invitation tokens.
- Validation: email delivery regression tests, existing team tests, and TypeScript check. No live email sent.
- Remaining: configure RESEND_API_KEY and a verified RESEND_FROM_EMAIL, set the production APP_ORIGIN, redeploy, and verify inbox delivery plus acceptance with the invited account. SENT means provider acceptance, not confirmed inbox delivery. Failed jobs require manual Resend; no automatic retry worker or delivery webhook is implemented.

## Future entries

For each major feature, add a numbered entry with its name, status (`In progress`, `Blocked`, or `Completed`), last updated date, implemented scope, key files where useful, and remaining work or known limitations. Keep the overview and document's last updated date in sync with the entries.
