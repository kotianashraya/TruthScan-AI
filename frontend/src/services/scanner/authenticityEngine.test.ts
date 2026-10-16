import { describe, expect, it } from 'vitest';
import { evaluateAuthenticity } from './authenticityEngine';
import type { ProductDetectionResult } from '@/types/ProductDetectionResult';
import { resolveScanRiskLevel } from '@/types/AuthenticityResult';

function mockResult(overrides: Partial<ProductDetectionResult> = {}): ProductDetectionResult {
  return {
    imageUrl: null,
    processingTimeMs: 120,
    qr: { detected: false, rawValue: null, url: null },
    barcode: { detected: false, format: null, value: null },
    ocr: { status: 'completed', rawText: '', confidence: null },
    productInfo: {},
    errors: [],
    ...overrides
  };
}

describe('TruthScan AI Authenticity Engine', () => {
  it('returns UNABLE_TO_VERIFY when no optical signals are detected', () => {
    const assessment = evaluateAuthenticity(mockResult());
    expect(assessment.authenticityScore).toBe(0);
    expect(assessment.score).toBe(0);
    expect(assessment.riskLevel).toBe('UNABLE_TO_VERIFY');
    expect(assessment.status).toBe('Unable to Verify');
    expect(assessment.verificationLimitations.length).toBeGreaterThan(0);
  });

  it('does not treat a barcode alone as sufficient proof of authenticity', () => {
    const assessment = evaluateAuthenticity(mockResult({
      barcode: { detected: true, format: 'EAN_13', value: '8906128100155' }
    }));
    expect(assessment.authenticityScore).toBeGreaterThan(0);
    expect(assessment.riskLevel).toBe('UNABLE_TO_VERIFY');
    expect(assessment.positiveIndicators.some(i => i.toLowerCase().includes('barcode'))).toBe(true);
    expect(assessment.warningIndicators.some(w => w.toLowerCase().includes('brand') || w.toLowerCase().includes('ocr'))).toBe(true);
  });

  it('classifies strong product typography without codes as SUSPICIOUS', () => {
    const assessment = evaluateAuthenticity(mockResult({
      ocr: { status: 'success', rawText: 'Kraft Original Cream Cheese Batch ABC123 Mfg 01/2025 Exp 01/2027', confidence: 0.9 },
      productInfo: {
        brand: 'Kraft',
        productName: 'Original Cream Cheese',
        batchNumber: 'ABC123',
        manufacturingDate: '01/2025',
        expiryDate: '01/2027'
      }
    }));
    expect(assessment.authenticityScore).toBeGreaterThanOrEqual(45);
    expect(assessment.riskLevel).toBe('SUSPICIOUS');
    expect(assessment.status).toBe('Suspicious / Incomplete');
    expect(assessment.positiveIndicators.some(i => i.includes('Kraft'))).toBe(true);
  });

  it('classifies multi-signal alignment (barcode + OCR + brand + dates) as LIKELY_GENUINE', () => {
    const assessment = evaluateAuthenticity(mockResult({
      qr: { detected: true, rawValue: 'https://example.com/verify', url: 'https://example.com/verify' },
      barcode: { detected: true, format: 'EAN_13', value: '8906128100155' },
      ocr: { status: 'success', rawText: 'Minimalist Sunscreen SPF 50 PA++++ Batch MIN992 Mfg 01/2025 Exp 01/2027', confidence: 0.92 },
      productInfo: {
        brand: 'Minimalist',
        productName: 'Sunscreen SPF 50',
        batchNumber: 'MIN992',
        manufacturingDate: '01/2025',
        expiryDate: '01/2027'
      }
    }));
    expect(assessment.authenticityScore).toBeGreaterThanOrEqual(75);
    expect(assessment.riskLevel).toBe('LIKELY_GENUINE');
    expect(assessment.status).toBe('Likely Genuine');
    expect(assessment.confidence).toBeGreaterThan(70);
  });

  it('detects date conflict (expiry before manufacturing) and classifies as HIGH_RISK', () => {
    const assessment = evaluateAuthenticity(mockResult({
      barcode: { detected: true, format: 'EAN_13', value: '8906128100155' },
      ocr: { status: 'success', rawText: 'Product label text', confidence: 0.85 },
      productInfo: {
        brand: 'Minimalist',
        productName: 'Sunscreen SPF 50',
        manufacturingDate: '12/2026',
        expiryDate: '01/2025' // Anomaly: Expiry is before manufacturing!
      }
    }));
    expect(assessment.riskLevel).toBe('HIGH_RISK');
    expect(assessment.status).toBe('High Risk');
    expect(assessment.warningIndicators.some(w => w.includes('Contradictory dates'))).toBe(true);
  });

  it('detects catalog brand/barcode mismatch and classifies as HIGH_RISK', () => {
    // Barcode 021000612239 belongs to Kraft Cream Cheese, but text claims Minimalist
    const assessment = evaluateAuthenticity(mockResult({
      barcode: { detected: true, format: 'UPC_A', value: '021000612239' },
      ocr: { status: 'success', rawText: 'Minimalist Facial Serum', confidence: 0.9 },
      productInfo: {
        brand: 'Minimalist',
        productName: 'Facial Serum'
      }
    }));
    expect(assessment.riskLevel).toBe('HIGH_RISK');
    expect(assessment.warningIndicators.some(w => w.toLowerCase().includes('mismatch') || w.toLowerCase().includes('conflicts'))).toBe(true);
  });

  it('strictly adheres to rule: database absence does not mark product as counterfeit', () => {
    const assessment = evaluateAuthenticity(mockResult({
      barcode: { detected: true, format: 'EAN_13', value: '9999999999999' },
      ocr: { status: 'success', rawText: 'Unindexed Artisanal Soap Batch #771', confidence: 0.88 },
      productInfo: {
        brand: 'Unindexed Brand',
        productName: 'Artisanal Soap',
        batchNumber: '771'
      }
    }));
    // Must NOT be marked HIGH_RISK just because it's not in the database!
    expect(assessment.riskLevel).not.toBe('HIGH_RISK');
    expect(assessment.verificationLimitations.some(l => l.includes('Absence from catalog does not mean counterfeit'))).toBe(true);
  });

  describe('resolveScanRiskLevel Universal Classifier', () => {
    it('never inflates UNABLE_TO_VERIFY to HIGH_RISK, even with score 8/100', () => {
      const scan = {
        authenticityScore: 8,
        riskLevel: 'UNABLE_TO_VERIFY',
        verdict: 'UNABLE_TO_VERIFY'
      };
      expect(resolveScanRiskLevel(scan)).toBe('UNABLE_TO_VERIFY');
    });

    it('classifies hard fails as HIGH_RISK', () => {
      const scan = {
        authenticityScore: 10,
        hardFails: ['Barcode database mismatch']
      };
      expect(resolveScanRiskLevel(scan)).toBe('HIGH_RISK');
    });

    it('classifies high score genuine scans as LIKELY_GENUINE', () => {
      const scan = {
        authenticityScore: 92,
        verdict: 'GENUINE'
      };
      expect(resolveScanRiskLevel(scan)).toBe('LIKELY_GENUINE');
    });
  });
});
