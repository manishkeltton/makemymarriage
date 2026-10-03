# MakeMyMarriage — English/Hindi Localization Specification

Last updated: 2026-10-03

## Overview

MakeMyMarriage provides full P0 English and Hindi interface localization using `next-intl` (v4.14.5). Canonical route paths (`/login`, `/signup`, `/workspace`, `/profile`, `/w/[slug]`) remain clean without `/[locale]/` path prefixes.

## Key Rules & Policies

1. **Locale Resolution Precedence:**
   1. **Session User Preference:** Authenticated user's `preferredLanguage` (`"en"` | `"hi"`) from their account profile (`User` model via `getSessionToken()`).
   2. **Explicit Query Parameter:** `?lang=en` or `?lang=hi`.
   3. **Locale Cookie:** `mmm_locale` (`"en"` | `"hi"`).
   4. **Accept-Language Header:** `Accept-Language` header containing `"hi"` or `"en"`.
   5. **Default Fallback:** `"en"`.

2. **User Profile Integration:**
   - Setting language preference in `/profile` updates `User.preferredLanguage` via `PATCH /api/v1/auth/profile`.
   - On save, sets `mmm_locale` cookie and triggers `router.refresh()` to immediately re-render Server and Client components in the newly selected language.
   - User profile language preferences are strictly isolated per account and do not mutate public wedding website preferences.

3. **Message Dictionaries & Parity:**
   - English (`src/i18n/messages/en.json`) and Hindi (`src/i18n/messages/hi.json`) dictionaries maintain 100% 1:1 key parity.
   - Structured namespaces: `Common`, `Auth`, `Profile`, `Nav`, `Workspace`, `Events`, `Tasks`, `Guests`, `Vendors`, `Expenses`, `Documents`, `Team`, `Settings`, `Billing`, `Errors`, `Format`.
   - Placeholders (`{name}`, `{count}`, `{amount}`, `{year}`) match identically across locales.

4. **Indian Formatting Conventions:**
   - Currency (`formatINR`): Formatted with Indian numbering system (`₹1,50,000` / `₹१,५०,०००`) while preserving integer paise and exact calculations.
   - Dates (`formatIndianDate`): Formatted with Indian date conventions (`18 Nov 2026` / `18 नवंबर 2026`). Stored UTC timestamps and timezones remain unchanged.
   - Numbers (`formatIndianNumber`): Formatted with Indian grouping (`1,00,000`).

5. **Devanagari Typography & HTML Language Attribute:**
   - Dynamic `<html lang={locale}>` set in `RootLayout`.
   - Noto Sans Devanagari font CSS variable (`--font-noto-devanagari`) applied alongside Plus Jakarta Sans to prevent hydration mismatches and font rendering glitches.
