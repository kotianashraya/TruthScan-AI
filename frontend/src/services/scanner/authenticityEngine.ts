import type { ProductDetectionResult } from '@/types/ProductDetectionResult';
import type { AuthenticityResult, RiskLevel } from '@/types/AuthenticityResult';
import { verifyAgainstDatabase } from './productDatabase';

function parseDateValue(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) return parsed;

  // Handle formats like 01/2025 or 01-2025 or 01/15/2025
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 2) {
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    if (!isNaN(month) && !isNaN(year)) {
      const fullYear = year < 100 ? 2000 + year : year;
      return new Date(fullYear, month - 1, 1).getTime();
    }
  }
  return null;
}

export function evaluateAuthenticity(result: ProductDetectionResult): AuthenticityResult {
  let score = 0;
  const positiveIndicators: string[] = [];
  const warningIndicators: string[] = [];
  const observedEvidence: string[] = [];
  const limitations: string[] = [
    'Optical and digital verification does not replace laboratory chemical analysis or gas chromatography.',
    'Physical packaging elements (e.g. anti-tamper seals, specialized holographic micro-embossing) cannot be fully verified via 2D photos.',
    'Barcodes and QR codes can be optically duplicated by sophisticated counterfeiters.'
  ];

  const productInfo = result.productInfo ?? {};
  const ocr = result.ocr;
  const barcode = result.barcode ?? { detected: false };
  const qr = result.qr ?? { detected: false };

  // 1. Barcode Signal
  if (barcode.detected && barcode.value) {
    score += 15;
    positiveIndicators.push(`Standard ${barcode.format ?? '1D'} barcode detected (${barcode.value}).`);
    observedEvidence.push(`Barcode detected: format=${barcode.format ?? 'unknown'}, value=${barcode.value}`);
  } else {
    observedEvidence.push('No 1D barcode was detected in the scanned image.');
    warningIndicators.push('No standard barcode detected on scanned face. Products frequently carry barcodes on alternate sides or rear.');
  }

  // 2. QR Code Signal
  if (qr.detected && (qr.rawValue || qr.url)) {
    score += 12;
    positiveIndicators.push('2D / QR code detected on packaging.');
    observedEvidence.push(`QR code detected: raw=${qr.rawValue ?? qr.url}`);
    if (qr.url && /^https?:\/\//i.test(qr.url)) {
      positiveIndicators.push(`QR contains valid web resolution destination (${new URL(qr.url).hostname}).`);
    }
  } else {
    observedEvidence.push('No 2D / QR code was detected in the scanned image.');
  }

  // 3. OCR Signal
  let ocrConfidence = ocr?.confidence ?? null;
  if (ocr?.status === 'success' && ocr.rawText && ocr.rawText.trim().length > 0) {
    const rawLen = ocr.rawText.trim().length;
    observedEvidence.push(`OCR text extracted (${rawLen} characters, confidence: ${ocrConfidence != null ? Math.round(ocrConfidence * 100) : 'unknown'}%).`);

    if (ocrConfidence != null) {
      if (ocrConfidence >= 0.85) {
        score += 20;
        positiveIndicators.push(`High optical character recognition confidence (${Math.round(ocrConfidence * 100)}%).`);
      } else if (ocrConfidence >= 0.70) {
        score += 15;
        positiveIndicators.push(`Reliable optical character recognition confidence (${Math.round(ocrConfidence * 100)}%).`);
      } else if (ocrConfidence >= 0.50) {
        score += 10;
        positiveIndicators.push(`Moderate optical character recognition confidence (${Math.round(ocrConfidence * 100)}%).`);
      } else {
        score += 5;
        warningIndicators.push(`Low optical character recognition clarity (${Math.round(ocrConfidence * 100)}%). Text may be blurred or distorted.`);
      }
    } else {
      score += 10;
      positiveIndicators.push('Product text extracted from packaging.');
    }
  } else {
    observedEvidence.push(ocr?.status === 'failed' ? 'OCR engine failed to recognize text.' : 'No legible typography recognized.');
    warningIndicators.push('OCR text extraction failed or yielded no legible packaging typography.');
  }

  // 4. Product Identity Signals (Brand & Name)
  if (productInfo.brand) {
    score += 15;
    positiveIndicators.push(`Identified manufacturer brand: ${productInfo.brand}.`);
    observedEvidence.push(`Brand recognized from packaging: "${productInfo.brand}"`);
  } else {
    observedEvidence.push('Brand was not identified from typography.');
    warningIndicators.push('Manufacturer brand not recognized from scanned text.');
  }

  if (productInfo.productName) {
    score += 15;
    positiveIndicators.push(`Identified product designation: ${productInfo.productName}.`);
    observedEvidence.push(`Product name parsed: "${productInfo.productName}"`);
  } else {
    observedEvidence.push('Product name was not identified from typography.');
    warningIndicators.push('Specific product name could not be deterministically parsed.');
  }

  // 5. Batch & Lot Verification
  if (productInfo.batchNumber || productInfo.lotNumber) {
    const batch = productInfo.batchNumber || productInfo.lotNumber;
    score += 10;
    positiveIndicators.push(`Batch / Lot identifier found (${batch}).`);
    observedEvidence.push(`Production batch identified: ${batch}`);
  } else {
    observedEvidence.push('No batch or lot identifier was found on the scanned image.');
    warningIndicators.push('No production batch or lot number was detected.');
  }

  // 6. Dates Consistency & Chronology Check
  const mfgTime = parseDateValue(productInfo.manufacturingDate);
  const expTime = parseDateValue(productInfo.expiryDate);

  if (productInfo.manufacturingDate) {
    score += 4;
    positiveIndicators.push(`Manufacturing date declared: ${productInfo.manufacturingDate}.`);
    observedEvidence.push(`Manufacturing date: ${productInfo.manufacturingDate}`);
  }
  if (productInfo.expiryDate) {
    score += 4;
    positiveIndicators.push(`Expiration / best-before date declared: ${productInfo.expiryDate}.`);
    observedEvidence.push(`Expiration date: ${productInfo.expiryDate}`);
  }

  // Chronology conflict check
  let dateConflict = false;
  if (mfgTime && expTime && expTime < mfgTime) {
    dateConflict = true;
    warningIndicators.push(`Contradictory dates: Expiration date (${productInfo.expiryDate}) occurs before manufacturing date (${productInfo.manufacturingDate}).`);
    observedEvidence.push('Severe anomaly: Expiration date precedes manufacturing date.');
    score = Math.max(0, score - 30);
  }

  if (!productInfo.manufacturingDate && !productInfo.expiryDate && !productInfo.detectedDate) {
    observedEvidence.push('No production or expiry date was found.');
  }

  // 7. Pricing & Regulatory Ingredients
  if (productInfo.mrp) {
    score += 4;
    positiveIndicators.push(`Mandatory price declaration found: ${productInfo.mrp}.`);
    observedEvidence.push(`Retail price declaration: ${productInfo.mrp}`);
  }
  if (productInfo.ingredients && productInfo.ingredients.length > 0) {
    score += 5;
    positiveIndicators.push(`Declared key active ingredients detected (${productInfo.ingredients.slice(0, 3).join(', ')}).`);
    observedEvidence.push(`Ingredients identified: ${productInfo.ingredients.join(', ')}`);
  }
  if (productInfo.netWeight || productInfo.volume) {
    score += 3;
    positiveIndicators.push(`Net metric volume/weight declared (${productInfo.netWeight || productInfo.volume}).`);
  }

  // 8. Database Verification Layer
  const dbResult = result.databaseVerification ?? verifyAgainstDatabase(productInfo, barcode);
  observedEvidence.push(`Database verification status: ${dbResult.status} (${dbResult.statusLabel})`);

  let dbConflict = false;
  if (dbResult.status === 'MATCHED') {
    score += 15;
    positiveIndicators.push(dbResult.details);
    dbResult.notes.forEach(note => positiveIndicators.push(note));
  } else if (dbResult.status === 'PARTIAL_MATCH') {
    score += 8;
    positiveIndicators.push(dbResult.details);
  } else if (dbResult.status === 'NO_MATCH') {
    // True conflict: Barcode belongs to one brand, text claims another!
    dbConflict = true;
    score = Math.max(0, score - 35);
    warningIndicators.push(dbResult.details);
    dbResult.notes.forEach(note => warningIndicators.push(note));
  } else {
    // UNKNOWN: Product not in database.
    // RULE: Database absence is NOT evidence of counterfeit!
    limitations.push('Product is not currently registered in the local reference index. Absence from catalog does not mean counterfeit.');
  }

  // 9. Normalized Score & Classification
  const normalizedScore = Math.max(0, Math.min(100, score));

  // Determine Risk Level
  let riskLevel: RiskLevel;
  let statusLabel: string;
  let explanation: string;
  let recommendation: string;

  if (dateConflict || dbConflict) {
    riskLevel = 'HIGH_RISK';
    statusLabel = 'High Risk';
    explanation = dbConflict
      ? 'Significant contradictions were detected between barcode metadata and packaging typography, indicating elevated counterfeit risk.'
      : 'Conflicting packaging dates detected (expiry precedes manufacturing date), suggesting packaging tampering or printing error.';
    recommendation = 'Do not consume or apply this product. Request verification from the brand manufacturer or return to the vendor.';
  } else if (normalizedScore >= 75 && (barcode.detected || qr.detected) && productInfo.brand && (productInfo.productName || productInfo.batchNumber)) {
    riskLevel = 'LIKELY_GENUINE';
    statusLabel = 'Likely Genuine';
    explanation = 'Multiple consistent packaging signals, valid code structures, and recognized brand typography were detected with no anomalous indicators.';
    recommendation = 'Product packaging exhibits standard authenticity markers. Retain purchase receipt for warranty/verification records.';
  } else if (normalizedScore >= 45 && (productInfo.brand || productInfo.productName)) {
    riskLevel = 'SUSPICIOUS';
    statusLabel = 'Suspicious / Incomplete';
    explanation = 'Partial product packaging signals were verified, but essential markers (such as barcode match or batch confirmation) are missing or unverified.';
    recommendation = 'Inspect physical packaging for security seals or batch stamps. Consider scanning the reverse face of the box for barcode verification.';
  } else {
    riskLevel = 'UNABLE_TO_VERIFY';
    statusLabel = 'Unable to Verify';
    explanation = 'Available optical data contains insufficient identifiable packaging signals or readable text to establish an authenticity assessment.';
    recommendation = 'Capture a well-lit, steady photograph of the product label, batch stamp, or barcode to retry analysis.';
  }

  // Calculate assessment confidence based on input clarity
  const hasCode = barcode.detected || qr.detected;
  const hasOcr = (ocr?.rawText?.trim().length ?? 0) > 20;
  const hasBrand = !!productInfo.brand;
  const confidence = Math.min(
    100,
    Math.round(
      ((hasCode ? 35 : 10) +
      (hasOcr ? (ocrConfidence ? ocrConfidence * 40 : 25) : 5) +
      (hasBrand ? 25 : 5))
    )
  );

  return {
    authenticityScore: normalizedScore,
    riskLevel,
    confidence,
    status: statusLabel,
    explanation,
    positiveIndicators,
    warningIndicators,
    evidence: observedEvidence,
    verificationLimitations: limitations,
    recommendation,

    // Backwards-compatible fields
    score: normalizedScore,
    positiveEvidence: positiveIndicators,
    warnings: warningIndicators,
    riskFactors: warningIndicators
  };
}

export default evaluateAuthenticity;
