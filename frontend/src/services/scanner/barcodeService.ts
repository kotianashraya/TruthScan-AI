import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType, NotFoundException } from '@zxing/library';

const STATIC_DECODE_TIMEOUT_MS = 4_000;
const BARCODE_REGION_START = 0.4;
const BARCODE_REGION_SCALE = 2;

export interface DetectedBarcode {
  format: string;
  value: string;
}

async function createBarcodeRegionImage(img: HTMLImageElement | HTMLCanvasElement) {
  const sourceWidth = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
  const sourceHeight = img instanceof HTMLImageElement ? img.naturalHeight : img.height;
  const regionTop = Math.floor(sourceHeight * BARCODE_REGION_START);
  const regionHeight = sourceHeight - regionTop;
  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth * BARCODE_REGION_SCALE;
  canvas.height = regionHeight * BARCODE_REGION_SCALE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Barcode region canvas is unavailable.');
  context.imageSmoothingEnabled = false;
  context.drawImage(
    img,
    0,
    regionTop,
    sourceWidth,
    regionHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const regionImage = document.createElement('img');
  regionImage.src = canvas.toDataURL('image/png');
  await new Promise<void>((resolve, reject) => {
    regionImage.onload = () => resolve();
    regionImage.onerror = () => reject(new Error('Barcode region image failed to load.'));
  });
  return regionImage;
}

export async function detectBarcodeFromImage(
  img: HTMLImageElement | HTMLCanvasElement,
  formats?: BarcodeFormat[]
): Promise<DetectedBarcode | null> {
  if (!(img instanceof HTMLImageElement) && !(img instanceof HTMLCanvasElement)) {
    throw new Error('Invalid image input for code detection.');
  }

  const hints = formats ? new Map([[DecodeHintType.POSSIBLE_FORMATS, formats]]) : undefined;
  const reader = new BrowserMultiFormatReader(hints);
  try {
    const originalResult = await decodeSource(reader, img);
    if (originalResult) return originalResult;

    const barcodeRegion = await withTimeout(
      createBarcodeRegionImage(img),
      STATIC_DECODE_TIMEOUT_MS,
      'Barcode region preparation timed out.'
    );
    return await decodeSource(reader, barcodeRegion);
  } finally {
    reader.reset();
  }
}

async function decodeSource(reader: BrowserMultiFormatReader, source: HTMLImageElement | HTMLCanvasElement) {
  try {
    const result = await withTimeout(
      reader.decodeFromImageElement(source as HTMLImageElement),
      STATIC_DECODE_TIMEOUT_MS,
      'Static code detection timed out.'
    );
    if (result) return { format: result.getBarcodeFormat().toString(), value: result.getText() };
  } catch (error) {
    if (error instanceof NotFoundException || error instanceof TimeoutError) return null;
    throw error;
  }
  return null;
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
