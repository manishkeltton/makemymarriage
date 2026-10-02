# V1 In-App Task & Payment Reminders Specification & Implementation

Last updated: 2026-10-02

This document details the architecture, policies, atomic deduplication rules, protected worker/scheduler setup, and QA verification flows for V1 In-App Task & Payment Reminders across the Make My Marriage platform.

---

## 1. Reminder Rules & Target Recipients

### Task Reminders
- **Status Scope:** Only tasks in `TODO` or `IN_PROGRESS` status are eligible. Tasks marked `COMPLETED` do NOT generate reminders.
- **Recipient:** Assigned user (`task.assigneeId`). Recipient must be an active wedding member with `tasks` functional permission and event scope access (`canAccessTask`).
- **Trigger Types:**
  1. `TASK_REMINDER_CUSTOM`: Scheduled custom reminder (`currentTime >= task.reminderAt`).
  2. `TASK_DUE_SOON`: Task due within 24 hours (`currentTime <= task.dueAt` and difference <= 24h).
  3. `TASK_OVERDUE`: Task overdue (`currentTime > task.dueAt`).

### Payment & Installment Reminders
- **Status Scope:** Only pending payments (`status === "PENDING"`) belonging to approved or pending expenses (`approvalStatus !== "REJECTED"`) generate reminders.
- **Installment Independence:** Paying one installment of an expense sets that payment's status to `PAID`, suppressing further reminders for that installment while unpaid installments of the same expense continue to receive reminders independently.
- **Recipient Eligibility:**
  - If `paidBy.type === "MEMBER"` and `paidBy.userId` is set: target user `paidBy.userId`.
  - If `paidBy.type === "OTHER"` or unassigned: all active workspace members with `finance` permission who can access the parent expense's ceremony (`canAccessExpense`).
- **Trigger Types:**
  1. `PAYMENT_DUE_SOON`: Installment due within 24 hours (`currentTime <= payment.dueAt` and difference <= 24h).
  2. `PAYMENT_OVERDUE`: Installment overdue (`currentTime > payment.dueAt`).

---

## 2. Atomic Duplicate Prevention Architecture

To prevent duplicate notification creation across concurrent scheduler runs, server restarts, and retries:
- `NotificationModel` defines a sparse, unique MongoDB index on `dedupKey`.
- `dedupKey` format:
  - Task Custom: `${userId}_TASK_${taskId}_TASK_REMINDER_CUSTOM_${reminderAtTimestamp}`
  - Task Due Soon / Overdue: `${userId}_TASK_${taskId}_${kind}_${dueDateYYYYMMDD}`
  - Payment Due Soon / Overdue: `${userId}_PAYMENT_${paymentId}_${kind}_${dueDateYYYYMMDD}`
- `NotificationRepository.create` catches MongoDB duplicate key errors (code 11000) atomically and returns `null` without throwing errors or creating duplicates.

---

## 3. Stale Notification & Leak Prevention Policy

- When fetching notifications via `NotificationService.getUserNotifications`:
  - Validates active workspace membership for the requesting user.
  - Verifies target record existence (task or expense). Deleted records are omitted.
  - Verifies task status (completed tasks omit active reminder notifications).
  - Verifies parent expense approval status (rejected parent expenses omit payment notifications).
  - Rechecks module permissions (`tasks`, `finance`) and ceremony scope access (`canAccessTask`, `canAccessExpense`).
- Unread count is calculated strictly on accessible, non-stale notifications.
- Restricted titles, amounts, links, and unread counts never leak after role demotion, permission revocation, or record deletion.

---

## 4. Protected Worker & Local Scheduler Setup

### Protected CRON API Route
- **Endpoint:** `POST /api/v1/cron/reminders`
- **Headers:** `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret: <CRON_SECRET>`
- **Response:**
  ```json
  {
    "success": true,
    "processedWeddings": 1,
    "notificationsCreated": 3
  }
  ```

### CLI Worker Execution
- Runnable script: `scripts/run-reminder-worker.ts`
- Run command: `npx tsx scripts/run-reminder-worker.ts [weddingId]`

### Intended Production Deployment Configuration
- Configure a 15-minute system cron or Vercel Cron Job targeting `POST /api/v1/cron/reminders` with secret header authentication.

---

## 5. QA Verification & Test Fixtures

Unit & integration tests added in `src/__tests__/in-app-reminders.test.ts`:
- Threshold boundaries and custom `reminderAt` evaluation.
- Atomic duplicate suppression across concurrent worker runs.
- Completed tasks and paid installments suppression.
- Rejected parent expense suppression.
- Reassignment and due date editing behavior.
- Stale notification filtering and access revocation leaks prevention.
