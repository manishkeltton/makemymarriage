# 18. Workspace Quick Actions Integration

## Executive Summary

The V1 Workspace Quick Actions Integration connects the global workspace header `+ Add` dropdown menu and dashboard quick action buttons to reusable, fully functional creation and invitation modals across Make My Marriage. This enables users to seamlessly perform core workspace actions—**Add Ceremony**, **Create Task**, **Add Guest Family**, and **Invite Organiser**—from anywhere within their active wedding workspace.

---

## Architecture & Integration Scope

```
                             +-----------------------------------+
                             |     QuickActionsProvider          |
                             |  (Context & Modal Orchestrator)   |
                             +-----------------+-----------------+
                                               |
         +-------------------+-----------------+-------------------+-------------------+
         |                   |                                     |                   |
         v                   v                                     v                   v
+-----------------+ +-----------------+                   +-----------------+ +-----------------+
| Workspace       | | Dashboard       |                   | Dashboard       | | Page Shortcuts  |
| Header (+ Add)  | | Quick Actions   |                   | Banner CTA      | | & Buttons       |
| - Keyboard Nav  | | - 4 Action      |                   | - Add First     | | - Preselects    |
| - ARIA Menu     | |   Cards         |                   |   Event         | |   Ceremony      |
+--------+--------+ +--------+--------+                   +--------+--------+ +--------+--------+
         |                   |                                     |                   |
         +-------------------+-----------------+-------------------+-------------------+
                                               |
                                               v
                             +-----------------+-----------------+
                             |     Unified Creation Modals       |
                             |  (Fresh State, Options Preload)   |
                             +-----------------+-----------------+
                             | 1. EventFormModal               |
                             | 2. TaskFormModal                |
                             | 3. GuestHouseholdFormModal      |
                             | 4. InviteMemberModal            |
                             +-----------------------------------+
```

---

## Trigger Locations & Modal Handlers

| Action Name | Trigger Locations | Modal Component | Required Options | Server API Endpoint |
| ----------- | ----------------- | --------------- | ---------------- | ------------------- |
| **Add Ceremony** | Header `+ Add` menu, Dashboard footer, Banner CTA | `EventFormModal` | None | `POST /api/v1/weddings/[weddingId]/events` |
| **Create Task** | Header `+ Add` menu, Dashboard footer | `TaskFormModal` | `events`, `teamMembers` | `POST /api/v1/weddings/[weddingId]/tasks` |
| **Add Guest Family** | Header `+ Add` menu, Dashboard footer | `GuestHouseholdFormModal` | None | `POST /api/v1/weddings/[weddingId]/guests` |
| **Invite Organiser** | Header `+ Add` menu, Dashboard footer | `InviteMemberModal` | `weddingEvents` | `POST /api/v1/weddings/[weddingId]/member-invites` |

---

## Technical & Safety Features

### 1. Fresh Form State Enforcement
- Triggering any quick action modal explicitly passes `eventToEdit={null}`, `taskToEdit={null}`, and `household={null}`.
- Every modal invocation starts a fresh create or invite operation without retaining values from previous edits or modal sessions.

### 2. Wedding Switching Safety
- `QuickActionsProvider` listens to `activeWedding?.id` from `useWedding()`.
- If the user switches active wedding workspaces, any open quick action modal is automatically closed and form state is reset.
- Submissions are bound strictly to `currentWeddingId` validated at submission time.

### 3. Stale Response Protection
- Workspace options (`events`, `teamMembers`) needed for `TaskFormModal` and `InviteMemberModal` are fetched asynchronously per wedding ID.
- Stale responses from slow network requests on previously active weddings are checked and discarded using `weddingId` validation and cancellation flags.

### 4. Accessibility & Keyboard Navigation
- Header `+ Add` button includes full ARIA semantics: `aria-expanded`, `aria-haspopup="menu"`, `aria-controls="workspace-add-menu"`, and `aria-label`.
- The menu container uses `role="menu"` and `role="menuitem"` per WAI-ARIA guidelines.
- Pressing `Escape` while the dropdown menu is open closes the menu and returns focus to the `+ Add` button (`addButtonRef.current.focus()`).
- Upon closing any quick action modal, focus is restored to the triggering element.

---

## Verification & Test Coverage

- **Integration Test Suite**: `src/__tests__/quick-actions.test.ts`
- **Test Scenarios Verified**:
  1. Quick action dispatching for all 4 action types.
  2. Fresh form state initialization ensuring no stale inputs.
  3. Automatic modal closure and state reset on wedding workspace switching.
  4. Task ceremony preselection when triggered with an `eventId` context.
  5. Options fetching and stale response protection during rapid context switching.
  6. Graceful option fetch failure handling without broad data exposure or UI crashes.
  7. Server-side authorization and quota error messaging displayed inline.
- **Automated Verification Suite**:
  - `npm run typecheck`: **PASS** (0 errors).
  - `npm run lint`: **PASS** (0 errors, 0 warnings).
  - `npx vitest run`: **PASS** (22 test files, 203 passed, 100% pass rate).
  - `npm run build`: **PASS** (Next.js production build verified).
