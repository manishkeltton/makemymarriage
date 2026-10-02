# 19. Workspace Search Specification

## Executive Summary

The V1 Workspace Search provides a centralized, instant search engine for **Make My Marriage**. Located in the global workspace header and accessible via universal keyboard shortcuts (`Ctrl+K` / `Cmd+K`), it enables wedding planners, hosts, and team members to rapidly locate records across their active wedding workspace. 

Search operates with strict multi-tenant isolation and role-based access control, indexing six core workspace modules: **Events**, **Vendors**, **Guests**, **Tasks**, **Expenses**, and **Documents**.

---

## Design System & Stitch Screen References

Visual patterns and responsive layouts are aligned with approved **Stitch designs**:

- **Desktop Search Modal & Result Navigation**: `projects/9705578657101269064/screens/89e028b534e64d06803334e362aa2d57`
  - *Title*: `MakeMyMarriage — Search Result Navigation & Exact Record Target Drawers`
- **Mobile Responsive Search & View**: `projects/9705578657101269064/screens/7afa266af6be43c4a861ab872736a596`
  - *Title*: `MakeMyMarriage — Mobile Workspace Search & Results`

### Aesthetic & Visual Standards
- **Palette**: Warm Ivory canvas (`#FBF8F4`), Pure White surface cards (`#FFFFFF`), Ceremonial Wine brand accent (`#762B3A`), Muted Ink text (`#6E6763`), and Hairline borders (`#E9E2DC`).
- **Typography**: Plus Jakarta Sans with tabular numbers for financial figures and uppercase micro-labels for module tags.
- **Elevation**: Tier 3 popover shadow (`0 10px 24px -4px rgba(33, 29, 28, 0.07)`) with backdrop mask (`rgba(33, 29, 28, 0.30)` + 4px backdrop blur).

---

## Scope & Non-Goals

### In-Scope Searchable Modules & Fields
Search matches substring queries against exact attributes within the currently active wedding workspace (`weddingId`):

| Module | Searchable Attribute | Context Badges Displayed | Result Type Code |
| ------ | ------------------- | ------------------------ | ---------------- |
| **Events** | `Event.name` | Date, Suggestion Type (`SANGEET`, `WEDDING`, etc.) | `EVENT` |
| **Tasks** | `Task.title` | Category, Priority (`HIGH`, `MEDIUM`), Status (`TODO`, `IN_PROGRESS`, `COMPLETED`) | `TASK` |
| **Guests** | `GuestHousehold.name` | Side (`GROOM`, `BRIDE`), Confirmed Count, RSVP Status | `GUEST` |
| **Vendors** | `Vendor.name` | Category (`DECORATOR`, `PHOTOGRAPHER`, etc.), Status | `VENDOR` |
| **Expenses** | `Expense.title` | Amount (`₹`), Status (`APPROVED`, `PENDING`), Category | `EXPENSE` |
| **Documents** | `Document.title` | File Format (`PDF`, `PNG`), Category (`CONTRACT`, `INVOICE`, `RECEIPT`) | `DOCUMENT` |

### Out of Scope (Explicit Non-Goals)
- File content indexing or OCR (PDF/Image text extraction).
- Vector/semantic AI search.
- Cross-wedding or multi-tenant global search.
- Search outside the active wedding workspace shell.
- Redesigning unrelated workspace page headers or navigation sidebars.

---

## System Architecture & Interaction Flow

```
                                 +-------------------------------------+
                                 |        Workspace Header             |
                                 |  [ Search wedding... (Ctrl+K) ]     |
                                 +------------------+------------------+
                                                    | (Click or Ctrl+K)
                                                    v
                                 +-------------------------------------+
                                 |       WorkspaceSearchModal          |
                                 |  - Keyboard Trap & Shortcut Listener|
                                 +------------------+------------------+
                                                    |
                                          (Debounced input >= 2 chars)
                                                    |
                                                    v
                                 +-------------------------------------+
                                 | GET /api/v1/weddings/[id]/search    |
                                 | - Tenant Isolation (weddingId)      |
                                 | - Team Authorization & Permission   |
                                 +------------------+------------------+
                                                    |
                                                    v
                                 +-------------------------------------+
                                 |    Search Results List (Grouped)    |
                                 |  - Events, Tasks, Guests, Vendors,  |
                                 |    Expenses, Documents              |
                                 +------------------+------------------+
                                                    |
                                    (Enter key or Mouse Click)
                                                    |
                                                    v
         +-------------------+----------------------+-------------------+-------------------+
         |                   |                      |                   |                   |
         v                   v                      v                   v                   v
+-----------------+ +------------------+  +------------------+ +-----------------+ +------------------+
| Event Detail    | | Task Drawer      |  | Household Drawer | | Vendor Directory| | Documents Vault  |
| Page            | | (?taskId=...)    |  | (?householdId=..)| | (?vendorId=..)| | (?documentId=..) |
| /events/[id]    | | /tasks           |  | /guests          | | /vendors        | | /documents       |
+-----------------+ +------------------+  +------------------+ +-----------------+ +------------------+
```

