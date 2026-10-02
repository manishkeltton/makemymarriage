# V1 Search Result Navigation Specification & Design Implementation

Last updated: 2026-10-02

This document details the design contracts, routing rules, single-record read APIs, state & URL synchronization, and QA scenarios for V1 Search Result Navigation across the Make My Marriage workspace (`/workspace/[weddingId]`).

---

## 1. Overview & Destination Contracts

Search result items across all 6 core workspace modules map to dedicated deep-link target URLs within `/workspace/[weddingId]`:

| Module | Search Result Type | Navigation Contract / Target URL | Display Behavior |
| ------ | ------------------ | -------------------------------- | ---------------- |
| Events | `event` | `/workspace/[weddingId]/events/[eventId]` | Navigates to existing Event Detail RSC page |
| Tasks | `task` | `/workspace/[weddingId]/tasks?taskId=[taskId]` | Opens `TaskDetailDrawer` slide-over |
| Guests | `guest` | `/workspace/[weddingId]/guests?householdId=[householdId]` | Opens `GuestDetailDrawer` slide-over |
| Expenses | `expense` | `/workspace/[weddingId]/expenses?expenseId=[expenseId]` | Opens `ExpenseDetailDrawer` slide-over |
| Vendors | `vendor` | `/workspace/[weddingId]/vendors?vendorId=[vendorId]` | Scrolls to, reveals, and highlights exact vendor card |
| Documents | `document` | `/workspace/[weddingId]/documents?documentId=[documentId]` | Scrolls to, reveals, and highlights exact document card |

---

## 2. Off-Page & Off-Filter Record Resolution

When a user opens a search result link or direct URL (e.g. `/workspace/[weddingId]/tasks?taskId=tsk_123`):
1. **Primary Lookup:** The page checks the currently loaded items list (e.g. `tasks` state). If found, the drawer/highlight is activated immediately.
2. **Fallback API Resolution:** If absent from the loaded list (e.g. due to search filters, category filters, pagination, or off-page placement), the page issues an isolated single-record GET call:
   - `GET /api/v1/weddings/[weddingId]/tasks/[taskId]`
   - `GET /api/v1/weddings/[weddingId]/guests/[householdId]`
   - `GET /api/v1/weddings/[weddingId]/expenses/[expenseId]`
   - `GET /api/v1/weddings/[weddingId]/vendors/[vendorId]`
   - `GET /api/v1/weddings/[weddingId]/documents/[documentId]`
3. **Single Read Endpoints:** Added `GET /api/v1/weddings/[weddingId]/documents/[documentId]` and `GET /api/v1/weddings/[weddingId]/vendors/[vendorId]` endpoints with full tenant isolation and `TeamAuthorization` checks (`requireWeddingMembership`, module scope permissions, ceremony scope permissions).

---

## 3. URL & State Synchronization Rules

- **Direct Navigation & Refresh:** Deep-linked search params open drawers/highlights upon initial page render.
- **Drawer Close / Selection Clear:** Closing a drawer or dismissing a highlight cleans up the selection param (`router.replace`) while preserving all unrelated query params (such as `filter`, `category`, `q`).
- **Race Condition Prevention:** Out-of-order or late API responses are validated against `resolvedUrlIdRef`. Stale or outdated responses for previously clicked IDs are discarded without mutating UI state.
- **No Automatic Mutative Behavior:** Navigating to or opening a result item presents read-only view state. It does not open edit forms, trigger data mutations, or cause automatic document file downloads.

---

## 4. QA Scenarios & Fixtures for Chrome QA

### Scenario 1: Drawer Opening via Direct Link (Task & Guest)
- **URL:** `/workspace/[weddingId]/tasks?taskId=tsk_001`
- **Expected:** Task drawer opens displaying task details for `tsk_001`. Closing drawer updates URL to `/workspace/[weddingId]/tasks` without refreshing or losing page state.

### Scenario 2: Off-Filter Vendor Card Highlight
- **URL:** `/workspace/[weddingId]/vendors?category=Catering&vendorId=vnd_999` (where `vnd_999` is a Photography vendor)
- **Expected:** Single GET fetches `vnd_999`, reveals and highlights card with subtle pulse animation, without clearing category filter.

### Scenario 3: Unauthorized or Deleted Record ID
- **URL:** `/workspace/[weddingId]/expenses?expenseId=invalid_or_unauthorized_id`
- **Expected:** Page loads normally. Single GET returns 404/403. Page gracefully ignores missing record without crashing or showing broken state.
