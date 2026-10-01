# 16 - Documents & Attachments Vault Architectural Specification

## 1. Overview & Architecture

The **V1 Documents & Attachments Vault** provides secure, multi-tenant cloud storage for ceremonial contracts, vendor proposals, deposit receipts, catering menus, and task reference materials.

It leverages authenticated signature uploads to Cloudinary (with raw PDF & image support up to 10 MiB per file), short-lived signed access URLs (60-second expiry), same-wedding relational integrity checks, entitlement quota tracking, reference-aware asset cleanup, and strict privacy boundaries that keep sensitive workspace documents isolated from public website and guest invitation endpoints.

```
       +------------------------+
       |   Client Browser UI    |
       +-----------+------------+
                   | 1. POST /documents/intent
                   v
       +------------------------+
       |   DocumentService      | ----> EntitlementService.assertCanUploadMedia
       +-----------+------------+
                   | 2. Returns signed Cloudinary upload params
                   v
       +------------------------+
       |   Client Browser UI    | ----> Direct binary upload to Cloudinary
       +-----------+------------+
                   | 3. POST /documents (with uploadKey & objectKey)
                   v
       +------------------------+
       |   DocumentService      | ----> StorageService.verifyAndSeal
       |                        | ----> Same-wedding entity verification
       +-----------+------------+
                   | 4. Document Document Record Created
                   v
       +------------------------+
       |  MongoDB DocumentModel |
       +------------------------+
```

---

## 2. Document Data Model & DTO Specification

```typescript
export interface DocumentDTO {
  id: string;
  weddingId: string;
  type: "CONTRACT" | "INVOICE" | "RECEIPT" | "QUOTATION" | "MENU" | "OTHER";
  relatedTo?: {
    type: "EVENT" | "TASK" | "VENDOR" | "EXPENSE";
    id: string;
  };
  mediaId?: string;
  title: string;
  fileKey?: string;
  mimeType?: string;
  fileSize?: number;
  uploadedBy: string;
  uploaderName?: string;
  accessUrl?: string | null;
  isUnavailable?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Legacy Record Compatibility
Documents uploaded prior to V1 binary storage without an underlying `fileKey` (or non-Cloudinary keys when R2 is inactive) compute `isUnavailable: true`. The UI renders an explicit `Legacy Record / Unavailable` badge without throwing errors or breaking rendering.

---

## 3. Attachment Contexts & Same-Wedding Verification

Documents can be bound to four primary workspace attachment contexts:
1. **EVENT**: Ceremonial drapes, seating layout PDFs, panditji Samagri lists. Verified against `EventRepository.findByIdAndWeddingId`.
2. **TASK**: Execution blueprints, design reference boards, checklist guides. Verified against `TaskRepository.findByIdAndWeddingId`.
3. **VENDOR**: Service contracts, acoustics SLAs, pricing quotes. Verified against `VendorRepository.findByIdAndWeddingId`.
4. **EXPENSE**: Tax invoices, advance deposit receipts, payment confirmations. Verified against `ExpenseRepository.findByIdAndWeddingId`.

Attempts to attach a document to an entity belonging to another wedding workspace trigger a `400 Bad Request` with error code `INVALID_REFERENCE`.

---

## 4. Quota Enforcement & Entitlement Checks

All document upload operations enforce SaaS storage limits via `EntitlementService.assertCanUploadMedia(weddingId, sizeBytes, mimeType)`:
- **Free Plan**: 1 GiB media & document storage limit.
- **Premium Plan**: 25 GiB media & document storage limit.

If an upload attempt exceeds workspace storage capacity, the intent API returns `402 Payment Required` with code `ENTITLEMENT_EXCEEDED`.

---

## 5. Security & Privacy Boundaries

### Private Workspace Isolation
Documents are strictly confined to authorized wedding workspace members (`ADMIN`, `MANAGER`, `MEMBER`). Private document records and binary assets are explicitly excluded from:
- Public wedding websites (`/w/[slug]`)
- Guest invitation portals (`/invitation/[token]`)
- Guest gallery and guestbook APIs

### Signed Access URLs
Access to document files requires calling `GET /api/v1/weddings/[weddingId]/documents/[documentId]/access-url`. The server generates a short-lived signed Cloudinary URL valid for **60 seconds**, protecting original binary files from unauthorized web indexing or persistent public hotlinking.

### Reference-Aware Asset Cleanup
When a document record is deleted:
1. The server checks if `fileKey` is referenced by any other `DocumentModel` or `MediaModel` document.
2. If unreferenced elsewhere, `StorageService.remove(fileKey)` purges the underlying binary asset from Cloudinary storage.
3. If shared with another document or media asset, the underlying Cloudinary binary asset is preserved.

---

## 6. Verification & Automated Test Coverage

The integration test suite (`src/__tests__/documents.test.ts`) verifies:
- Zod schema validation for upload intent and document completion payloads.
- SaaS storage quota enforcement and rejection when limits are exceeded.
- Direct binary upload intent generation and Cloudinary metadata seal verification (`StorageService.verifyAndSeal`).
- Same-wedding entity verification across all 4 attachment contexts (`EVENT`, `TASK`, `VENDOR`, `EXPENSE`).
- Signed access URL generation with 60s short expiry.
- Preservation of legacy records (`isUnavailable: true`).
- Reference-aware Cloudinary asset cleanup on deletion.
