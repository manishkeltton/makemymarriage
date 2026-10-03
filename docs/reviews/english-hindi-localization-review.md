# MakeMyMarriage — P0 English/Hindi Interface Integration Code Review

**Review Date:** 2026-10-03  
**Target Component:** English/Hindi Localization (`next-intl`, `src/i18n/`, `locale-resolver.ts`, `formatters.ts`, Auth Pages, Navigation Headers)  
**Milestone PRD Priority:** P0  
**Overall Implementation Status:** Approved with Minor Recommendations (0 P0, 0 P1, 3 P2, 1 P3)

---

## Executive Summary

The P0 English/Hindi Interface Integration implementation has been thoroughly reviewed against `AGENTS.md`, `docs/english-hindi-localization.md`, `next-intl` guidelines, database models, dictionary files, API contracts, and UI components.

The core architecture and dictionary foundations are **exceptionally well-constructed**:
- **100% Key Parity:** `en.json` and `hi.json` maintain perfect 1:1 key parity across all 425 keys, with identical interpolation placeholders (`{year}`, `{date}`, etc.) and no empty strings.
- **Indian Numbering & Date Conventions:** `formatINR`, `formatIndianDate`, and `formatIndianNumber` in `src/lib/formatters.ts` format currency (`₹1,50,000`), dates (`18 Nov 2026` / `18 नवंबर 2026`), and quantities with Indian grouping while preserving underlying numeric calculations and UTC timestamps.
- **Security & Validation:** Locale validation (`isValidLocale`) strictly restricts supported locales to `"en"` and `"hi"`, preventing arbitrary file imports or path traversal attacks.
- **Document Metadata:** `<html lang={locale}>` in `RootLayout` correctly mirrors the resolved UI locale.
- **Self-Profile Integration:** Updating `preferredLanguage` on `/profile` updates `User.preferredLanguage` in MongoDB, sets the `mmm_locale` cookie, and re-renders server/client components via `router.refresh()`.

No critical systemic vulnerabilities (P0) or broken P0 localization journeys (P1) were identified. Four minor findings (3 P2, 1 P3) were documented regarding query parameter resolution, font CSS fallbacks, API error message localization, and header language switcher controls.

---

## Findings Summary

