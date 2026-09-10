import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/library';

export interface DetectedBarcode {
  format: string;
  value: string;
}

export async function detectBarcodeFromImage(img: HTMLImageElement | HTMLCanvasElement): Promise<DetectedBarcode | null> {
  try {
    const reader = new BrowserMultiFormatReader();

    // BrowserMultiFormatReader supports decodeFromImageElement
    if (img instanceof HTMLImageElement) {
      const result = await reader.decodeFromImageElement(img);
      if (result) return { format: result.getBarcodeFormat().toString(), value: result.getText() };
    }

    // For canvas, convert to data URL and create an image element
    if (img instanceof HTMLCanvasElement) {
      const dataUrl = img.toDataURL('image/png');
      const image = document.createElement('img');
      image.src = dataUrl;
      await new Promise((res) => { image.onload = res; image.onerror = res; });
      const result = await reader.decodeFromImageElement(image);
      if (result) return { format: result.getBarcodeFormat().toString(), value: result.getText() };
    }

    return null;
  } catch (err) {
    console.warn('Barcode detection error', err);
    return null;
  }
}
