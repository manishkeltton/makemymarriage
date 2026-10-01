# 17. Event & Ceremony Workspace Integration

## Executive Summary

The V1 Event & Ceremony Workspace Integration transforms individual wedding ceremonies (Sangeet, Mehendi, Haldi, Reception, Wedding Rituals) into fully functional, dedicated operational hubs. By breaking down traditional siloed modules, planners and family members can view and manage all vendors, expenses, tasks, and contract documents in the direct context of the ceremony where they occur.

---

## Architecture & Integration Scope

```
                             +-----------------------------------+
                             |     Event / Ceremony Workspace     |
                             | (e.g. Sangeet / Mehendi / Haldi)  |
                             +-----------------+-----------------+
                                               |
         +-------------------+-----------------+-------------------+-------------------+
         |                   |                                     |                   |
         v                   v                                     v                   v
+-----------------+ +-----------------+                   +-----------------+ +-----------------+
| Ceremony        | | Ceremony        |                   | Ceremony        | | Ceremony        |
| Vendors         | | Expenses        |                   | Tasks           | | Documents       |
| - Link / Unlink | | - Single-step   |                   | - Pre-filtered  | | - Bound to      |
| - Same-wedding  | |   Approvals     |                   |   Workspace     | |   EVENT context |
|   Validation    | | - Integer Paise |                   | - Prefilled     | | - Intent &      |
| - Idempotent    | |   Financials    |                   |   Creation      | |   Upload        |
+-----------------+ +-----------------+                   +-----------------+ +-----------------+
```

---

## Data Models & Relations

### 1. Vendor Model (`VendorModel.eventIds`)
- Vendors store associated ceremony references in an array of `ObjectId`s (`eventIds: Types.ObjectId[]`).
- Linking a vendor to a ceremony uses atomic MongoDB `$addToSet` to ensure idempotency.
- Unlinking a vendor from a ceremony uses atomic MongoDB `$pull`. Unlinking removes only the specified ceremony association while preserving the vendor record and all other ceremony associations.

### 2. Expense Model (`ExpenseModel.eventId`)
- Ceremony expenses store `eventId` directly.
- Financial metrics (Total Expenses, Confirmed Paid, Outstanding Balance) are computed strictly from non-rejected expenses where `expense.eventId == currentEventId`.

### 3. Task Model (`TaskModel.eventId`)
- Tasks linked to a ceremony store `eventId`.
- Navigating to `/workspace/[weddingId]/tasks?eventId=evt_xxx` pre-filters the tasks view and pre-fills the `eventId` selector when adding a new task.

### 4. Document Model (`DocumentModel.relatedTo`)
- Documents store structured relation info: `{ type: "EVENT", id: eventId }`.
- Navigating to `/workspace/[weddingId]/documents?eventId=evt_xxx` filters the vault documents and binds newly uploaded files to the ceremony context.

---

## API Endpoints

### 1. Link Vendor to Event
- **Endpoint**: `POST /api/v1/weddings/[weddingId]/vendors/[vendorId]/events/[eventId]`
- **Authorization**: Requires active wedding membership and `vendors` permission or `ADMIN` role.
- **Validation**: Verifies that both vendor and event exist under `weddingId`.
- **Response**: `200 OK` with updated `VendorDTO`.

### 2. Unlink Vendor from Event
- **Endpoint**: `DELETE /api/v1/weddings/[weddingId]/vendors/[vendorId]/events/[eventId]`
- **Authorization**: Requires active wedding membership and `vendors` permission or `ADMIN` role.
- **Behavior**: Atomically pulls `eventId` from `vendor.eventIds`.
- **Response**: `200 OK` with updated `VendorDTO`.

---

## Financial Metrics Engine

Ceremony financial calculations are executed strictly in integer paise to avoid rounding discrepancies:

$$\text{Total Expenses Paise} = \sum_{e \in E_{\text{active}}} \text{totalAmountPaise}_e$$

$$\text{Confirmed Paid Paise} = \sum_{e \in E_{\text{active}}} \text{paidAmountPaise}_e$$

$$\text{Outstanding Balance Paise} = \sum_{e \in E_{\text{active}}} \max(0, \text{totalAmountPaise}_e - \text{paidAmountPaise}_e)$$

where $E_{\text{active}} = \{ e \mid e.\text{eventId} = \text{currentEventId} \land e.\text{status} \neq \text{"REJECTED"} \}$.

---

## Verification & Test Coverage

- **Integration Test Suite**: `src/__tests__/event-workspace.test.ts`
- **Scenarios Verified**:
  1. Atomic vendor ceremony linking and unlinking idempotency.
  2. Tenant isolation rejecting cross-wedding vendor or event reference IDs.
  3. Preservation of vendor records and other ceremony links upon unlinking.
  4. Precise ceremony financial calculations excluding `REJECTED` expenses.
  5. Permission enforcement (`FORBIDDEN` code for unauthorized users).
- **Automated Verification**: `npm run typecheck`, `npm run lint`, `npx vitest run`, `npm run build`.
