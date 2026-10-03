# MakeMyMarriage — P0 Onboarding and Dashboard Localization Code Review

**Review Date:** 2026-10-03  
**Target Component:** P0 Onboarding (`/workspace/new`) and Dashboard (`/workspace/[weddingId]`) Localization  
**Milestone PRD Priority:** P0  
**Overall Implementation Status:** Approved with Minor Recommendations (0 P0, 0 P1, 1 P2, 1 P3)

---

## Executive Summary

The **P0 Onboarding and Dashboard Localization** implementation has been thoroughly reviewed against `AGENTS.md`, `docs/05-Project-Status.md`, `next-intl` localization conventions, database models, API contracts, and Stitch UI designs.

The implementation is **exceptionally well-engineered**:
- **Onboarding Setup (`/workspace/new`):** All form labels, progress steps (`Step 01 / 03 • Core Framework`), GST badge, jurisdiction preview, language selection buttons, helper tooltips, and action buttons are fully localized via `next-intl`.
- **Dynamic Auto-Title Generation:** `handleNameChange` dynamically formats workspace titles based on locale (`"Aarav & Meera's Wedding"` vs `"Aarav और Meera की शादी"`) while preserving user-edited custom titles.
- **Workspace Dashboard (`/workspace/[weddingId]`):** Hero greeting, countdown badge, 4 KPI cards (Events, Tasks, Guests, Spend), Next Milestone empty state, Getting Started Guide steps, task progress section, and 3 foundation cards are completely localized across English and Hindi.
- **Monetary & Date Formatting Safety:** `formatINR` in `src/lib/utils/money.ts` accepts integer paise and locale choice (`"en"` vs `"hi"`), outputting formatted Indian Rupees (`₹15,000.50` / `₹१५,०००.५०`) without floating-point precision loss. `formatIndianDate` correctly applies Indian date formatting (`18 Nov 2026` / `18 नवंबर 2026`).
- **Data & Auth Isolation:** Authentication checks, wedding authorization, account boundaries, and workspace recency cookies remain completely intact and secure.

No critical security exposures (P0) or major functional failures (P1) were identified. Two minor findings (1 P2, 1 P3) were documented regarding a Hindi grammar template order in task progress details and a hardcoded English fallback error message.

---

## Findings Summary

