# Make My Marriage — Password Recovery Architecture & Implementation

Last updated: 2026-10-01

This document provides a comprehensive technical reference for the **Password Recovery** module implemented in Make My Marriage.

---

## 1. Executive Summary

The Password Recovery module allows users to securely recover account access when they forget their credentials. It combines cryptographically secure token generation, hash-only database storage, single-use atomic consumption, session revocation upon password update, neutral public API responses against account enumeration, and branded email notification delivery via Resend.

---

## 2. Security Architecture & Principles

### A. Hash-Only Outbox Sanitization
- **Requirement**: Raw reset tokens and full reset URLs containing raw tokens MUST NEVER be stored in database tables or logs.
- **Implementation**:
  - The database document `PasswordResetToken` stores only the SHA-256 hash (`tokenHash`), `userId`, `expiresAt` (1 hour from generation), and `usedAt`.
  - The outbox document `EmailJob` stores sanitized `templateData` containing `{ tokenHash, userName, expiresAt }`. It does NOT persist `rawToken` or complete `resetUrl`.
  - Immediate email delivery via `EmailService.enqueuePasswordResetEmail` passes the transient `resetUrl` in-memory to format the HTML payload sent to Resend API.
  - Legacy `console.log` raw-token logging has been removed.

### B. Single-Use Atomic Token Consumption
- **Requirement**: Reset tokens must be single-use and resilient against race conditions under concurrent requests.
- **Implementation**:
  - `AuthService.resetPassword` uses `PasswordResetToken.findOneAndUpdate`:
    ```ts
    const resetToken = await PasswordResetToken.findOneAndUpdate(
      {
        tokenHash,
        usedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      },
      {
        $set: { usedAt: new Date() },
      },
      { new: true }
    );
    ```
  - If a token is reused or submitted concurrently, only one request acquires `usedAt`, and subsequent requests immediately fail with error code `RESET_TOKEN_INVALID`.

### C. Outstanding Token Invalidation & Session Revocation
- **Requirement**: Resetting a password must invalidate all other outstanding reset links for that user and log out all existing sessions.
- **Implementation**:
  - Upon successful password update:
    ```ts
    // Invalidate all remaining outstanding reset tokens for this user
    await PasswordResetToken.updateMany(
      { userId: resetToken.userId, usedAt: { $exists: false } },
      { $set: { usedAt: new Date() } }
    );

    // Revoke all active sessions across all devices
    await Session.deleteMany({ userId: resetToken.userId });
    ```

### D. Neutral Public Responses & Rate Limiting
- **Forgot Password Endpoint (`POST /api/v1/auth/forgot-password`)**:
  - Always returns `{ success: true, data: { accepted: true } }` (HTTP 200) regardless of whether the email exists in the system or whether internal email provider errors occur.
  - Protected by IP-based rate limiting (5 requests per hour per IP).
- **Reset Password Endpoint (`POST /api/v1/auth/reset-password`)**:
  - Enforces server-side password length policy (8 to 100 characters).
  - Protected by IP-based rate limiting (10 requests per hour per IP).

---

## 3. API & Data Flow Contracts

### A. Forgot Password (`POST /api/v1/auth/forgot-password`)
- **Payload**: `{ "email": "user@example.com" }`
- **Response**: `{ "success": true, "data": { "accepted": true } }`

### B. Reset Password (`POST /api/v1/auth/reset-password`)
- **Payload**: `{ "token": "raw_hex_token", "password": "newsecurepassword123" }`
- **Success Response (HTTP 200)**: `{ "success": true }`
- **Error Response (HTTP 400)**:
  ```json
  {
    "success": false,
    "error": {
      "code": "RESET_TOKEN_INVALID",
      "message": "Invalid or expired reset token"
    }
  }
  ```

---

## 4. User Interface

- **`/forgot-password`**: Form for requesting a reset link. Displays neutral confirmation message upon submission, handles rate-limit HTTP 429 errors, and provides links to return to `/login`.
- **`/reset-password`**: Extracts `?token=...` query parameter. Displays new password input with show/hide toggle buttons, client-side & server-side validation feedback, invalid/expired token alerts, and automatic 2.5s redirect to `/login` upon success.

---

## 5. Verification Evidence

- **`npm run lint`**: **PASS** (0 errors, 0 warnings).
- **`npm run typecheck`**: **PASS** (0 errors).
- **`npx vitest run`**: **PASS** (17 test files, 171 passed, 0 failed).
- **`npm run build`**: **PASS** (Turbopack production compilation clean; `/forgot-password` and `/reset-password` built static).
