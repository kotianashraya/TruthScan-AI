import {
  BarcodeFormat,
  BinaryBitmap,
  BrowserMultiFormatReader,
  DecodeHintType,
  HTMLCanvasElementLuminanceSource,
  HybridBinarizer,
  NotFoundException
} from '@zxing/library';

const ATTEMPT_TIMEOUT_MS = 2_000;
const MAX_CANVAS_DIMENSION = 1600;

export interface DetectedBarcode {
  format: string;
  value: string;
}

export interface BarcodeAttempt {
  step: 'FULL_IMAGE' | 'CROP_REGION' | 'ROTATE_90_CW' | 'ROTATE_90_CCW' | 'ROTATE_180';
  status: 'SUCCESS' | 'NOT_FOUND' | 'ERROR';
  durationMs: number;
  error?: string;
}

export interface BarcodeDiagnostics {
  status: 'DETECTED' | 'NOT_DETECTED' | 'FAILED';
  sourceWidth: number;
  sourceHeight: number;
  attempts: BarcodeAttempt[];
  detectedBarcode: DetectedBarcode | null;
  userMessage: string;
}

function getSourceDimensions(img: HTMLImageElement | HTMLCanvasElement): { width: number; height: number } {
  if (!img) return { width: 0, height: 0 };
  if (typeof HTMLImageElement !== 'undefined' && img instanceof HTMLImageElement) {
    return {
      width: img.naturalWidth || img.width || 0,
      height: img.naturalHeight || img.height || 0
    };
  }
  return {
    width: (img as any)?.width || 0,
    height: (img as any)?.height || 0
  };
}

function decodeFromCanvas(reader: BrowserMultiFormatReader, canvas: HTMLCanvasElement): DetectedBarcode | null {
  try {
    const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas);
    const hybridBinarizer = new HybridBinarizer(luminanceSource);
    const binaryBitmap = new BinaryBitmap(hybridBinarizer);
    const result = reader.decodeBitmap(binaryBitmap);
    if (result && result.getText()) {
      return { format: result.getBarcodeFormat().toString(), value: result.getText() };
    }
  } catch (error) {
    if (error instanceof NotFoundException || (error as any)?.name === 'NotFoundException') {
      return null;
    }
    // Checksum or format error on this frame means not found on this attempt
    return null;
  }
  return null;
}

async function decodeFromImageElement(reader: BrowserMultiFormatReader, img: HTMLImageElement): Promise<DetectedBarcode | null> {
  try {
    const result = await reader.decodeFromImageElement(img);
    if (result && result.getText()) {
      return { format: result.getBarcodeFormat().toString(), value: result.getText() };
    }
  } catch (error) {
    if (error instanceof NotFoundException || (error as any)?.name === 'NotFoundException') {
      return null;
    }
    return null;
  }
  return null;
}

