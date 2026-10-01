# Task List — Milestone: V1 Event/Ceremony Workspace Integration

- `[x]` 1. Vendor Repository & Service Associations
  - `[x]` Add `addEventToVendor` & `removeEventFromVendor` methods in `VendorRepository` (`src/modules/vendors/repositories/vendor.repository.ts`)
  - `[x]` Add `linkVendorToEvent` & `unlinkVendorFromEvent` in `VendorService` (`src/modules/vendors/services/vendor.service.ts`)
  - `[x]` Create `/api/v1/weddings/[weddingId]/vendors/[vendorId]/events/[eventId]/route.ts` API handler (POST & DELETE)

- `[x]` 2. Event Detail UI & Financial Summaries
  - `[x]` Refactor `EventDetailView` (`src/components/events/event-detail-view.tsx`) with working Vendors & Expenses tabs
  - `[x]` Add ceremony vendor listing, "Link Existing Vendor" modal, "Create Vendor" pre-selected modal, and "Unlink" action
  - `[x]` Add ceremony expense listing, pre-selected creation, `ExpenseDetailDrawer` integration, and accurate integer paise metrics
  - `[x]` Implement tab state and URL query parameter syncing (`?tab=...`)

- `[x]` 3. Tasks & Documents Navigation Event Context
  - `[x]` Update Tasks page (`src/app/(workspace)/workspace/[weddingId]/tasks/page.tsx`) to read `eventId` URL filter and prefill new tasks
  - `[x]` Update Documents page (`src/app/(workspace)/workspace/[weddingId]/documents/page.tsx`) to read `eventId` URL filter and prefill document intent

- `[x]` 4. Integration Test Suite & Verification
  - `[x]` Create `src/__tests__/event-workspace.test.ts`
  - `[x]` Test vendor linking/unlinking idempotency, same-wedding validation, prefilled creation, ceremony financials, and tenant authorization
  - `[x]` Run `npm run typecheck`
  - `[x]` Run `npm run lint`
  - `[x]` Run `npx vitest run`
  - `[x]` Run `npm run build`

- `[x]` 5. Documentation & Project Status
  - `[x]` Create `docs/17-Event-Ceremony-Workspace.md`
  - `[x]` Update `docs/05-Project-Status.md`
