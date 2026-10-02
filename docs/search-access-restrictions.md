# Search Access Restrictions Specification

## Executive Summary

This document specifies the access control policies, permission matrix, and authorization boundaries for **V1 Workspace Search** and related module endpoints in **Make My Marriage**.

Search must strictly enforce multi-tenant isolation, active workspace membership, functional module permissions, ceremony event scoping, and parent document access rules across all six searchable workspace entities: **Events**, **Tasks**, **Guests**, **Vendors**, **Expenses**, and **Documents**.

---

## Access Policy Matrix

| Module | Required Permission Key | Ceremony Scope (`eventScope`) Applied? | Allowed Query Rule | Sanitization / Masking Rules |
| ------ | ----------------------- | ------------------------------------- | ------------------ | --------------------------- |
| **Events** | Active Workspace Member | Yes | `_id` in `allowedEventIds` (if `allEvents = false`) | Restricted ceremonies omitted before DB `limit` |
| **Tasks** | Active Workspace Member | Yes | `eventId` in `allowedEventIds` OR `eventId == null` | Restricted task records omitted before DB `limit` |
| **Guests** | `guests` permission | No (Wedding-wide) | Active member with `guests = true` | Excluded completely if `guests = false` |
| **Vendors** | `vendors` permission | Yes | `eventIds` overlap `allowedEventIds` OR `eventIds` empty | Omitted if `vendors = false`. Financials masked if `finance = false`. Restricted ceremony IDs stripped from metadata. |
| **Expenses** | `finance` permission | Yes | `eventId` in `allowedEventIds` OR `eventId == null` (and status != REJECTED) | Excluded completely if `finance = false` |
| **Documents** | Parent-dependent (see below) | Yes (via parent link) | Accessible parent entity OR standalone document | Excluded if parent is restricted, missing (orphan), or rejected expense |

---

## Detailed Entity Access Rules

### 1. Wedding Isolation & Membership Rules
- All queries MUST include `{ weddingId: new Types.ObjectId(weddingId) }`.
- User MUST be an active member (`status === "ACTIVE"` in `WeddingMember`).
- Admin role permissions apply strictly within their current active wedding workspace context. Admins cannot bypass tenant isolation across weddings.

### 2. Events Access
- **Permission**: Active workspace member.
- **Ceremony Scoping**:
  - `role === "ADMIN"` or `eventScope.allEvents === true`: Access all events in wedding.
  - `eventScope.allEvents === false`: Query MUST filter `_id: { $in: allowedEventObjIds }` at the database query level BEFORE applying `.limit()`.

### 3. Tasks Access
- **Permission**: Active workspace member.
- **Ceremony Scoping**:
  - `role === "ADMIN"` or `eventScope.allEvents === true`: Access all tasks in wedding.
  - `eventScope.allEvents === false`: Query MUST filter `$or: [{ eventId: { $in: allowedEventObjIds } }, { eventId: null }, { eventId: { $exists: false } }]` at the database query level BEFORE applying `.limit()`.

### 4. Guests Access
- **Permission**: `TeamAuthorization.requireWeddingPermission(weddingId, userId, "guests")`.
- **Scope**: Wedding-wide.
- **Rules**: If user lacks `guests` permission, return `[]` results and zero counts (no information leakage).

### 5. Vendors Access & Sanitization
- **Permission**: `TeamAuthorization.requireWeddingPermission(weddingId, userId, "vendors")`.
- **Ceremony Scoping**:
  - If `eventScope.allEvents === false`: Query MUST filter `$or: [{ eventIds: { $in: allowedEventObjIds } }, { eventIds: { $size: 0 } }, { eventIds: null }, { eventIds: { $exists: false } }]` at the database query level BEFORE `.limit()`.
- **Sanitization Rules**:
  - If user lacks `finance` permission (`finance = false`): Strip/zero-out financial fields (`agreedAmountPaise`, `totalExpensesPaise`, `totalPaidPaise`, `totalOutstandingPaise`).
  - If user is ceremony-restricted (`allEvents = false`): Filter `vendor.eventIds` in output DTO so restricted ceremony IDs outside `allowedEventIds` are stripped.

### 6. Expenses Access
- **Permission**: `TeamAuthorization.requireWeddingPermission(weddingId, userId, "finance")`.
- **Ceremony Scoping**:
  - `approvalStatus` MUST NOT be `"REJECTED"`.
  - If `eventScope.allEvents === false`: Query MUST filter `$or: [{ eventId: { $in: allowedEventObjIds } }, { eventId: null }, { eventId: { $exists: false } }]` at the database query level BEFORE `.limit()`.

### 7. Documents & Parent Access (Orphan Policy)
A document is accessible if and only if its parent entity is accessible:

| Document `relatedTo.type` | Parent Validation & Access Criteria |
| ------------------------ | ----------------------------------- |
| **None / Standalone** | Accessible to all active workspace members |
| **`EVENT`** | Parent `Event` MUST exist in `weddingId`. If `allEvents = false`, `Event._id` MUST be in `allowedEventIds`. |
| **`TASK`** | Parent `Task` MUST exist in `weddingId`. If `allEvents = false`, parent task's `eventId` MUST be in `allowedEventIds` or null/undefined. |
| **`VENDOR`** | User MUST have `vendors` permission. Parent `Vendor` MUST exist in `weddingId`. If `allEvents = false`, vendor's `eventIds` MUST overlap `allowedEventIds` or be empty. |
| **`EXPENSE`** | User MUST have `finance` permission. Parent `Expense` MUST exist in `weddingId` and status != `REJECTED`. If `allEvents = false`, expense's `eventId` MUST be in `allowedEventIds` or null/undefined. |

**Orphan Document Policy**: If a document references a `parentId` that does not exist in the database (deleted parent), access is **DENIED** (omitted from search and access URL generation returns `FORBIDDEN` / `NOT_FOUND`).

---

## Verification & Final Test Coverage

- **Integration Test Suite**: `src/__tests__/workspace-search-access.test.ts`
- **Chrome Manual QA Suite**: `docs/qa/search-access-restrictions-manual-qa.md`
- **Automated Verification Metrics**:
  - `npx vitest run`: **PASS** (24 test files, 215 passed, 100% pass rate).
  - `npm run typecheck`: **PASS** (0 errors).
  - `npm run lint`: **PASS** (0 errors, 0 warnings).
  - `npm run build`: **PASS** (Successful Next.js production build).
  - **Chrome Browser QA at `http://localhost:3000`**: **11 / 11 Scenarios PASSED (100.0% Pass Rate)**.
