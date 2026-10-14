# System Architecture

TruthScan AI is architected as an optical recognition and multi-signal verification pipeline for consumer packaging and skincare products.

## Core Processing Pipeline

```
Packaging Image (Upload or Rear Camera Stream)
      ↓
Image Normalization & Contrast Preprocessing (HTML5 Canvas / OffscreenCanvas)
      ↓
Parallel Optical Detection:
  ├── 1D Barcode Detection (ZXing MultiFormatReader: EAN-13, UPC-A, Code-128, etc.)
  ├── 2D / QR Code Detection (ZXing BrowserMultiFormatReader)
  └── Tesseract.js Worker OCR (Adaptive luminance, multi-pass PSM.AUTO & SPARSE_TEXT)
      ↓
Deterministic Product Information Parser (Regex & Tokenization)
  ├── Brand recognition & normalization
  ├── Product name & variant identification
  ├── Batch & lot number extraction
  ├── Manufacturing & expiration date parsing
  ├── Price (MRP) & volume/weight declarations
  └── Active ingredients & SPF rating extraction
      ↓
Product Reference Catalog Verification (Deterministic Lookup)
  ├── Exact GTIN/barcode matching
  ├── Brand & variant catalog matching
  └── Anomaly detection (cross-brand barcode conflicts)
      ↓
AI Multi-Signal Authenticity Assessment Engine
  ├── 10-signal evidence aggregation
  ├── Date chronology checks (mfg vs expiry order)
  ├── Authenticity score calculation (0–100)
  ├── Risk level assignment (LIKELY_GENUINE, SUSPICIOUS, HIGH_RISK, UNABLE_TO_VERIFY)
  └── Audit trail & legal limitation generation
      ↓
Persistence & UI Presentation:
  ├── User-scoped Firestore persistence (`scans/{scanId}`)
  ├── Optional Firebase Storage image archiving
  ├── Interactive Result View with Forensics Accordion
  ├── History management with search & risk filters
  └── Official Printable / Downloadable Verification Reports
```

## Anti-Hallucination & Fabrication Safeguards

1. **Observed Fact vs. Inference**: Missing signals (e.g. no barcode detected on front face) are explicitly stated as "No barcode detected", never falsely reported as "Invalid barcode".
2. **Catalog Absence Rule**: Absence from the local reference database produces `UNKNOWN` / `UNABLE_TO_VERIFY`. It is never treated as evidence of a counterfeit product.
3. **Null Preservation**: Unidentified fields strictly remain `null` or `undefined`.
