# V1 Search Access Restrictions Implementation Review

## Executive Summary
This document summarizes the technical implementation, architectural enforcement, and verification results for the **V1 Search Access Restrictions** milestone in Make My Marriage (`/var/www/html/makemymarriage`).

All search, list, detail, and attachment endpoints strictly enforce active workspace membership, tenant isolation (`weddingId`), granular module permissions (`guests`, `vendors`, `finance`), event ceremony scopes (`eventScope`), document parent link validation (`EVENT`, `TASK`, `VENDOR`, `EXPENSE`), and orphan document omission policies.

---

## Access Control Matrix & Rules Applied

| Module / Resource | Permission Key Required | Ceremony / Scope Restrictions | Data Sanitization & Rules |
| :--- | :--- | :--- | :--- |
| **Events / Ceremonies** | Workspace Member | Restricted to `member.eventScope.eventIds` if `!allEvents` | Pre-limit DB filtering `_id: { $in: allowedEventIds }`. |
| **Tasks** | Workspace Member | Restricted to tasks linked to permitted events or unlinked tasks (`eventId: null`) | Restricted ceremony tasks omitted from query & counts. |
| **Guests** | `guests` | Wedding-wide | Hidden completely if `guests` permission is disabled. |
| **Vendors** | `vendors` | Vendor must be linked to at least 1 permitted event, or unlinked (`eventIds: []`) | Restricted event IDs stripped from DTO. Financial metrics zeroed out if `finance` permission is absent. |
| **Expenses** | `finance` | Restricted to expenses linked to permitted events, or unlinked (`eventId: null`) | Rejected expenses omitted (`approvalStatus != "REJECTED"`). Hidden if `finance` permission is absent. |
| **Documents** | Workspace Member + Parent Module Permission | Document's linked parent (`EVENT`, `TASK`, `VENDOR`, `EXPENSE`) must exist and be accessible by user | Orphan documents (missing parent) omitted from search & access URLs. |

---

## Technical Components Updated

### 1. `TeamAuthorization` (`src/modules/team/authorization/team.auth.ts`)
- Added domain-specific authorization helpers:
  - `canAccessEventId(member, eventId)`
  - `canAccessTask(member, task)`
  - `canAccessVendor(member, vendor)`
  - `canAccessExpense(member, expense)`
  - `canAccessDocument(member, doc, parentMaps)`

### 2. `SearchService` (`src/modules/search/services/search.service.ts`)
- Restructured `searchWorkspace` to execute **Pre-Limit DB Query Authorization**:
  - Embedded `_id: { $in: allowedEventIds }` directly in Mongoose queries before `.limit()`.
  - Batch validated document parents (`EVENT`, `TASK`, `VENDOR`, `EXPENSE`) in parallel before returning search results.
  - Sanitized shared vendor financial metrics and restricted ceremony IDs.

### 3. `DocumentService` (`src/modules/documents/services/document.service.ts`)
- Updated `getDocuments` and `getDocumentAccessUrl` to check parent document authorization and enforce orphan document policy.

### 4. `VendorService` (`src/modules/vendors/services/vendor.service.ts`)
- Updated `getVendors` and `getVendorById` to check `canAccessVendor`, mask financial metrics when `finance` permission is absent, and strip restricted ceremony IDs.

---

## Test Verification & Coverage

- **Regression Test File**: `src/__tests__/workspace-search-access.test.ts`
- **Total Test Suite**: 214 tests across 24 test files (100% PASS).
- **TypeScript**: `npx tsc --noEmit` (0 errors).
- **ESLint**: `npm run lint` (0 warnings, 0 errors).
- **Build**: `npm run build` (Next.js production build succeeded).

---

## QA & Handoff
For manual testing in Chrome, refer to `docs/qa/workspace-search-access-manual-qa.md`.
