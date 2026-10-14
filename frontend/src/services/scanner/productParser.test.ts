import { describe, expect, it } from 'vitest';
import { parseProductInfo } from './productParser';

describe('TruthScan AI Product Parser', () => {
  it('does not turn barcode-like numeric OCR into product information', () => {
    const result = parseProductInfo('647 " 39266 8"809');

    expect(result.brand == null).toBe(true);
    expect(result.productName == null).toBe(true);
    expect(result.mrp == null).toBe(true);
    expect(result.netWeight == null).toBe(true);
    expect(result.volume == null).toBe(true);
  });

  it('correctly extracts brand, product name, batch, dates, mrp, and ingredients from rich label text', () => {
    const sampleOcr = `
      Minimalist
      Sunscreen SPF 50
      Broad Spectrum PA++++
      Batch No: MNL8492
      Mfg: 02/2025
      Exp: 02/2027
      MRP: ₹399
      Net Vol: 50 ml
      Ingredients: Niacinamide, Vitamin B5, Zinc Oxide
    `;

    const result = parseProductInfo(sampleOcr);
    expect(result.brand).toBe('Minimalist');
    expect(result.productName?.toLowerCase()).toContain('sunscreen');
    expect(result.batchNumber).toBe('MNL8492');
    expect(result.manufacturingDate).toBe('02/2025');
    expect(result.expiryDate).toBe('02/2027');
    expect(result.mrp).toBe('₹399');
    expect(result.volume).toContain('50 ml');
    expect(result.ingredients?.some(i => i.toLowerCase().includes('niacinamide'))).toBe(true);
    expect(result.spf).toBe('SPF 50');
    expect(result.parserConfidence).toBeGreaterThan(60);
  });

  it('preserves null for unknown fields and never invents values', () => {
    const sparseText = 'Face Wash';
    const result = parseProductInfo(sparseText);

    expect(result.brand).toBeNull();
    expect(result.productName).toBe('Face Wash');
    expect(result.batchNumber).toBeNull();
    expect(result.manufacturingDate).toBeNull();
    expect(result.expiryDate).toBeNull();
    expect(result.mrp).toBeNull();
    expect(result.ingredients).toBeUndefined();
  });
});