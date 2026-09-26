# Make My Marriage — Pending Features & Future Roadmap

**Last updated:** 2026-09-26  
**Status:** Living Backlog & Future Requirements Document

This document records all deferred capabilities, external service integration requirements, V1 scope boundaries, and planned future enhancements across all product modules of Make My Marriage.

---

## 1. External Credentials & Infrastructure Dependencies

The following features are fully implemented in code but require external environment variables and production cloud credentials for live deployment:

### 1.1 Transactional Email Delivery (Resend API)
- **Status:** Code Implemented / Pending Credentials
- **Required Env Vars:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_ORIGIN`
- **Description:** Team member invitations, password resets, and email notifications use MongoDB outbox `EmailJob` dispatch. In local/test environments without `RESEND_API_KEY`, jobs fail gracefully and log errors without blocking link sharing.
- **Future Tasks:**
  1. Supply verified domain `RESEND_FROM_EMAIL` (e.g., `invites@makemymarriage.com`) and production `RESEND_API_KEY`.
  2. Implement an automated background cron worker / queue runner to retry failed outbox jobs.
  3. Implement webhook endpoint for provider delivery callbacks (`DELIVERED`, `BOUNCED`, `COMPLAINT`).

### 1.2 Binary Media Storage (Cloudflare R2)
- **Status:** Code Implemented / Pending Credentials
- **Required Env Vars:** `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- **Description:** Media vault upload intents generate AWS S3 compatible presigned upload URLs. When credentials are unconfigured, upload intent APIs return `DEPENDENCY_UNAVAILABLE` (HTTP 503).
- **Future Tasks:**
  1. Provision production Cloudflare R2 bucket with CORS policy permitting client PUT uploads.
  2. Implement background media processing pipeline for automatic WebP image compression and thumbnail generation.
  3. Implement video HLS transcoding for adaptive streaming playback.

---

## 2. Module-Specific Deferred Features

### 2.1 Workspace & Team Management
- **Deferred Feature:** Multi-organization / Agency Workspace Management.
  - *Description:* Managing multiple weddings under a single professional wedding planner agency account.
- **Deferred Feature:** Custom Role Builder.
  - *Description:* Granular custom permission builder beyond standard `ADMIN`, `MANAGER`, and `ORGANISER` roles.

### 2.2 Event Management & Scheduling
- **Deferred Feature:** Interactive Seating & Table Layout Planner.
  - *Description:* Visual drag-and-drop table layout builder for wedding receptions.
- **Deferred Feature:** Google Calendar / iCal Sync.
  - *Description:* One-click sync of ceremony schedules to personal calendar applications.

### 2.3 Planning Engine (Tasks, Checklist & Documents)
- **Deferred Feature:** Subtasks & Checklists.
  - *Description:* Nested subtask checklists within individual task items.
- **Deferred Feature:** Recurring Tasks & Dependencies Gantt Chart.
  - *Description:* Visual Gantt chart representation of complex ceremony task dependencies.
- **Deferred Feature:** Automated Email Task Reminders (`NTF-02`).
  - *Description:* Automated daily/weekly email notifications for upcoming and overdue tasks requiring background cron worker.

### 2.4 Money & Vendors (Budget & Procurement)
- **Deferred Feature:** Direct Payment Gateway Integration (Razorpay / Stripe).
  - *Description:* Direct online payment processing for vendor instalments and receipts.
- **Deferred Feature:** Multi-Step Expense Approval Workflows.
  - *Description:* Multi-level approval hierarchy for expenses exceeding pre-defined monetary thresholds.
- **Deferred Feature:** Vendor Self-Service Portal.
  - *Description:* External vendor portal for submitting quotes, invoices, and updating payment milestones.
- **Deferred Feature:** Multi-Currency & FX Calculations.
  - *Description:* Support for foreign currencies alongside Indian Rupee (INR paise).

### 2.5 Guests, Household Invitations & RSVP
- **Deferred Feature:** Event-Specific RSVP Selection.
  - *Description:* Per-ceremony attendance selection (e.g. attending Sangeet but not Haldi) instead of overall wedding RSVP.
- **Deferred Feature:** WhatsApp Business API Integration.
  - *Description:* Automated direct messaging of digital invitation links & RSVP reminders over WhatsApp.
- **Deferred Feature:** Meal & Dietary Preference Customization.
  - *Description:* Detailed meal selection (Jain, Vegan, Gluten-Free) and seating allocation per guest member.

### 2.6 Wedding Website & Builder
- **Deferred Feature:** Custom CNAME Domain Binding.
  - *Description:* Binding custom domains (e.g. `www.rahul-and-neha.com`) via CNAME mapping.
- **Deferred Feature:** Drag-and-Drop Visual Page Builder.
  - *Description:* Freeform layout component positioning beyond configuration-driven section schemas.
- **Deferred Feature:** Multi-Lingual Website Translations.
  - *Description:* Side-by-side automatic language translation switcher for international guests.

### 2.7 Wedding Experience (Gallery, Wishes, Livestream & Contacts)
- **Deferred Feature:** Interactive Audio / Video Guestbook Wishes.
  - *Description:* Uploading audio voice notes and video clip wishes directly in the guestbook.
- **Deferred Feature:** AI Face Recognition & Photo Tagging.
  - *Description:* Automated facial recognition tagging guests in uploaded gallery photos.
- **Deferred Feature:** Native RTMP / WebRTC Video Streaming.
  - *Description:* In-app live video streaming host server (currently relies on external YouTube iframe embeds).
- **Deferred Feature:** Emergency SOS SMS & Push Broadcasts.
  - *Description:* Instant SMS alert broadcasts to emergency contacts and key ceremony leads.

---

## 3. Production Infrastructure & Cron Workers Roadmap

To transition from local/staging verification to high-scale production, the following infrastructure components are planned:

1. **Background Job Runner (Redis + BullMQ or Agenda):**
   - Process email outbox jobs asynchronously.
   - Run task deadline alert cron jobs every midnight.
   - Perform periodic cleanup of abandoned temp upload keys in storage.

2. **MongoDB Replica Set Cluster:**
   - Production MongoDB Atlas deployment supporting multi-document ACID transactions.

3. **CDN & Edge Caching Configuration:**
   - Cloudflare CDN edge caching for public wedding websites `/w/[slug]` with automatic Next.js tag revalidation.

---

## 4. Prioritization Matrix for Next Release

| Priority | Feature / Infrastructure | Module | Estimated Scope |
|---|---|---|---|
| **P1** | Cloudflare R2 Credentials & Production Storage | Gallery / Docs | Infrastructure |
| **P1** | Resend Email API Credentials & Outbox Worker | Team / System | Infrastructure |
| **P2** | Event-Specific Guest RSVP Selection | Guests | Enhancements |
| **P2** | Subtasks Hierarchy within Tasks | Planning | Enhancements |
| **P3** | Direct WhatsApp Invitation Link Sharing | Guests | Integration |
| **P3** | Custom CNAME Domain Mapping | Website | Integration |
| **P3** | Vendor Quote & Invoice Upload Vault | Vendors | Enhancements |
