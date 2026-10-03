# MakeMyMarriage — User Profile Management Specification

Last updated: 2026-10-03

## Overview

User Profile Management provides account-level profile viewing and updating capabilities for authenticated MakeMyMarriage users. Access does not require an active wedding or wedding-admin role.

## Key Rules & Policies

1. **Authentication & Session Security:**
   - Target user is derived exclusively from the verified session cookie (`getSessionToken()`).
   - Expired sessions (`SESSION_EXPIRED`) return HTTP 401.
   - Missing or suspended users (`ACCOUNT_SUSPENDED`) return HTTP 403.
   - Password hashes, session tokens, and internal security fields are never exposed.

2. **Validation & Field Governance:**
   - Editable fields: `name` and `preferredLanguage`.
   - `name`: 2–100 characters long after trimming leading and trailing whitespace. Supports Unicode characters.
   - `preferredLanguage`: Must be `"en"` (English) or `"hi"` (Hindi). Default is `"en"`.
   - Forbidden fields: `email`, `passwordHash`, `status`, `isPlatformAdmin`, `_id`, `id`, `createdAt`, `updatedAt`, and MongoDB update operators (`$set`, `$unset`). Attempts to mutate these fields via profile PATCH return HTTP 400 (`FORBIDDEN_FIELD_UPDATE`).

3. **HTTP Caching & Headers:**
   - Both `GET` and `PATCH` responses include `Cache-Control: no-store, private` to prevent shared or proxy caching of private user data.

4. **Navigation & UI Integrations:**
   - Profile page located at `/profile`.
   - Accessible via "My Profile" links in:
     - `MarketingHeader`: Desktop user dropdown and mobile menu drawer.
     - `WorkspaceHeader`: Interactive user profile avatar dropdown menu.
     - `WorkspaceSidebar`: Bottom footer links and clickable user pill.

## API Specification

### `GET /api/v1/auth/profile`

**Headers:**
- `Cookie: mmm_session=<token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "650000000000000000000001",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "preferredLanguage": "en",
    "status": "ACTIVE",
    "createdAt": "2026-09-23T10:00:00.000Z",
    "updatedAt": "2026-10-03T10:00:00.000Z"
  }
}
```

### `PATCH /api/v1/auth/profile`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "preferredLanguage": "hi"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "650000000000000000000001",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "preferredLanguage": "hi",
    "status": "ACTIVE",
    "createdAt": "2026-09-23T10:00:00.000Z",
    "updatedAt": "2026-10-03T10:00:00.000Z"
  }
}
```
