# Milestone 5 — Wedding Website & Builder Documentation

**Status:** Completed  
**Last updated:** 2026-09-26

## Executive Summary

Milestone 5 implements structured configuration-driven Wedding Website Builder, theme presets, section ordering & visibility controls, authorized live preview, publication lifecycle (`DRAFT` vs `PUBLISHED`), public rendering page (`/w/[slug]`), SEO metadata control, and security isolation for Make My Marriage.

---

## Key Features & Architectural Highlights

1. **Website Model & Configuration Schema**:
   - `WeddingSite` schema (`wedding_sites` collection) with `UNIQUE(weddingId)` and `UNIQUE(slug)` indexes.
   - Status transitions: `DRAFT` vs `PUBLISHED` (with `publishedAt` timestamp).
   - Supported themes: `ROYAL_GOLD`, `FLORAL_PASTEL`, `MIDNIGHT_ROMANCE`, `VINTAGE_SEPIA`, `MINIMAL_ELEGANCE`.
   - Structured sections array (`HERO`, `OUR_STORY`, `SCHEDULE`, `VENUE`, `COUPLE`, `DRESS_CODE`, `RSVP_CTA`, `TIMELINE`, `GALLERY_TEASER`, `CUSTOM`).
   - SEO configuration (`title`, `description`, `noIndex`).

2. **Reserved Route Protection & Slug Validation**:
   - Slug validator enforces lowercase alphanumeric and hyphens (`/^[a-z0-9-]+$/`).
   - Validation against platform reserved slugs: `login`, `signup`, `workspace`, `api`, `invite`, `invitation`, `admin`, `settings`, `public`, `w`, etc.
   - Automatic slug conflict resolution during initial workspace setup.

3. **Workspace Builder UI & Modals**:
   - Workspace Builder view (`/workspace/[weddingId]/website`) with live status badge, instant publish toggle, section reordering, and theme styling controls.
   - `ThemeSelector.tsx`: Visual preview cards for theme presets with primary & secondary color chips, custom color picker, and font family selection (`Playfair Display`, `Cormorant Garamond`, `Cinzel`, `Inter`, `Plus Jakarta Sans`).
   - `SiteSettingsModal.tsx`: Public URL slug management, primary locale, SEO title tag, meta description, and `noindex` search engine indexing toggle.
   - `SectionEditorModal.tsx`: Section-specific content editing, titles, narrative text, cover image URLs with quick sample selection, and visibility toggles.
   - `LivePreviewModal.tsx`: Live workspace preview across Desktop and Mobile viewports for authorized team members.

4. **Public Rendering & Cache Lifecycle**:
   - Public route: `/w/[slug]`.
   - Dynamic Next.js `generateMetadata` for SEO search engine title tags, meta descriptions, and robots indexing controls.
   - Public API: `GET /api/v1/public/weddings/[slug]` with CDN Cache-Control headers (`public, s-maxage=60, stale-while-revalidate=300`).
   - Unpublished/Draft mode protection: Returns 404 / site unpublished status for unauthenticated or non-published site requests while allowing preview for authorized workspace members.

5. **Security & Data Allowlist Isolation**:
   - Explicit `PublicWeddingSiteDTO` allowlist exposes only couple names, event dates/locations, published ceremony schedules, venue directions, and user-configured section content.
   - Internal notes, household details, guest invitation tokens, finances, private documents, and unpublished draft changes are strictly excluded.
   - Household RSVP remains strictly behind secure invitation token links (`/invitation/[token]`).

---

## Documented REST API Endpoints

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/weddings/:weddingId/site` | `website` perm / ADMIN | Fetch workspace website configuration |
| `PATCH` | `/api/v1/weddings/:weddingId/site` | `website` perm / ADMIN | Update slug, theme, styles, SEO, or sections |
| `POST` | `/api/v1/weddings/:weddingId/site/publish` | `website` perm / ADMIN | Transition website status to PUBLISHED |
| `POST` | `/api/v1/weddings/:weddingId/site/unpublish` | `website` perm / ADMIN | Transition website status to DRAFT |
| `GET` | `/api/v1/weddings/:weddingId/site/preview` | `website` perm / ADMIN | Fetch live preview DTO for workspace members |
| `GET` | `/api/v1/public/weddings/:slug` | Public | Fetch published website DTO with cache headers |

---

## Automated Verification & Test Results

- **TypeScript Compilation:** Passed cleanly with 0 errors (`npm run typecheck` / `tsc --noEmit`).
- **ESLint Cleanliness:** Passed cleanly with 0 errors and 0 warnings (`npm run lint` / `eslint . --max-warnings=0`).
- **Unit & Integration Test Suite:** 9/9 tests passed in `src/__tests__/wedding-site.test.ts`. Full repository test suite: 141/141 tests passed across 15 test files (`npx vitest run`).
- **Production Build:** Verified with `npm run build` (`npx next build` Turbopack production build succeeded cleanly in Next.js 16.3.5).
- **Chrome Manual QA Suite:** Executed 22 end-to-end browser QA tests (`scripts/qa-website-runner.js`). Results: **22 PASS, 0 FAIL, 0 BLOCKED**. Captured 6 evidence screenshots in `website_qa/`.
- **Senior Code Review P1 Fixes (WEB-P1-01):** Cache invalidation via `revalidateTag` and `revalidatePath` verified on publish, unpublish, and slug update.

---

## Documented V1 Scope & Non-Goals

1. **No Arbitrary Code Execution:** Website builder uses configuration-driven section schemas; custom HTML/CSS/JS execution is strictly excluded for security.
2. **No Custom Domain Binding:** Sites are served under standard path `/w/[slug]`; custom CNAME domain mapping is deferred.
3. **No Gallery/Guestbook/Livestream:** Media galleries, interactive guestbooks, and video livestreams are managed in separate modules or future releases.
4. **Household RSVP Privacy:** Household RSVP remains strictly behind secure digital invitation links (`/invitation/[token]`).
