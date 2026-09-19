import type { ProductDetectionResult } from '@/types/ProductDetectionResult';
import type { AuthenticityResult, AuthenticityStatus } from '@/types/AuthenticityResult';

function statusForScore(score: number): AuthenticityStatus {
  if (score >= 80) return 'likely_authentic';
  if (score >= 50) return 'suspicious';
  if (score >= 25) return 'high_risk';
  return 'insufficient_evidence';
}

function confidenceEvidence(confidence: number | null | undefined) {
  if (confidence == null || confidence <= 0) return null;
  if (confidence >= 0.85) return { points: 20, text: `OCR confidence is ${Math.round(confidence * 100)}%.` };
  if (confidence >= 0.7) return { points: 15, text: `OCR confidence is ${Math.round(confidence * 100)}%.` };
  if (confidence >= 0.5) return { points: 10, text: `OCR confidence is ${Math.round(confidence * 100)}%.` };
  return { points: 5, text: `OCR returned limited text at ${Math.round(confidence * 100)}% confidence.` };
}

export function evaluateAuthenticity(result: ProductDetectionResult): AuthenticityResult {
  let score = 0;
  const positiveEvidence: string[] = [];
  const warnings: string[] = [
    'This is a deterministic evidence assessment, not database or laboratory authenticity verification.'
  ];
  const riskFactors: string[] = [];
  const productInfo = result.productInfo ?? {};
  const ocr = result.ocr;

  if (result.barcode.detected && result.barcode.value) {
    score += 12;
    positiveEvidence.push(`Barcode detected (${result.barcode.format ?? 'format unavailable'}).`);
    warnings.push('A barcode can be copied and does not prove authenticity.');
  } else {
    riskFactors.push('No barcode was detected.');
  }

  if (result.qr.detected && result.qr.rawValue) {
    score += 12;
    positiveEvidence.push('QR code detected.');
    warnings.push('A QR code can be copied and does not prove authenticity.');
  } else {
    riskFactors.push('No QR code was detected.');
  }

  const ocrEvidence = confidenceEvidence(ocr?.confidence);
  if (ocr?.status === 'success' && ocrEvidence) {
    score += ocrEvidence.points;
    positiveEvidence.push(ocrEvidence.text);
  } else {
    riskFactors.push(ocr?.status === 'failed' ? 'OCR failed.' : 'OCR did not provide reliable text evidence.');
  }

  if (productInfo.brand) {
    score += 14;
    positiveEvidence.push(`Brand identified: ${productInfo.brand}.`);
  } else {
    riskFactors.push('Brand was not identified.');
  }

  if (productInfo.productName) {
    score += 14;
    positiveEvidence.push(`Product identified: ${productInfo.productName}.`);
  } else {
    riskFactors.push('Product name was not identified.');
  }

  if (productInfo.batchNumber || productInfo.lotNumber) {
    score += 8;
    positiveEvidence.push('Batch or lot identifier detected.');
  } else {
    riskFactors.push('No batch or lot identifier was detected.');
  }

  if (productInfo.manufacturingDate) {
    score += 4;
    positiveEvidence.push(`Manufacturing date detected: ${productInfo.manufacturingDate}.`);
  }

  if (productInfo.expiryDate) {
    score += 4;
    positiveEvidence.push(`Expiry date detected: ${productInfo.expiryDate}.`);
  }

  if (!productInfo.manufacturingDate && !productInfo.expiryDate && !productInfo.detectedDate) {
    riskFactors.push('No product date evidence was detected.');
  }

  if (result.errors.length > 0) {
    warnings.push('One or more scanner stages reported errors.');
  }

  const normalizedScore = Math.max(0, Math.min(100, score));
  const status = statusForScore(normalizedScore);
  const explanation = status === 'likely_authentic'
    ? 'Multiple independent product and code signals were detected, but authenticity is not guaranteed.'
    : status === 'suspicious'
      ? 'Some product evidence was detected, but important verification signals are missing or incomplete.'
      : status === 'high_risk'
        ? 'Only limited or low-confidence evidence was detected; the result should be treated cautiously.'
        : 'There is not enough reliable evidence to assess this product.';

  return {
    score: normalizedScore,
    status,
    positiveEvidence,
    warnings,
    riskFactors,
    explanation
  };
}

export default evaluateAuthenticity;