---

## Navigation Destinations & Exact Target Contracts

When a user selects a result from the search list, the search modal automatically closes and navigates to the exact record:

| Entity Type | Target Route Pattern | Open Mechanism | Fallback Behavior |
| ----------- | -------------------- | -------------- | ----------------- |
| **Event** | `/workspace/[weddingId]/events/[eventId]` | Page Navigation | Redirect to `/workspace/[weddingId]/events` if missing |
| **Task** | `/workspace/[weddingId]/tasks?taskId=[taskId]` | URL query param opens `TaskDetailDrawer` | Show toast "Task not found" if deleted |
| **Guest** | `/workspace/[weddingId]/guests?householdId=[householdId]` | URL query param opens `HouseholdDetailDrawer` | Show toast "Household not found" if deleted |
| **Expense** | `/workspace/[weddingId]/expenses?expenseId=[expenseId]` | URL query param opens `ExpenseDetailDrawer` | Show toast "Expense not found" if deleted |
| **Vendor** | `/workspace/[weddingId]/vendors?vendorId=[vendorId]` | Focuses vendor card / detail drawer in `/vendors` | Redirect to `/vendors` if removed |
| **Document** | `/workspace/[weddingId]/documents?documentId=[documentId]` | Opens `DocumentDetailDrawer` in `/documents` | Redirect to `/documents` if purged |

---

## State Machine Specification

The workspace search UI must handle seven distinct operational states:

### 1. Initial / Idle State
- Displayed when search modal opens before typing.
- Displays quick helper shortcuts:
  - `Press ↑ ↓ to navigate`
  - `Press Enter to select`
  - `Press Esc to close`
- Shows recent search history (if available locally).

### 2. Minimum Query Length State (`< 2` characters)
- Triggered when query string length is 1 character.
- Displays subtle inline prompt: `"Type at least 2 characters to search..."`.
- Suppresses API network requests.

### 3. Loading State (Debounced 250ms)
- Active while fetching results from `/api/v1/weddings/[weddingId]/search?q={query}`.
- Shows animated loading shimmer / skeleton rows for each module section.

### 4. Results Display State
- Results grouped by module sections: **Events**, **Tasks**, **Guests**, **Vendors**, **Expenses**, **Documents**.
- Matches highlighted with bold query text.
- Maximum 5 matches per module section (up to 30 total).

### 5. No Results State
- Triggered when API returns zero matches across all permitted modules.
- Displays clean empty state card: `"No matches found for '{query}'"`.
- Offers suggestion: `"Check for typos or try searching by category or title."`

### 6. Error & Network Retry State
- Triggered on network failure, 500 server error, or timeout.
- Displays alert banner: `"Unable to load search results. Please try again."` with a **Retry** button.

### 7. Workspace Switch Context Reset
- Listens to active wedding context changes (`activeWedding.id`).
- Automatically cancels pending fetch requests, clears input state, and closes search modal.

---

## API & Data Contract

### Endpoint Specification
- **HTTP Method**: `GET`
- **Path**: `/api/v1/weddings/[weddingId]/search`
- **Query Parameters**:
  - `q` (required, string, trimmed, min 2 chars, max 100 chars)
  - `limit` (optional, integer, default 5, max 20 per module)

### Response DTO Structure (`SearchResponseDTO`)

```json
{
  "success": true,
  "data": {
    "query": "sangeet",
    "totalMatches": 5,
    "results": {
      "events": [
        {
          "id": "evt_66f4e123",
          "name": "Sangeet Night & Dance Competition",
          "startAt": "2026-11-12T18:30:00.000Z",
          "eventType": "SANGEET",
          "targetUrl": "/workspace/wed_9981/events/evt_66f4e123"
        }
      ],
      "tasks": [
        {
          "id": "tsk_88d123",
          "title": "Finalize Sangeet Choreographer & Playlist",
          "status": "IN_PROGRESS",
          "priority": "HIGH",
          "category": "Ceremony & Puja",
          "targetUrl": "/workspace/wed_9981/tasks?taskId=tsk_88d123"
        }
      ],
      "guests": [
        {
          "id": "hh_33e456",
          "name": "Verma Household (Sangeet Performers)",
          "side": "BRIDE",
          "memberCount": 4,
          "rsvpStatus": "CONFIRMED",
          "targetUrl": "/workspace/wed_9981/guests?householdId=hh_33e456"
        }
      ],
      "vendors": [
        {
          "id": "ven_11a789",
          "name": "Sangeet Sound & Stage Lighting Crew",
          "category": "DECORATOR",
          "status": "BOOKED",
          "targetUrl": "/workspace/wed_9981/vendors?vendorId=ven_11a789"
        }
      ],
      "expenses": [
        {
          "id": "exp_44b012",
          "title": "Sangeet Stage Lighting Deposit",
          "amountPaise": 4500000,
          "status": "APPROVED",
          "targetUrl": "/workspace/wed_9981/expenses?expenseId=exp_44b012"
        }
      ],
      "documents": [
        {
          "id": "doc_55c345",
          "title": "Sangeet-Sound-Contract.pdf",
          "fileType": "CONTRACT",
          "mimeType": "application/pdf",
          "targetUrl": "/workspace/wed_9981/documents?documentId=doc_55c345"
        }
      ]
    }
  }
}
```