| Finding ID | Priority | Module / Location | Summary |
| :--- | :---: | :--- | :--- |
| [`I18N-001`](#i18n-001) | **P2** | `Locale Resolver` ([`src/lib/i18n/locale-resolver.ts:13-47`](file:///var/www/html/makemymarriage/src/lib/i18n/locale-resolver.ts#L13-L47)) | `getEffectiveLocale()` omits explicit `?lang=en` / `?lang=hi` query parameter resolution specified in precedence rules |
| [`I18N-002`](#i18n-002) | **P2** | Global Styles ([`src/app/globals.css:64-74`](file:///var/www/html/makemymarriage/src/app/globals.css#L64-L74)) | `var(--font-noto-devanagari)` defined on `RootLayout` is missing from CSS font-family stacks, causing system font fallbacks for Devanagari |
| [`I18N-003`](#i18n-003) | **P2** | Auth Pages ([`src/app/(auth)/login/page.tsx:54`](file:///var/www/html/makemymarriage/src/app/%28auth%29/login/page.tsx#L54), `signup/page.tsx`) | Auth forms bypass `getLocalizedErrorMessage()`, displaying untranslated raw English API error strings in Hindi mode |
| [`I18N-004`](#i18n-004) | **P3** | Header Navigation ([`src/components/marketing/MarketingHeader.tsx`](file:///var/www/html/makemymarriage/src/components/marketing/MarketingHeader.tsx)) | Absence of a quick language switcher toggle (`EN \| HI`) in top navigation headers |

---

## Detailed Review & Findings

### I18N-001

> [!NOTE]
> **Priority:** P2 (Significant localized correctness defect)

* **File & Lines:** [`src/lib/i18n/locale-resolver.ts:13-47`](file:///var/www/html/makemymarriage/src/lib/i18n/locale-resolver.ts#L13-L47)
* **Affected Locale / Route:** All routes (`/login`, `/signup`, `/workspace`, `/profile`, `/w/[slug]`)
* **Reproduction:**
  1. Access any page with an explicit `?lang=hi` URL query parameter as an unauthenticated guest (e.g. `http://localhost:3000/login?lang=hi`).
  2. Observe that `getEffectiveLocale()` evaluates session, cookie, Accept-Language header, and default fallback, but does not parse `?lang=` from searchParams.
* **Expected Behavior:** Per `docs/english-hindi-localization.md` section 1, `?lang=en` or `?lang=hi` query parameters should take precedence over cookies and `Accept-Language` headers (Precedence Step 2).
* **Actual Behavior:** `getEffectiveLocale()` skips query parameter evaluation entirely.
* **Impact:** Inability to override UI language via direct URLs containing `?lang=hi` or `?lang=en`.
* **Proposed Fix:** Update `getEffectiveLocale()` to accept optional searchParams or inspect request headers (`x-url`) to resolve `?lang=`.
* **Regression Test:** Add a unit test in `src/__tests__/locale-resolution.test.ts` asserting that `getEffectiveLocale()` returns `"hi"` when `?lang=hi` query parameter is present.

---

### I18N-002

> [!NOTE]
> **Priority:** P2 (Significant localized formatting / typography defect)

* **File & Lines:** [`src/app/globals.css:64-74`](file:///var/www/html/makemymarriage/src/app/globals.css#L64-L74), [`src/app/layout.tsx:13-16`](file:///var/www/html/makemymarriage/src/app/layout.tsx#L13-L16)
* **Affected Locale / Route:** All Hindi interface routes (`lang="hi"`)
* **Reproduction:**
  1. Set UI language to Hindi (`lang="hi"`).
  2. Inspect body text or heading font family in Chrome DevTools.
  3. Observe that CSS variables in `globals.css` only list `var(--font-plus-jakarta-sans), sans-serif` without including `var(--font-noto-devanagari)`.
* **Expected Behavior:** Devanagari text should utilize the `Noto_Sans_Devanagari` font loaded in `RootLayout` (`var(--font-noto-devanagari)`).
* **Actual Behavior:** Devanagari text falls back to generic browser/system sans-serif fonts instead of Noto Sans Devanagari.
* **Impact:** Inconsistent Devanagari typography and potential glyph rendering discrepancies across operating systems.
* **Proposed Fix:** Include `var(--font-noto-devanagari)` in the CSS font stack in `globals.css` or specify an `html:lang(hi)` rule:
  ```css
  --font-body-md: var(--font-plus-jakarta-sans), var(--font-noto-devanagari), sans-serif;
  ```
* **Regression Test:** Verify in Chrome DOM inspector that Devanagari elements compute font-family including `Noto Sans Devanagari`.

---

### I18N-003

> [!NOTE]
> **Priority:** P2 (Significant localized correctness defect)

* **File & Lines:** [`src/app/(auth)/login/page.tsx:54`](file:///var/www/html/makemymarriage/src/app/%28auth%29/login/page.tsx#L54), [`src/app/(auth)/signup/page.tsx:64`](file:///var/www/html/makemymarriage/src/app/%28auth%29/signup/page.tsx#L64), `forgot-password/page.tsx`, `reset-password/page.tsx`
* **Affected Locale / Route:** `/login`, `/signup`, `/forgot-password`, `/reset-password` (Hindi mode)
* **Reproduction:**
  1. Switch UI language to Hindi.
  2. Submit invalid login credentials on `/login`.
  3. Observe that the error banner displays the raw English server string (`"Invalid email or password."`) rather than the localized Hindi string (`"अमान्य ईमेल या पासवर्ड।"`).
* **Expected Behavior:** Server error codes (`INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `SESSION_EXPIRED`, etc.) should be localized using `getLocalizedErrorMessage(code, tErrors, defaultMsg)`.
* **Actual Behavior:** Authentication pages extract `data.error?.message` directly from API JSON responses and pass raw English strings to component state.
* **Impact:** Hindi users encounter untranslated English error banners during authentication failures.
* **Proposed Fix:** Use `getLocalizedErrorMessage(data.error?.code, tErr, data.error?.message)` when setting error messages in auth forms.
* **Regression Test:** Add component/integration test checking that API error code `INVALID_CREDENTIALS` renders `"अमान्य ईमेल या पासवर्ड।"` in Hindi mode.

---

### I18N-004

> [!NOTE]
> **Priority:** P3 (Minor usability / polish issue)

* **File & Lines:** [`src/components/marketing/MarketingHeader.tsx`](file:///var/www/html/makemymarriage/src/components/marketing/MarketingHeader.tsx), [`src/components/workspace/workspace-header.tsx`](file:///var/www/html/makemymarriage/src/components/workspace/workspace-header.tsx)
* **Affected Locale / Route:** Header navigation on marketing landing page and workspace layout
* **Reproduction:**
  1. Navigate to `/` or `/workspace`.
  2. Observe that there is no explicit header toggle button (`EN \| HI` / `हिन्दी`) to quickly switch languages without navigating into `/profile`.
* **Expected Behavior:** Unauthenticated guests and workspace users can easily toggle interface language directly from top headers.
* **Actual Behavior:** Language selection is currently only available on the `/profile` page or via cookie manipulation.
* **Impact:** Extra navigation steps for guests wanting to switch language on the home or auth pages.
* **Proposed Fix:** Add a compact language selector dropdown/button in `MarketingHeader` and `WorkspaceHeader`.
* **Regression Test:** Verify clicking the language toggle updates the `mmm_locale` cookie and triggers `router.refresh()`.

---

## Acceptance Coverage & Verification

| Checklist Item | Status | Verification Summary |
| :--- | :---: | :--- |
| **1. P0 Route & State Coverage** | **PASS** | Home, Auth (`/login`, `/signup`, `/forgot-password`, `/reset-password`), `/workspace` header/sidebar, and `/profile` localized. 100% dictionary key parity. |
| **2. Locale Resolution & Independence** | **PARTIAL** | User session, cookie, Accept-Language, and fallback work. `?lang=` query param resolution missing ([`I18N-001`](#i18n-001)). Personal/wedding preferences isolated. |
| **3. Server/Client Rendering & Fonts** | **PARTIAL** | `<html lang={locale}>` and `NextIntlClientProvider` configured. Font variable missing from CSS stack ([`I18N-002`](#i18n-002)). |
| **4. Auth & Navigation Flows** | **PASS** | Profile language updating sets `mmm_locale` cookie and triggers `router.refresh()`. Session token logout preserves clean state. |
| **5. Stable Business Data & Formatters** | **PASS** | `formatINR`, `formatIndianDate`, and `formatIndianNumber` preserve exact numeric inputs and UTC timestamps while applying Indian formatting conventions. |
| **6. Translation Quality & Errors** | **PARTIAL** | Dictionary translations are accurate and natural. Auth forms display raw English API errors ([`I18N-003`](#i18n-003)). |
| **7. Devanagari & Layout Integrity** | **PASS** | No layout clipping or text overlap in Devanagari mode. Clean mobile responsive drawers. |
| **8. Performance & Maintainability** | **PASS** | Fast build times, 31/31 Vitest test files passing (255/255 unit tests). Clean type safety and dictionary validation. |
| **9. Security & Validation** | **PASS** | `isValidLocale()` strictly blocks untrusted inputs, preventing path traversal or malicious locale values. |

---

## Verification Checks Performed

1. **Automated Vitest Suite:** Executed `npx vitest run` — **31/31 test files passed, 255/255 unit tests passed**.
2. **Dictionary Parity Check:** Executed `src/__tests__/i18n-parity.test.ts` — verified 100% key parity and placeholder alignment across `en.json` and `hi.json`.
3. **Locale & Formatter Suite:** Executed `src/__tests__/locale-resolution.test.ts` — verified Indian currency (`₹1,50,000`), Indian date formatting, and error code mappings.
4. **TypeScript & Lint Integrity:** Ran `npx tsc --noEmit` (0 errors) and `npm run lint` (0 errors, 0 warnings).

---

## Recommendations & Approval Status

- **P0 / P1 Findings:** **None**. Zero critical security vulnerabilities, data corruption issues, or broken core localization journeys were identified.
- **User Resolution Decision (2026-10-03):** Confirmed no code fixes required for the release milestone. All 31 test files (255 unit tests) pass, dictionary parity is 100% verified, and the system is approved for production deployment. Minor findings ([`I18N-001`](#i18n-001), [`I18N-002`](#i18n-002), [`I18N-003`](#i18n-003), [`I18N-004`](#i18n-004)) remain recorded for future non-blocking polish.
