# V1 Search Access Restrictions — Manual QA Test Report

**Date:** October 2, 2026  
**Project:** Make My Marriage (`/var/www/html/makemymarriage`)  
**Application URL:** `http://localhost:3000`  
**Tester:** Chrome QA Agent  
**Environment:** Next.js 16.3.5 (Turbopack Dev Mode), Node.js v20.19.4, Linux 6.6, Chrome 151 (`Google Chrome 151.0.7922.71`)  
**Viewports Tested:** Desktop 1280x800px, Mobile 390x844px  
**Database:** Local In-Memory MongoDB (`mongodb://127.0.0.1:41789/MakeMyMarriageDB`)  
**Working Tree Context:** Branch `dev`, revision verified clean with 0 build or lint errors  

---

## 1. Executive Summary

This manual QA test report documents end-to-end browser verification of **V1 Search Access Restrictions** for Make My Marriage (`/var/www/html/makemymarriage`) executed directly in **Google Chrome 151** at `http://localhost:3000`.

Testing evaluated multi-tenant isolation, active workspace membership verification, functional module permissions (`guests`, `vendors`, `finance`), ceremony event scoping (`eventScope`), document parent access rules, orphan document suppression, shared vendor financial masking, direct API scope enforcement, candidate limit expansion, and responsive viewports.

All manual QA test cases **PASSED** with a **100.0% Pass Rate**.

---

## 2. Test Account Roles & Permissions

*Note: In compliance with security rules, plain-text passwords and session tokens are redacted.*

| Account Identifier | Role | Event Scope (`eventScope`) | Functional Permissions | Tested Access Boundaries |
| :--- | :--- | :--- | :--- | :--- |
| `sar_admin_*@test.com` | `ADMIN` | All Events (`allEvents = true`) | Full Workspace Access | Full access to all events, tasks, guests, vendors, expenses, and documents workspace-wide. |
| `sar_selected_*@test.com` | `ORGANISER` | Restricted (`allEvents = false`, `eventIds = [Ceremony A]`) | `guests=true`, `vendors=true`, `finance=true` | Access strictly limited to Ceremony A records; Ceremony B records omitted from search and return HTTP 403 on direct APIs. |
| `sar_nofinance_*@test.com` | `ORGANISER` | All Events (`allEvents = true`) | `guests=true`, `vendors=true`, `finance=false` | Access to events, tasks, guests, vendors; Expenses search returns empty array `[]`; Shared vendor financials masked to 0. |
| `Unauthenticated / Revoked` | `NONE` | N/A | None | Search & API endpoints return HTTP 401 `AUTH_REQUIRED` or HTTP 403 `FORBIDDEN`. |

---

## 3. Comprehensive Manual QA Matrix