function createCropCanvas(
  source: HTMLImageElement | HTMLCanvasElement,
  sourceW: number,
  sourceH: number,
  topRatio = 0.35
): HTMLCanvasElement | null {
  try {
    const cropTop = Math.floor(sourceH * topRatio);
    const cropH = sourceH - cropTop;
    if (cropH <= 0 || sourceW <= 0) return null;

    const scale = Math.min(1.5, MAX_CANVAS_DIMENSION / Math.max(sourceW, cropH));
    const targetW = Math.max(1, Math.round(sourceW * scale));
    const targetH = Math.max(1, Math.round(cropH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 0, cropTop, sourceW, cropH, 0, 0, targetW, targetH);
    return canvas;
  } catch (err) {
    console.warn('[BARCODE] crop canvas creation error', err);
    return null;
  }
}

function createRotatedCanvas(
  source: HTMLImageElement | HTMLCanvasElement,
  sourceW: number,
  sourceH: number,
  degrees: 90 | 180 | 270
): HTMLCanvasElement | null {
  try {
    const is90or270 = degrees === 90 || degrees === 270;
    const rawTargetW = is90or270 ? sourceH : sourceW;
    const rawTargetH = is90or270 ? sourceW : sourceH;
    if (rawTargetW <= 0 || rawTargetH <= 0) return null;

    const scale = Math.min(1, MAX_CANVAS_DIMENSION / Math.max(rawTargetW, rawTargetH));
    const targetW = Math.max(1, Math.round(rawTargetW * scale));
    const targetH = Math.max(1, Math.round(rawTargetH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.save();
    if (degrees === 90) {
      ctx.translate(targetW, 0);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(source, 0, 0, targetH, targetW);
    } else if (degrees === 270) {
      ctx.translate(0, targetH);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(source, 0, 0, targetH, targetW);
    } else if (degrees === 180) {
      ctx.translate(targetW, targetH);
      ctx.rotate(Math.PI);
      ctx.drawImage(source, 0, 0, targetW, targetH);
    }
    ctx.restore();
    return canvas;
  } catch (err) {
    console.warn(`[BARCODE] rotated ${degrees}° canvas error`, err);
    return null;
  }
}

class TimeoutError extends Error {}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new TimeoutError(message)), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function detectBarcodeWithDiagnostics(
  img: HTMLImageElement | HTMLCanvasElement,
  formats?: BarcodeFormat[]
): Promise<{ result: DetectedBarcode | null; diagnostics: BarcodeDiagnostics }> {
  const { width: sourceW, height: sourceH } = getSourceDimensions(img);

  const diagnostics: BarcodeDiagnostics = {
    status: 'NOT_DETECTED',
    sourceWidth: sourceW,
    sourceHeight: sourceH,
    attempts: [],
    detectedBarcode: null,
    userMessage: 'Barcode not detected. You can still continue with OCR and product analysis.'
  };

  if (sourceW <= 0 || sourceH <= 0) {
    diagnostics.status = 'FAILED';
    diagnostics.userMessage = 'Barcode processing failed. We continued with other verification signals.';
    return { result: null, diagnostics };
  }

  if (typeof document === 'undefined') {
    diagnostics.status = 'NOT_DETECTED';
    diagnostics.userMessage = 'Barcode detection requires a browser environment.';
    return { result: null, diagnostics };
  }

  const hints = formats ? new Map([[DecodeHintType.POSSIBLE_FORMATS, formats]]) : undefined;
  const reader = new BrowserMultiFormatReader(hints);

  try {
    // 1. Attempt FULL original image
    const t0 = performance.now();
    try {
      let fullResult: DetectedBarcode | null = null;
      if (img instanceof HTMLImageElement) {
        fullResult = await withTimeout(
          decodeFromImageElement(reader, img),
          ATTEMPT_TIMEOUT_MS,
          'Full image decode timed out.'
        );
      } else {
        fullResult = decodeFromCanvas(reader, img);
      }

      const dur = performance.now() - t0;
      if (fullResult) {
        diagnostics.attempts.push({ step: 'FULL_IMAGE', status: 'SUCCESS', durationMs: Math.round(dur) });
        diagnostics.status = 'DETECTED';
        diagnostics.detectedBarcode = fullResult;
        diagnostics.userMessage = `Barcode detected (${fullResult.format})`;
        return { result: fullResult, diagnostics };
      }
      diagnostics.attempts.push({ step: 'FULL_IMAGE', status: 'NOT_FOUND', durationMs: Math.round(dur) });
    } catch (err: any) {
      diagnostics.attempts.push({ step: 'FULL_IMAGE', status: 'ERROR', durationMs: Math.round(performance.now() - t0), error: err?.message });
    }

    // 2. Attempt lower-half CROP REGION (direct canvas luminance - zero toDataURL overhead)
    const t1 = performance.now();
    try {
      const cropCanvas = createCropCanvas(img, sourceW, sourceH, 0.35);
      if (cropCanvas) {
        const cropResult = decodeFromCanvas(reader, cropCanvas);
        const dur = performance.now() - t1;
        if (cropResult) {
          diagnostics.attempts.push({ step: 'CROP_REGION', status: 'SUCCESS', durationMs: Math.round(dur) });
          diagnostics.status = 'DETECTED';
          diagnostics.detectedBarcode = cropResult;
          diagnostics.userMessage = `Barcode detected (${cropResult.format})`;
          return { result: cropResult, diagnostics };
        }
        diagnostics.attempts.push({ step: 'CROP_REGION', status: 'NOT_FOUND', durationMs: Math.round(dur) });
      }
    } catch (err: any) {
      diagnostics.attempts.push({ step: 'CROP_REGION', status: 'ERROR', durationMs: Math.round(performance.now() - t1), error: err?.message });
    }

    // 3. Attempt ROTATED 90° Clockwise
    const t2 = performance.now();
    try {
      const rot90 = createRotatedCanvas(img, sourceW, sourceH, 90);
      if (rot90) {
        const rot90Result = decodeFromCanvas(reader, rot90);
        const dur = performance.now() - t2;
        if (rot90Result) {
          diagnostics.attempts.push({ step: 'ROTATE_90_CW', status: 'SUCCESS', durationMs: Math.round(dur) });
          diagnostics.status = 'DETECTED';
          diagnostics.detectedBarcode = rot90Result;
          diagnostics.userMessage = `Barcode detected (${rot90Result.format})`;
          return { result: rot90Result, diagnostics };
        }
        diagnostics.attempts.push({ step: 'ROTATE_90_CW', status: 'NOT_FOUND', durationMs: Math.round(dur) });
      }
    } catch (err: any) {
      diagnostics.attempts.push({ step: 'ROTATE_90_CW', status: 'ERROR', durationMs: Math.round(performance.now() - t2), error: err?.message });
    }

    // 4. Attempt ROTATED 90° Counter-Clockwise (270° CW)
    const t3 = performance.now();
    try {
      const rot270 = createRotatedCanvas(img, sourceW, sourceH, 270);
      if (rot270) {
        const rot270Result = decodeFromCanvas(reader, rot270);
        const dur = performance.now() - t3;
        if (rot270Result) {
          diagnostics.attempts.push({ step: 'ROTATE_90_CCW', status: 'SUCCESS', durationMs: Math.round(dur) });
          diagnostics.status = 'DETECTED';
          diagnostics.detectedBarcode = rot270Result;
          diagnostics.userMessage = `Barcode detected (${rot270Result.format})`;
          return { result: rot270Result, diagnostics };
        }
        diagnostics.attempts.push({ step: 'ROTATE_90_CCW', status: 'NOT_FOUND', durationMs: Math.round(dur) });
      }
    } catch (err: any) {
      diagnostics.attempts.push({ step: 'ROTATE_90_CCW', status: 'ERROR', durationMs: Math.round(performance.now() - t3), error: err?.message });
    }

    // 5. Attempt ROTATED 180°
    const t4 = performance.now();
    try {
      const rot180 = createRotatedCanvas(img, sourceW, sourceH, 180);
      if (rot180) {
        const rot180Result = decodeFromCanvas(reader, rot180);
        const dur = performance.now() - t4;
        if (rot180Result) {
          diagnostics.attempts.push({ step: 'ROTATE_180', status: 'SUCCESS', durationMs: Math.round(dur) });
          diagnostics.status = 'DETECTED';
          diagnostics.detectedBarcode = rot180Result;
          diagnostics.userMessage = `Barcode detected (${rot180Result.format})`;
          return { result: rot180Result, diagnostics };
        }
        diagnostics.attempts.push({ step: 'ROTATE_180', status: 'NOT_FOUND', durationMs: Math.round(dur) });
      }
    } catch (err: any) {
      diagnostics.attempts.push({ step: 'ROTATE_180', status: 'ERROR', durationMs: Math.round(performance.now() - t4), error: err?.message });
    }

    return { result: null, diagnostics };
  } finally {
    try {
      reader.reset();
    } catch {
      // Ignore reset error on cleanup
    }
  }
}

export async function detectBarcodeFromImage(
  img: HTMLImageElement | HTMLCanvasElement,
  formats?: BarcodeFormat[]
): Promise<DetectedBarcode | null> {
  const { result } = await detectBarcodeWithDiagnostics(img, formats);
  return result;
}
