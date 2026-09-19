import { describe, expect, it } from 'vitest';
import { parseProductInfo } from './productParser';

describe('product parser barcode noise handling', () => {
  it('does not turn barcode-like numeric OCR into product information', () => {
    const result = parseProductInfo('647 " 39266 8"809');

    expect(result.brand == null).toBe(true);
    expect(result.productName == null).toBe(true);
    expect(result.mrp == null).toBe(true);
    expect(result.netWeight == null).toBe(true);
    expect(result.volume == null).toBe(true);
  });
});