| Test ID | Test Scenario & Steps | Expected Result | Actual Result | Status | Evidence & References |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `SAR-TC-01` | **Admin Account Full Workspace Access Verification**<br>1. Log in as Admin.<br>2. Search `"Haldi"` (Ceremony B). | Admin search returns all ceremony records (Events, Tasks, Expenses, Documents) across full wedding workspace. | Returned all matching records across workspace. | **PASS** | Screenshot: `sar_01_admin_workspace.png` |
| `SAR-TC-02` | **Selected-Ceremony Scope Enforcement**<br>1. Log in as Ceremony A-scoped member.<br>2. Search `"Haldi"` (restricted) vs `"Sangeet"` (allowed). | Restricted Haldi records return 0 matches; allowed Sangeet records return valid hits cleanly. | Restricted ceremony records omitted before DB limit; allowed records returned cleanly. | **PASS** | Screenshot: `sar_02_selected_ceremony_workspace.png` |
| `SAR-TC-03` | **Wedding-Wide Unassigned Record Discoverability**<br>1. Search unassigned task (`"Save-the-Date"`). | Unassigned tasks (`eventId == null`) are discoverable to all active members regardless of ceremony scope. | Unassigned task returned in search results. | **PASS** | `GET /search?q=Save-the-Date` (200 OK) |
| `SAR-TC-04` | **Shared Vendor Access & Financial Metric Masking**<br>1. Inspect shared vendor linked to Ceremonies A & B as `finance=false` member. | Shared vendor appears if any linked ceremony is allowed; financial fields (`agreedAmountPaise`, `totalExpensesPaise`) masked to 0 when `finance=false`. | Shared vendor accessible; financial figures masked to 0. | **PASS** | Vendor DTO financial fields masked cleanly. |
| `SAR-TC-05` | **Missing Finance Permission Expense Omission**<br>1. Search known expense title (`"Lighting"`) as `finance=false` member. | Expenses section returns empty array `[]` and 0 total matches in JSON response body (no UI or network disclosure). | Expenses array empty in network response payload. | **PASS** | `GET /search` JSON payload audit clean. |
| `SAR-TC-06` | **Direct API Module Endpoint Scope Enforcement (`SAR-002`)**<br>1. Send direct GET requests to restricted `/events/[id]` and `/tasks/[id]`. | Direct API requests return HTTP 403 `FORBIDDEN`, preventing ceremony scope bypass via direct endpoints (`SAR-002` resolved). | HTTP 403 FORBIDDEN returned for restricted event and task endpoints. | **PASS** | Direct API scope enforcement verified. |
| `SAR-TC-07` | **Document Parent Access & Access URL Security (`SAR-001`)**<br>1. Search documents and request access URL for restricted Haldi document. | Allowed parent document (Sangeet) returned; restricted parent document (Haldi) omitted; access URL request returns HTTP 403 `FORBIDDEN`. | Parent-dependent document authorization and URL security verified. | **PASS** | `canAccessDocument` & `getDocumentAccessUrl` verified. |
| `SAR-TC-08` | **Candidate Document Limit Expansion Window (`SAR-001`)**<br>1. Search workspace where restricted documents appear first in Mongoose results. | `SearchService` expands candidate document limit window (`safeLimit * 10`), ensuring accessible document matches past restricted ones are discovered. | `SAR-001` candidate limit expansion verified. | **PASS** | Pre-limit candidate expansion window verified. |
| `SAR-TC-09` | **Vendor Financial Aggregates Ceremony Isolation (`SAR-003`)**<br>1. Inspect shared vendor financial aggregates as ceremony-restricted member with finance permission. | Vendor financial totals (`totalExpensesPaise`, `totalPaidPaise`) include ONLY expenses from allowed Ceremony A, isolating financial figures from restricted Ceremony B (`SAR-003` resolved). | Vendor financial totals reflect ONLY allowed ceremony expenses. | **PASS** | `SAR-003` financial aggregate ceremony isolation verified. |
| `SAR-TC-10` | **Revoked Membership & Session Authentication Barrier**<br>1. Send search request to non-member workspace context. | Server rejects request with HTTP 401 `AUTH_REQUIRED` / HTTP 403 `FORBIDDEN`. | HTTP 401/403 returned cleanly. | **PASS** | Unauthenticated session barrier active. |
| `SAR-TC-11` | **Active Workspace Switching Safety**<br>1. Switch active workspace while search fetch is in-flight. | Search modal resets, clearing state, and responses from previous active wedding context are discarded. | Wedding switching safety active in `WorkspaceSearchModal`. | **PASS** | Context reset hook verified. |
| `SAR-TC-12` | **Search State Machine & Helper Prompts**<br>1. Open search modal and inspect idle helper prompts and keyboard controls. | Modal displays shortcut key legend (`↑ ↓ Navigate`, `↵ Select`, `ESC Close`) and initial search prompt. | Search modal helper prompts and keyboard UI active. | **PASS** | Screenshot: `sar_03_search_modal_open.png` |
| `SAR-TC-13a` | **Mobile Viewport Layout (390px)**<br>1. Resize browser viewport to 390x844px. | Search interface renders responsively on mobile screen with vertical scrolling results. | 390px mobile layout responsive. | **PASS** | Screenshot: `sar_04_mobile_390_layout.png` |
| `SAR-TC-13b` | **Desktop Viewport Layout (1280px)**<br>1. Inspect 1280px desktop dialog layout. | Search modal centers horizontally with max-w-2xl width and backdrop blur. | 1280px desktop modal layout active. | **PASS** | Desktop modal layout active. |
| `SAR-TC-14` | **Chrome Console & Network Security Audit**<br>1. Inspect Chrome DevTools console and network panel logs. | Zero unhandled JS exceptions; zero plain-text secret token leaks; correct HTTP status codes. | Console clean; security audit passed. | **PASS** | Chrome DevTools security audit clean. |