---

## Authorization & Security Boundaries

1. **Tenant Isolation**:
   - `weddingId` from URL path is validated against current user's session membership.
   - Cross-wedding data leakage is strictly prohibited at repository query level (`{ weddingId, name: { $regex: escapedQuery, $options: "i" } }`).

2. **Permission-Gated Module Results**:
   - Server checks `TeamAuthorization.requireWeddingPermission(...)` before querying each module:
     - `events`: Checked against member event scope permissions.
     - `tasks`: Requires task view access.
     - `guests`: Requires guest view access.
     - `vendors`: Requires vendor view access.
     - `expenses`: Requires `FINANCE_READ` authorization.
     - `documents`: Requires document vault view access.
   - **Zero Leaks**: If a user lacks permission for a module (e.g. `FINANCE_READ` for Expenses), the server returns an empty array `[]` for that module key. Total count badges **must not** count restricted items.

---

## Accessibility & Keyboard Controls

- **Modal Trigger**:
  - Global listener for `Ctrl+K` (Windows/Linux) and `Cmd+K` (macOS).
  - Clicking header search bar or mobile search icon.
- **Focus Trap**: Focus is locked within search input while modal is open.
- **Keyboard Navigation**:
  - `ArrowDown`: Moves selection down through grouped result list.
  - `ArrowUp`: Moves selection up through grouped result list.
  - `Enter`: Triggers navigation to highlighted result's `targetUrl` and closes search modal.
  - `Escape`: Closes search modal and restores focus to `triggerElement` (or header search bar fallback).
- **ARIA Semantics**:
  - Search input: `role="combobox"`, `aria-expanded="true"`, `aria-autocomplete="list"`, `aria-controls="workspace-search-results"`.
  - Results container: `role="listbox"`, `id="workspace-search-results"`.
  - Result options: `role="option"`, `aria-selected="true/false"`.

---

## Verification & Acceptance Criteria (Chrome at http://localhost:3000)

The implementation can be verified using the following Chrome manual acceptance criteria:

1. **Desktop Keyboard Launch**:
   - Navigate to `/workspace/[weddingId]`. Press `Ctrl+K` (or `Cmd+K`).
   - Verify modal opens instantly, background is dimmed with backdrop blur, and focus is placed in search input.

2. **Query & Result Grouping**:
   - Type `"Sangeet"`. Verify loading shimmer appears for < 250ms.
   - Verify results are returned grouped under **Events**, **Tasks**, **Guests**, **Vendors**, **Expenses**, **Documents**.

3. **Navigation to Exact Record Target**:
   - Use `ArrowDown` to highlight a Task result. Press `Enter`.
   - Verify modal closes and URL changes to `/workspace/[weddingId]/tasks?taskId=...`, opening `TaskDetailDrawer`.

4. **Permission Isolation Test**:
   - Sign in as a team member without `FINANCE_READ` permission.
   - Search for a known expense title.
   - Verify Expenses section returns no results and no count leakage occurs.

5. **Edge State Handling**:
   - Type a random string like `"xyz999888"`.
   - Verify `"No matches found"` empty state card is displayed.

---

## Verification & Final Test Coverage

- **Integration Test Suite**: `src/__tests__/workspace-search.test.ts`
- **Chrome Manual QA Suite**: `docs/qa/workspace-search-manual-qa.md`
- **Automated Verification Metrics**:
  - `npx vitest run`: **PASS** (23 test files, 209 passed, 100% pass rate).
  - `npm run typecheck`: **PASS** (0 errors).
  - `npm run lint`: **PASS** (0 errors, 0 warnings).
  - `npm run build`: **PASS** (Successful Next.js production build with `/api/v1/weddings/[weddingId]/search`).
  - **Chrome Browser QA at `http://localhost:3000`**: **18 / 18 Scenarios PASSED (100.0% Pass Rate)**.

---

## Design Approval Status & Unresolved Decisions

- **Design Approval Status**: **APPROVED**
  - Reference screens `89e028b534e64d06803334e362aa2d57` and `7afa266af6be43c4a861ab872736a596` in Stitch project `projects/9705578657101269064` are formally approved.
- **Unresolved Decisions / Future Enhancements**:
  - LocalStorage persistence of recent searches (deferred to V2).
  - Search filter chips (e.g. `type:task sangeet`) for advanced power users (deferred to V2).
