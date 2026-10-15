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
- **Multimodal AI + Authenticity Engine**:
  - Runs a secure server-side Gemini vision assessment on the scanned packaging image.
  - Combines AI visual observations with OCR, QR/barcode, product parsing, catalog verification, and deterministic consistency checks.
  - Synthesizes the evidence into an authenticity score (0–100) and risk level:
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

## Free AI / Firebase Deployment

TruthScan AI can run without enabling Firebase Blaze.

- Firebase Spark is used for Authentication, Firestore, and Firebase Hosting.
- Scan images are not uploaded to Firebase Storage by default.
- Multimodal product vision runs through a separate Cloudflare Worker using
  Google Gemma 4 vision on Workers AI.
- Cloudflare Workers Free currently includes 100,000 Worker requests/day, and
  Workers AI includes 10,000 neurons/day at no charge; once a free quota is
  exhausted, requests fail rather than silently becoming paid usage.
- No Gemini API key is required for the Cloudflare Workers AI path.

After creating a free Cloudflare account and logging in with Wrangler:

```bash
cd workers/truthscan-vision
npm install
npx wrangler login
npx wrangler deploy
```

Copy the resulting `https://<your-subdomain>.workers.dev` URL into
`frontend/.env.local` as `VITE_AI_VISION_URL`, then rebuild the frontend.

Firebase Spark deployment:

```bash
npm run build
firebase deploy --only hosting,firestore:rules --project truthscan-ai-2eb39
```

## Production Deployment

TruthScan AI operates strictly on a **zero-cost / free-tier architecture**:

### 1. Cloudflare Workers AI (Vision Engine)
```bash
cd workers/truthscan-vision
npm install
npx wrangler deploy
```
The deployed Worker exposes an unauthenticated POST endpoint running `@cf/google/gemma-4-26b-a4b-it` under Cloudflare's free daily Neurons tier without any paid API keys.

### 2. Firebase Spark Tier (Hosting & Firestore)
```bash
npm run build
npx firebase deploy --only hosting,firestore:rules --project truthscan-ai-2eb39
```

Live Production Endpoints:
- **Web App**: [https://truthscan-ai-2eb39.web.app](https://truthscan-ai-2eb39.web.app) / [https://truthscan-ai-2eb39.firebaseapp.com](https://truthscan-ai-2eb39.firebaseapp.com)
- **AI Vision Worker**: [https://truthscan-ai-vision.mountain-hospital.workers.dev](https://truthscan-ai-vision.mountain-hospital.workers.dev)

## Verification & Testing

Run all automated quality checks:

```bash
# Run unit & integration tests
npm test

# Run TypeScript typechecks (frontend)
npm run typecheck

# Run TypeScript typechecks (AI worker)
npm run ai:typecheck

# Run production build
npm run build
```

---

## Security Model

- **Firestore**: User-scoped data isolation (`users/{uid}`, `scans/{scanId}`, `reports/{reportId}`). Public read access to waitlist leads is blocked to prevent email scraping.
- **Zero Paid Storage Requirement**: Images processed client-side with base64 downsampling; cloud storage is disabled (`VITE_ENABLE_CLOUD_IMAGE_STORAGE="false"`), preventing paid Cloud Storage charges.
- **Zero API Key Leakage**: No paid AI API keys exist in frontend bundles or repository code. Cloudflare Workers AI handles inference serverlessly.

---

## License

Private repository — kotianashraya/TruthScan-AI.