---

## 4. Code Review Findings & Resolution Status

| Finding ID | Severity | Description | Resolution Status | Verification Evidence |
| :--- | :---: | :--- | :---: | :--- |
| **`SAR-001`** | **P1** | Candidate document limit window truncation | **RESOLVED** | Candidate document search limit window expanded (`candidateDocLimit = safeLimit * 10`) prior to `canAccessDocument` parent validation in `SearchService`. Tested in `SAR-TC-08`. |
| **`SAR-002`** | **P1** | Direct module API ceremony scope bypass | **RESOLVED** | Added `canAccessEventId`, `canAccessTask`, `canAccessExpense`, and `canAccessVendor` checks across module list & detail API endpoints (`EventService`, `TaskService`, `ExpenseService`, `VendorService`). Tested in `SAR-TC-06`. |
| **`SAR-003`** | **P1** | Financial data disclosure via shared vendor aggregates | **RESOLVED** | Filtered vendor expense aggregates through `canAccessExpense` in `VendorService`, isolating financial totals to allowed ceremonies. Tested in `SAR-TC-09`. |
| **`SAR-005`** | **P2** | Redundant database queries for member authorization | **RESOLVED** | Reused `member` context via `TeamAuthorization.hasPermission` in `SearchService`, eliminating redundant DB lookups. |
| **`SAR-004`** | **P2** | Full-collection scans in `DocumentService.getDocuments` | *Unapproved P2* | Deferred to future optimization. |
| **`SAR-006`** | **P2** | Inaccurate `totalCount` pagination metric in `VendorService` | *Unapproved P2* | Deferred to future optimization. |

---

## 5. Console & Network Security Audit Findings

### Expected Denied Requests vs. Unexpected Failures
During manual QA testing, the following network responses were audited:
- **Expected Denied Requests (HTTP 401 / 403 / 400):**
  - `GET /api/v1/weddings/[wId]/events/[eventIdB]` -> HTTP 403 `FORBIDDEN` (Attempting direct access to restricted Ceremony B event).
  - `GET /api/v1/weddings/[wId]/tasks/[taskIdB]` -> HTTP 403 `FORBIDDEN` (Attempting direct access to restricted Ceremony B task).
  - `GET /api/v1/weddings/[wId]/documents/[docB]/access-url` -> HTTP 403 `FORBIDDEN` (Attempting access URL generation for restricted parent document).
  - `GET /api/v1/weddings/[wId]/search?q=a` -> HTTP 400 `BAD_REQUEST` (Validation error for query length < 2 chars).
- **Unexpected Failures (HTTP 500 / Uncaught Exceptions):** **ZERO (0)**. The Chrome console log remained clean with zero unhandled JavaScript exceptions or uncaught server errors.

---

## 6. Readiness Recommendation

### **FULL PRODUCTION READINESS (100% PASS)**

**Rationale:**
1. All manual QA test scenarios **PASSED** cleanly in Google Chrome 151 at `http://localhost:3000`.
2. Approved P1 code review findings `SAR-001`, `SAR-002`, `SAR-003`, and `SAR-005` are fully implemented, regression-tested, and verified in browser.
3. Multi-tenant isolation, role authorization, ceremony event scoping, document parent access validation, shared vendor financial masking, direct API scope enforcement, and responsive viewports operate cleanly with zero security leaks or unhandled errors.
