# Make My Marriage — Project Status

Last updated: 2026-09-23

This file tracks major implementation milestones. Add new features as work begins and update existing entries as they progress. Dates below indicate when progress was recorded, not necessarily when a feature was originally completed.

## Overview

| Milestone                             | Status    | Last updated |
| ------------------------------------- | --------- | ------------ |
| Project scaffold                      | Completed | 2026-09-23   |
| Marketing homepage                    | Completed | 2026-09-23   |
| Authentication                        | Completed | 2026-09-23   |
| Workspace & Wedding Tenant Management | Completed | 2026-09-23   |

## 1. Project scaffold

- **Status:** Completed
- **Last updated:** 2026-09-23
- **Implemented:** Established the Next.js, React, TypeScript, and Tailwind CSS project foundation, with package scripts for development, builds, type checking, linting, formatting, and tests. Created initial route structure for marketing, authentication, the workspace, and public wedding pages.
- **Documentation:** Added the PRD, system design, database design, and API design documents in `docs`.
- **Scope:** This milestone covers the application foundation; individual product features are tracked separately as they are implemented.

## 2. Marketing homepage

- **Status:** Completed
- **Last updated:** 2026-09-23
- **Implemented:** Built the homepage with branded navigation, a hero section, product introduction, feature sections for events, tasks, collaboration, guests, vendors, wedding websites, and galleries, plus how-it-works, Indian wedding, privacy, social proof, and footer sections. Replaced placeholder images with the true MakeMyMarriage Emblem SVG.
- **Key files:** `src/app/(marketing)/page.tsx` and `src/components/marketing/`.
- **Scope:** Completion refers to the marketing homepage UI. The product capabilities described on the page and the destination flows linked from it are separate implementation milestones.

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

## Future entries

For each major feature, add a numbered entry with its name, status (`In progress`, `Blocked`, or `Completed`), last updated date, implemented scope, key files where useful, and remaining work or known limitations. Keep the overview and document's last updated date in sync with the entries.
