import { describe, expect, it } from 'vitest';
import { parseProductInfo, findMeasurement } from './productParser';

describe('TruthScan AI Product Parser', () => {
  it('does not turn barcode-like numeric OCR into product information', () => {
    const result = parseProductInfo('647 " 39266 8"809');

    expect(result.brand == null).toBe(true);
    expect(result.productName == null).toBe(true);
    expect(result.mrp == null).toBe(true);
    expect(result.netWeight == null).toBe(true);
    expect(result.volume == null).toBe(true);
    expect(result.quantity == null).toBe(true);
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
    expect(result.volume).toBe('50 ml');
    expect(result.quantity).toBe('50 ml');
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
    expect(result.quantity).toBeNull();
  });

  describe('Quantity Parser & Year/Batch False-Positive Prevention', () => {
    it('does not treat "Since 1930" as product quantity', () => {
      expect(findMeasurement('Since 1930')).toBeNull();
      const info = parseProductInfo('Himalaya Since 1930 Lip Balm');
      expect(info.quantity).toBeNull();
    });

    it('does not treat "Batch 2026" as product quantity', () => {
      expect(findMeasurement('Batch 2026')).toBeNull();
      const info = parseProductInfo('Batch 2026 Exp 2028');
      expect(info.quantity).toBeNull();
    });

    it('does not treat "EXP 2028" as product quantity', () => {
      expect(findMeasurement('EXP 2028')).toBeNull();
    });

    it('does not treat arbitrary years like "2023" as product quantity', () => {
      expect(findMeasurement('2023')).toBeNull();
      expect(findMeasurement('2023 g')).toBeNull();
      expect(findMeasurement('Copyright 2023')).toBeNull();
    });

    it('correctly extracts anchored quantity "Net Wt 10 g"', () => {
      expect(findMeasurement('Net Wt 10 g')).toBe('10 g');
      const info = parseProductInfo('Himalaya Lip Balm Net Wt. 10 g');
      expect(info.brand).toBe('Himalaya');
      expect(info.productName).toBe('Lip Balm');
      expect(info.quantity).toBe('10 g');
      expect(info.netWeight).toBe('10 g');
    });

    it('correctly extracts anchored volume "Net Vol 120 ml"', () => {
      expect(findMeasurement('Net Vol 120 ml')).toBe('120 ml');
      expect(findMeasurement('Net Vol. 120 ml')).toBe('120 ml');
    });

    it('returns null when no quantity is present', () => {
      expect(findMeasurement('No quantity')).toBeNull();
      expect(findMeasurement('')).toBeNull();
    });

    it('handles attached units like 120ml and 10g without anchors', () => {
      expect(findMeasurement('Volume: 120ml')).toBe('120 ml');
      expect(findMeasurement('10g')).toBe('10 g');
    });
  });

  describe('Nykaa & Himalaya Real-World Product Regression Cases', () => {
    it('extracts Nykaa Weightless Leave-in Conditioner with 120 ml and ingredients', () => {
      const nykaaFrontOcr = `
        NYKAA
        Weightless Leave-in Conditioner
        Argan + Frizz Control
        Mango Butter
        Ginseng Root Extract
        Net Vol. 120 ml
      `;

      const info = parseProductInfo(nykaaFrontOcr);
      expect(info.brand).toBe('Nykaa');
      expect(info.productName).toBe('Weightless Leave-in Conditioner');
      expect(info.variant).toContain('Argan + Frizz Control');
      expect(info.volume).toBe('120 ml');
      expect(info.quantity).toBe('120 ml');
      expect(info.ingredients).toContain('Argan Oil');
      expect(info.ingredients).toContain('Mango Butter');
      expect(info.ingredients).toContain('Ginseng Root Extract');
    });

    it('extracts Himalaya Lip Balm with 10 g and herbs', () => {
      const himalayaFrontOcr = `
        Himalaya
        Since 1930
        Lip Balm
        Wheatgerm Oil
        Carrot Seed Oil
        Net Wt. 10 g
      `;

      const info = parseProductInfo(himalayaFrontOcr);
      expect(info.brand).toBe('Himalaya');
      expect(info.productName).toBe('Lip Balm');
      expect(info.quantity).toBe('10 g');
      expect(info.netWeight).toBe('10 g');
      expect(info.ingredients).toContain('Wheatgerm Oil');
      expect(info.ingredients).toContain('Carrot Seed Oil');
    });
  });
});