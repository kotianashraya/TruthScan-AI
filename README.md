# TruthScan AI

TruthScan AI is an evidence-based optical verification platform designed to combat counterfeit consumer goods and skincare products. By synthesizing optical character recognition (OCR), 1D/2D barcode parsing, packaging consistency heuristics, and reference catalog matching, TruthScan AI produces factual, explainable authenticity assessments without hallucinations or fabricated claims.

---

## Key Features

- **Multi-Modal Scanner**:
  - Drag-and-drop / file upload supporting JPG, PNG, WEBP, HEIC, TIFF formats.
  - Live camera stream with rear camera preference (`facingMode: { ideal: 'environment' }`) and non-mirrored frame capture.
  - Image preprocessing and adaptive contrast normalization.
- **Optical Recognition Pipeline**:
  - **Tesseract.js OCR**: Multi-pass optical character recognition with clean text scoring and worker lifecycle management.
  - **ZXing Barcode & QR Detection**: High-speed decoding supporting EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, QR Code, and Data Matrix.
- **Deterministic Product Parser**:
  - Extracts brand, product name, batch/lot number, manufacturing date, expiration date, price (MRP), net quantity, SPF ratings, and active ingredients.
  - Strict null-safety: Unidentified packaging fields remain `null`.
- **Reference Catalog & Conflict Detection**:
  - Matches scanned GTINs and brands against verified product profiles.
  - Strict rule: Catalog absence is never converted into counterfeit accusations (`UNKNOWN` / `UNABLE_TO_VERIFY`).
  - Detects true conflicts (e.g., barcode belonging to one brand on a box claiming another).
- **AI Authenticity Engine**:
  - Synthesizes 10 independent verification signals into an authenticity score (0–100) and risk level:
    - `LIKELY_GENUINE`: Consistent signals with no packaging anomalies.
    - `SUSPICIOUS`: Incomplete markers or partial verification.
    - `HIGH_RISK`: Strong contradictions (e.g. expiry precedes manufacturing date, barcode brand conflict).
    - `UNABLE_TO_VERIFY`: Insufficient readable data.
- **User Dashboard & History**:
  - Search, filter by risk level, and inspect full forensic scan records.
  - User-scoped Firestore persistence with hardened security rules.
- **Authenticity Reports**:
  - Printable verification certificates with browser print styling and JSON export.
- **User Profile & Settings**:
  - Personal information management, camera preferences, and data privacy export controls.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/kotianashraya/TruthScan-AI.git
cd TruthScan-AI
npm install
```

### Environment Configuration

Copy `frontend/.env.example` to `frontend/.env.local` to customize Firebase or AI credentials:

```bash
cp frontend/.env.example frontend/.env.local
```

### Running Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

---

## Verification & Testing

Run all automated quality checks:

```bash
# Run unit & integration tests
npm test

# Run TypeScript typechecks
npm run typecheck

# Run production build
npm run build
```

---

## Security Model

- **Firestore**: User-scoped data isolation (`users/{uid}`, `scans/{scanId}`, `reports/{reportId}`). Public read access to waitlist leads is blocked to prevent email scraping.
- **Storage**: User-authenticated folder paths with MIME-type and 10MB file-size validation.
- **Secrets**: No private API keys or service accounts exposed in frontend bundles.

---

## License

Private repository — kotianashraya/TruthScan-AI.