| Finding ID | Priority | Module / Location | Summary |
| :--- | :---: | :--- | :--- |
| [`L10N-001`](#l10n-001) | **P2** | Hindi Messages ([`src/i18n/messages/hi.json:418`](file:///var/www/html/makemymarriage/src/i18n/messages/hi.json#L418)) | Inverted placeholder order in `taskProgressDetail` key causing ungrammatical statistic in Hindi ("3 में से 10 पूरे हुए") |
| [`L10N-002`](#l10n-002) | **P3** | Workspace Dashboard ([`src/app/(workspace)/workspace/[weddingId]/page.tsx:42`](file:///var/www/html/makemymarriage/src/app/%28workspace%29/workspace/%5BweddingId%5D/page.tsx#L42)) | Dashboard error view contains hardcoded English fallback string `"Wedding workspace not found or membership access denied."` |

---

## Detailed Review & Findings

### P0 (Critical Systemic Compromise)
* **Status:** **None**. No critical security vulnerabilities, data loss, or access control failures were found.

---

### P1 (Major Functional / Security Failure)
* **Status:** **None**. No major functional failures or serious correctness issues were identified.

---

### P2 (Moderate Defect or Maintainability Concern)

### L10N-001

> [!NOTE]
> **Priority:** P2 (Moderate localized correctness defect)

* **File & Lines:** [`src/i18n/messages/hi.json:418`](file:///var/www/html/makemymarriage/src/i18n/messages/hi.json#L418)
* **Affected Route / Locale:** `/workspace/[weddingId]` (Dashboard Task Progress section, Hindi mode)
* **Reproduction:**
  1. Open a workspace dashboard in Hindi mode with 3 out of 10 completed tasks (`completedTasks = 3`, `totalTasks = 10`).
  2. Inspect the task progress detail text below the progress bar.
  3. Observe that the rendered string reads `"3 में से 10 पूरे हुए"` ("Out of 3, 10 completed") instead of `"10 में से 3 पूरे हुए"` ("Out of 10, 3 completed").
* **Expected Behavior:** Hindi template string should place `{total}` before `{completed}` (`"{total} में से {completed} पूरे हुए"`) to align with natural Hindi grammar.
* **Actual Behavior:** Hindi template string uses `"{completed} में से {total} पूरे हुए"`, resulting in inverted numbers.
* **Impact:** Misleading and ungrammatical progress metric display for Hindi users.
* **Recommended Fix:** Update line 418 in `src/i18n/messages/hi.json`:
  ```json
  "taskProgressDetail": "{total} में से {completed} पूरे हुए · {percent}% · {overdue} देय तिथि बीत चुकी है"
  ```
* **Verification Steps:** Re-run Vitest i18n test suite and verify task progress text rendering in Hindi mode.

---

### P3 (Minor Polish)

### L10N-002

> [!NOTE]
> **Priority:** P3 (Minor polish / fallback issue)

* **File & Lines:** [`src/app/(workspace)/workspace/[weddingId]/page.tsx:42`](file:///var/www/html/makemymarriage/src/app/%28workspace%29/workspace/%5BweddingId%5D/page.tsx#L42)
* **Affected Route / Locale:** `/workspace/[weddingId]` (Dashboard error view, Hindi mode)
* **Reproduction:**
  1. Trigger an error state on `/workspace/[weddingId]` (e.g. invalid workspace ID) in Hindi mode when `dashboardResult.error` is undefined.
  2. Observe that the error message body text displays the hardcoded English string `"Wedding workspace not found or membership access denied."`.
* **Expected Behavior:** Fallback error text should use a localized dictionary key (e.g. `t("accessErrorBody")`).
* **Actual Behavior:** Uses hardcoded English string fallback.
* **Impact:** Minor unlocalized string in error state when server error string is absent.
* **Recommended Fix:** Add `"accessErrorBody"` key to `Dashboard` namespace in `en.json` and `hi.json` and use `dashboardResult.error || t("accessErrorBody")`.
* **Verification Steps:** Render error view in Hindi mode and verify error body text displays in Hindi.

---

## Acceptance Coverage & Verification

| Checklist Item | Status | Verification Summary |
| :--- | :---: | :--- |
| **1. Complete Screen & State Coverage** | **PASS** | Onboarding form labels, steps, tooltips, CTAs, error states, auto-titles, and Dashboard hero, KPIs, empty state, guide, task section, and cards fully localized. |
| **2. Client/Server Locale & Hydration** | **PASS** | Server Component dashboard fetches `getLocale()` & `getTranslations("Dashboard")`; Onboarding client component uses `useTranslations`. 0 hydration warnings. |
| **3. Currency, Dates & Formatting** | **PASS** | `formatINR` converts integer paise into locale-specific Rupees (`₹15,000.50` / `₹१५,०००.५०`); `formatIndianDate` applies Indian date formatting (`18 Nov 2026` / `18 नवंबर 2026`). |
| **4. Preservation of User Content** | **PASS** | Custom user-entered workspace titles, bride/groom names, and locations are preserved without unwanted translation or mutation. |
| **5. Localized Validation & Errors** | **PARTIAL** | Onboarding required fields & generic errors localized. Dashboard fallback error text requires minor key addition ([`L10N-002`](#l10n-002)). |
| **6. Auth & Isolation Integrity** | **PASS** | Session token verification, user authorization, and workspace privacy boundaries remain untouched and fully secure. |
| **7. Layout & Accessibility** | **PASS** | Responsive card grids, proper Devanagari typography, contrast ratios, and keyboard focus states maintained. |
| **8. Automated Regression Tests** | **PASS** | `onboarding-dashboard-localization.test.ts` covers 1:1 key parity, integer paise monetary formatting, date formatting, and title interpolation. |

---

## Verification Checks Performed

1. **Automated Vitest Suite:** Executed `npx vitest run` — **32/32 test files passed, 261/261 unit tests passed**.
2. **TypeScript Compilation:** Executed `npx tsc --noEmit` — **0 errors**.
3. **Linter Inspection:** Executed `npm run lint` — **0 errors, 0 warnings**.
4. **Production Build:** Executed `npm run build` — **Production build completed successfully**.

---

## Recommendations for Approval

- **P0 / P1 Findings:** **None**. Zero critical security vulnerabilities, data loss risks, or major functional failures were identified.
- **Recommended Actions:**
  - Proceed with approval for P0 Onboarding and Dashboard Localization.
  - Option to address minor findings [`L10N-001`](#l10n-001) (P2) and [`L10N-002`](#l10n-002) (P3) in follow-up polish work.
