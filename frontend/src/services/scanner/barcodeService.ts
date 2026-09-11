import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType, NotFoundException } from '@zxing/library';

export interface DetectedBarcode {
  format: string;
  value: string;
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
  let source = img;

  if (img instanceof HTMLCanvasElement) {
    const dataUrl = img.toDataURL('image/png');
    const image = document.createElement('img');
    image.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image failed to load for code detection.'));
    });
    source = image;
  }

  try {
    const result = await reader.decodeFromImageElement(source as HTMLImageElement);
    return result ? { format: result.getBarcodeFormat().toString(), value: result.getText() } : null;
  } catch (error) {
    if (error instanceof NotFoundException) return null;
    throw error;
  }
}
