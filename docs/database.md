# Database Architecture & Security Model

TruthScan AI utilizes Google Cloud Firestore with strict security rules enforcing user-scoped data isolation.

## Collections & Documents

| Collection | Schema & Ownership | Purpose |
| --- | --- | --- |
| `users/{uid}` | Owner-only (`request.auth.uid == uid`) | User profile, displayName, email, role, subscription tier, and scan usage metrics. |
| `scans/{scanId}` | Owner-only (`resource.data.uid == request.auth.uid` or `userId == request.auth.uid`) | Complete scan records: product metadata, optical recognition (OCR, Barcode, QR), database cross-reference results, AI authenticity score (0–100), risk level, and forensic timings. |
| `reports/{reportId}` | Owner-only | Generated and exported verification certificates and audit trails. |
| `waitlist_leads/{leadId}` | Public create-only, read-blocked | Early-access lead captures. Public reads are blocked to prevent email harvesting. |

## Security Policy

Firestore security rules in `backend/firestore.rules` enforce:
- Zero open wildcard reads/writes (`allow read, write: if true;` is eliminated).
- All scan and report data is bound to `request.auth.uid`.
- Strict owner verification on create, read, update, and delete.

## Firebase Storage Policy

Storage security rules in `backend/storage.rules` enforce:
- User-isolated storage paths: `users/{userId}/scans/{fileName}`.
- Max file size limited to 10 MB.
- Content-type validation restricted strictly to images (`image/*`).
