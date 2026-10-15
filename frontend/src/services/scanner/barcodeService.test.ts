import { describe, expect, it } from 'vitest';
import { BarcodeFormat } from '@zxing/library';
import { detectBarcodeFromImage, detectBarcodeWithDiagnostics } from './barcodeService';

describe('TruthScan AI Barcode Detection Service', () => {
  it('returns null and FAILED status when null or zero-dimension source is provided', async () => {
    const { result, diagnostics } = await detectBarcodeWithDiagnostics(null as any);
    expect(result).toBeNull();
    expect(diagnostics.status).toBe('FAILED');
    expect(diagnostics.userMessage).toContain('Barcode processing failed');
  });

  it('detectBarcodeFromImage returns null gracefully without throwing for null input', async () => {
    const result = await detectBarcodeFromImage(null as any);
    expect(result).toBeNull();
  });

  it('handles mocked source with dimensions in Node environment safely', async () => {
    const mockImage = { width: 400, height: 300 } as any;
    const { result, diagnostics } = await detectBarcodeWithDiagnostics(mockImage, [BarcodeFormat.EAN_13]);
    expect(result).toBeNull();
    expect(diagnostics.status).toBe('NOT_DETECTED');
    expect(diagnostics.sourceWidth).toBe(400);
    expect(diagnostics.sourceHeight).toBe(300);
    expect(diagnostics.userMessage).toContain('Barcode detection requires a browser environment.');
  });
});
