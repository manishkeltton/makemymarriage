# Milestone 3 — Money & Vendors Documentation

**Status:** Completed  
**Last updated:** 2026-09-26

## Executive Summary

Milestone 3 implements the comprehensive **Money & Vendors Module** for Make My Marriage. It introduces integer paise (INR) financial tracking, vendor directory procurement, expense management with single-step approvals, scheduled payment instalments, MEMBER vs OTHER payer attribution, linked contracts/receipts vault integration, and real workspace dashboard spend integration.

---

## Key Capabilities & Business Rules

### 1. Integer Paise Monetary Engine
- All monetary values are stored and calculated internally as **non-negative integer paise** (1 Rupee = 100 Paise) to eliminate floating-point precision errors.
- Input rupee values (e.g. `"25000.50"`, `1500`) are safely converted using string parsing without `Math.round` float overflow.
- Display values use standard `en-IN` locale formatting (`formatINR(2500050)` -> `"₹25,000.50"`).
- Expense totals and vendor agreed amounts must be non-negative ($\ge 0$). Payment amounts must be strictly positive ($> 0$).

### 2. Vendor Directory Module (`src/modules/vendors/`)
- Mongoose model `Vendor` with `(weddingId, category)`, `(weddingId, name)`, and `(weddingId, eventIds)` compound indexes.
- Supported categories: `VENUE`, `CATERER`, `PHOTOGRAPHER`, `VIDEOGRAPHER`, `DECORATOR`, `DJ`, `CHOREOGRAPHER`, `MAKEUP_ARTIST`, `MEHENDI_ARTIST`, `PANDIT`, `INVITATION_DESIGNER`, `ENTERTAINMENT`, `OTHER`.
- Same-wedding reference validation: `eventIds` linked to a vendor are verified against the active wedding workspace.
- Deleting a vendor cleanly unlinks `vendorId` from associated expenses without corrupting financial records (`ExpenseRepository.unlinkVendorFromExpenses`).
- Permission: Requires `vendors` permission or `ADMIN` workspace role.

### 3. Expense & Approval Module (`src/modules/expenses/`)
- Mongoose model `Expense` with single-step approval workflow (`PENDING`, `APPROVED`, `REJECTED`).
- Supported categories: `VENUE`, `CATERING`, `DECORATION`, `PHOTOGRAPHY`, `MAKEUP`, `CLOTHING`, `JEWELLERY`, `ENTERTAINMENT`, `INVITATION`, `GIFTS`, `CEREMONY`, `TRANSPORT`, `MISCELLANEOUS`, `OTHER`.
- Deleting an expense cascades to delete all associated payment instalments (`ExpensePaymentRepository.deletePaymentsByExpenseId`).
- Rejected expenses are excluded from active workspace budget and financial metrics.
- Permission: Requires `finance` permission or `ADMIN` workspace role.

### 4. Expense Payments & Payer Attribution
- Mongoose model `ExpensePayment` stored in a separate `expense_payments` collection.
- Statuses: Recorded payments (`PAID`) and scheduled instalments (`PENDING`).
- Runtime Derived Status: When a payment's status is `PENDING` and `dueAt < current_time`, `effectiveStatus` evaluates to `OVERDUE`.
- Payer Attribution (`paidBy`):
  - `MEMBER`: Requires an active `userId` from `wedding_members` in the same wedding workspace.
  - `OTHER`: Requires a descriptive `name` string (e.g. "Groom's Relative / External Payer").
- Payer summaries group confirmed paid amounts per team/family member or external contributor.

### 5. Private Documents & Receipts Vault Integration
- Documents linked to expenses (`relatedType: "EXPENSE"`, `relatedId: expenseId`) reuse the document vault infrastructure with tenant authorization checks.

### 6. Workspace Dashboard Integration
- The workspace dashboard hero banner and spend KPI card calculate real-time tracked expense totals, confirmed paid amounts, and overdue payment alerts via `WeddingService.getDashboardSummary`.

---

## Domain Architecture

```
Route Handler
  └── Zod Schema Validation (createExpenseSchema, createPaymentSchema, etc.)
      └── Authentication (getSessionToken, AuthService.verifySession)
          └── Tenant Authorization (TeamAuthorization.requireWeddingPermission / ADMIN check)
              └── Service Layer (ExpenseService, VendorService)
                  ├── Same-Wedding Reference Verification (EventRepository, VendorRepository)
                  └── Repository Layer (ExpenseRepository, ExpensePaymentRepository, VendorRepository)
                      └── Mongoose Models (Expense, ExpensePayment, Vendor)
```

---

## API Endpoints Reference

### Vendors API
- `POST /api/v1/weddings/[weddingId]/vendors` — Create vendor
- `GET /api/v1/weddings/[weddingId]/vendors` — List vendors with filters (category, q, eventId) & pagination
- `GET /api/v1/weddings/[weddingId]/vendors/[vendorId]` — Get vendor details with financials
- `PATCH /api/v1/weddings/[weddingId]/vendors/[vendorId]` — Update vendor details
- `DELETE /api/v1/weddings/[weddingId]/vendors/[vendorId]` — Delete vendor (unlinks from expenses)

### Expenses API
- `POST /api/v1/weddings/[weddingId]/expenses` — Create expense
- `GET /api/v1/weddings/[weddingId]/expenses` — List expenses with filters & pagination
- `GET /api/v1/weddings/[weddingId]/expenses/[expenseId]` — Get expense details
- `PATCH /api/v1/weddings/[weddingId]/expenses/[expenseId]` — Update expense details
- `DELETE /api/v1/weddings/[weddingId]/expenses/[expenseId]` — Delete expense (cascades payments)
- `POST /api/v1/weddings/[weddingId]/expenses/[expenseId]/approval` — Single-step approve/reject

### Expense Payments API
- `POST /api/v1/weddings/[weddingId]/expenses/[expenseId]/payments` — Create payment/instalment
- `GET /api/v1/weddings/[weddingId]/expenses/[expenseId]/payments` — List payments for expense
- `PATCH /api/v1/weddings/[weddingId]/expenses/[expenseId]/payments/[paymentId]` — Update payment
- `DELETE /api/v1/weddings/[weddingId]/expenses/[expenseId]/payments/[paymentId]` — Delete payment
- `GET /api/v1/weddings/[weddingId]/payments` — List workspace-wide payments

### Finance Summary API
- `GET /api/v1/weddings/[weddingId]/finance/summary` — Workspace financial metrics & breakdown

---

## Automated Verification & Test Results

- **TypeScript Compilation:** Passed cleanly with 0 errors (`npx tsc --noEmit` / `npm run typecheck`).
- **ESLint Cleanliness:** Passed cleanly with 0 errors and 0 warnings (`npm run lint`).
- **Unit & Integration Test Suite:** 24/24 tests passed in `src/__tests__/vendors.test.ts` and `src/__tests__/expenses.test.ts`. Complete workspace suite: 117/117 tests passed across 13 test files.
- **Production Build:** Verified with `npm run build` (`npx next build` Turbopack production build succeeded cleanly).
- **Chrome Manual QA:** Executed 22 end-to-end user journey test cases in Chrome browser via Puppeteer (`http://localhost:3000`). Results: **22 PASS, 0 FAIL, 0 BLOCKED**.
- **Senior Code Review P1 Fixes:** All 5 approved P1 code review issues (`MONEY-P1-01` to `MONEY-P1-05`) fully fixed and regression tested.
- **Final Readiness Recommendation:** **Ready for sign-off**.
