import { describe, expect, it } from 'vitest';
import { verifyAgainstDatabase } from './productDatabase';

describe('Product Database Verification Layer', () => {
  it('returns MATCHED when barcode and brand match verified catalog entry', () => {
    const result = verifyAgainstDatabase(
      { brand: 'Minimalist', productName: 'Sunscreen SPF 50', batchNumber: 'MIN12345' },
      { detected: true, format: 'EAN_13', value: '8906128100155' }
    );
    expect(result.status).toBe('MATCHED');
    expect(result.brandMatched).toBe(true);
    expect(result.barcodeMatched).toBe(true);
    expect(result.matchedRecord?.brand).toBe('Minimalist');
  });

  it('returns PARTIAL_MATCH when brand is recognized but barcode is unlisted or absent', () => {
    const result = verifyAgainstDatabase(
      { brand: 'CeraVe', productName: 'Hydrating Facial Cleanser' },
      { detected: false }
    );
    expect(result.status).toBe('PARTIAL_MATCH');
    expect(result.brandMatched).toBe(true);
    expect(result.barcodeMatched).toBe(false);
  });

  it('detects cross-brand barcode conflict and returns NO_MATCH', () => {
    // 021000612239 is Kraft Cream Cheese barcode, but label says CeraVe
    const result = verifyAgainstDatabase(
      { brand: 'CeraVe', productName: 'Moisturizing Cream' },
      { detected: true, format: 'UPC_A', value: '021000612239' }
    );
    expect(result.status).toBe('NO_MATCH');
    expect(result.details.toLowerCase()).toContain('mismatch');
  });

  it('returns UNKNOWN when product is not in database without falsely claiming counterfeit', () => {
    const result = verifyAgainstDatabase(
      { brand: 'Unknown Artisan Brand', productName: 'Handmade Lotion' },
      { detected: false }
    );
    expect(result.status).toBe('UNKNOWN');
    expect(result.statusLabel).toBe('Not In Reference Database');
    expect(result.notes.some(n => n.includes('must not be interpreted as counterfeit'))).toBe(true);
  });

  it('returns UNKNOWN when completely empty input is passed', () => {
    const result = verifyAgainstDatabase({}, { detected: false });
    expect(result.status).toBe('UNKNOWN');
    expect(result.brandMatched).toBe(false);
  });

  it('recognizes Nykaa Leave-in Conditioner and Himalaya Lip Balm in the verified catalog', () => {
    const nykaaRes = verifyAgainstDatabase(
      { brand: 'Nykaa', productName: 'Weightless Leave-in Conditioner' },
      { detected: false }
    );
    expect(nykaaRes.status).toBe('PARTIAL_MATCH');
    expect(nykaaRes.brandMatched).toBe(true);
    expect(nykaaRes.matchedRecord?.productName).toBe('Weightless Leave-in Conditioner');

    const himalayaRes = verifyAgainstDatabase(
      { brand: 'Himalaya', productName: 'Lip Balm' },
      { detected: true, format: 'EAN_13', value: '8901138501198' }
    );
    expect(himalayaRes.status).toBe('MATCHED');
    expect(himalayaRes.brandMatched).toBe(true);
    expect(himalayaRes.barcodeMatched).toBe(true);
  });
});
