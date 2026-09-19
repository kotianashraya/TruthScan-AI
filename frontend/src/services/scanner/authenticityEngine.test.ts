import { describe, expect, it } from 'vitest';
import { evaluateAuthenticity } from './authenticityEngine';
import type { ProductDetectionResult } from '@/types/ProductDetectionResult';

function result(overrides: Partial<ProductDetectionResult> = {}): ProductDetectionResult {
  return {
    imageUrl: null,
    processingTimeMs: 100,
    qr: { detected: false, rawValue: null, url: null },
    barcode: { detected: false, format: null, value: null },
    ocr: { status: 'completed', rawText: '', confidence: null },
    productInfo: {},
    errors: [],
    ...overrides
  };
}

describe('deterministic authenticity engine', () => {
  it('returns insufficient evidence when no signals are available', () => {
    const assessment = evaluateAuthenticity(result());
    expect(assessment.score).toBe(0);
    expect(assessment.status).toBe('insufficient_evidence');
  });

  it('does not treat a barcode alone as authentic', () => {
    const assessment = evaluateAuthenticity(result({
      barcode: { detected: true, format: 'EAN_13', value: '8809647392668' }
    }));
    expect(assessment.score).toBe(12);
    expect(assessment.status).toBe('insufficient_evidence');
    expect(assessment.warnings.some(warning => warning.includes('barcode'))).toBe(true);
  });

  it('returns suspicious for strong product evidence without code verification', () => {
    const assessment = evaluateAuthenticity(result({
      ocr: { status: 'success', rawText: 'Kraft Original Cream Cheese', confidence: 0.9 },
      productInfo: {
        brand: 'Kraft',
        productName: 'Original Cream Cheese',
        batchNumber: 'ABC123',
        manufacturingDate: '01/2025',
        expiryDate: '01/2027'
      }
    }));
    expect(assessment.score).toBe(60);
    expect(assessment.status).toBe('suspicious');
  });

  it('requires multiple signals for likely authentic', () => {
    const assessment = evaluateAuthenticity(result({
      qr: { detected: true, rawValue: 'https://example.test/item', url: 'https://example.test/item' },
      barcode: { detected: true, format: 'EAN_13', value: '8809647392668' },
      ocr: { status: 'success', rawText: 'Kraft Original Cream Cheese', confidence: 0.9 },
      productInfo: {
        brand: 'Kraft',
        productName: 'Original Cream Cheese',
        batchNumber: 'ABC123',
        manufacturingDate: '01/2025',
        expiryDate: '01/2027'
      }
    }));
    expect(assessment.score).toBe(84);
    expect(assessment.status).toBe('likely_authentic');
  });
});
