# Database

The client currently accesses Firestore using the modular Firebase SDK.

| Collection | Current usage |
| --- | --- |
| `scans` | Stores simulated scan reports and loads the ten newest reports. |
| `waitlist_leads` | Stores waitlist registrations and counts records for a queue number. |

`ScanReport`, `ScanFeature`, and `WaitlistLead` are defined in
`frontend/src/models/scan.ts`.

The deployed Firestore rules remain unchanged in `backend/firestore.rules`.
Authentication and Storage are initialized by the client but are not used by
the current UI.
