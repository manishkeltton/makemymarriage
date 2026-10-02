# V1 Search Access Restrictions Manual Chrome QA Plan

## Overview
This document provides step-by-step instructions for performing manual QA verification in Google Chrome for the **V1 Search Access Restrictions** milestone on `http://localhost:3000`.

---

## Test Environment Setup
1. Ensure Next.js dev server is running on `http://localhost:3000`.
2. Open Chrome Developer Tools (F12) to inspect network requests (`/api/v1/weddings/[weddingId]/search`).

---

## QA Test Scenarios

### Scenario 1: Multi-Wedding Isolation
- **Setup**: Log in as User A (Admin of Wedding 1).
- **Action**: Open header search or press `Ctrl+K` / `Command+K` and search for a term existing in Wedding 2 (e.g. "Haldi").
- **Expected Result**: Results must contain ONLY matches from Wedding 1. Direct API requests to Wedding 2's search endpoint with User A's token must return `403 Forbidden`.

### Scenario 2: Ceremony-Restricted Organiser
- **Setup**: Log in as User B (Organiser with `allEvents: false`, restricted to "Sangeet Ceremony").
- **Action**: Search for "Catering" or "DJ".
- **Expected Result**:
  - Events returned must only be "Sangeet Ceremony".
  - Tasks & Expenses linked to "Haldi" or "Reception" must NOT appear in search results or total counts.
  - Vendors linked to both Sangeet & Haldi will appear, but Haldi ceremony badges must be hidden.

### Scenario 3: Disabled Module Permissions
- **Setup**: Log in as User C (Member with `guests: false`, `finance: false`).
- **Action**: Search for "Sharma" (a guest household name and caterer payment title).
- **Expected Result**:
  - Guest section is completely omitted from the search results overlay.
  - Expense results are omitted.
  - Total match count excludes guest & expense counts.

### Scenario 4: Document Parent Authorization & Orphan Policy
- **Setup**: Log in as User B (Ceremony-Restricted Organiser).
- **Action**: Search for "Contract".
- **Expected Result**:
  - Documents linked to Sangeet Ceremony are returned.
  - Documents linked to Haldi Ceremony or deleted parents are omitted.
  - Attempting to access the document preview/download URL for a restricted parent document returns `403 Forbidden`.

---

## API Route Fixtures for Testing

- **Unified Search Endpoint**:
  `GET /api/v1/weddings/:weddingId/search?q=Sharma&limit=5`
- **Document Access URL Endpoint**:
  `GET /api/v1/weddings/:weddingId/documents/:documentId/access-url`
- **Vendor Detail Endpoint**:
  `GET /api/v1/weddings/:weddingId/vendors/:vendorId`
