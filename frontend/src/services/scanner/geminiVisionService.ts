import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/firebase';
import type { VisionAssessment } from '@/types/VisionAssessment';
import type { ProductInfo, BarcodeResult, QRResult } from '@/types/ProductDetectionResult';

const functions = getFunctions(app, 'us-central1');

interface VisionContext {
  ocrText: string;
  ocrConfidence: number | null;
  productInfo: ProductInfo;
  barcode: BarcodeResult;
  qr: QRResult;
}

interface VisionCallableRequest {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  context: VisionContext;
}

interface VisionCallableResponse {
  model: string;
  confidence: number;
  packagingConsistency: VisionAssessment['packagingConsistency'];
  aiRiskHint: VisionAssessment['aiRiskHint'];
  packagingObservations: string[];
  positiveVisualIndicators: string[];
  visualWarningIndicators: string[];
  visibleTextIssues: string[];
  tamperEvidence: string[];
  limitations: string[];
}

const analyzeProductVisionCallable = httpsCallable<VisionCallableRequest, VisionCallableResponse>(
  functions,
  'analyzeProductVision'
);

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function prepareImageForVision(file: File): Promise<{
  imageBase64: string;
  mimeType: 'image/jpeg';
}> {
  const image = await loadImage(file);
  const maxDimension = 1600;
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error('Unable to determine image dimensions for AI vision.');
  }

  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Unable to prepare image for AI vision.');

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error('Unable to encode image for AI vision.')),
      'image/jpeg',
      0.82
    );
  });

  if (blob.size > 2_500_000) {
    const fallbackCanvas = document.createElement('canvas');
    const fallbackScale = 1200 / Math.max(width, height);
    fallbackCanvas.width = Math.max(1, Math.round(width * fallbackScale));
    fallbackCanvas.height = Math.max(1, Math.round(height * fallbackScale));
    const fallbackContext = fallbackCanvas.getContext('2d', { alpha: false });
    if (!fallbackContext) throw new Error('Unable to prepare compact image for AI vision.');
    fallbackContext.drawImage(canvas, 0, 0, fallbackCanvas.width, fallbackCanvas.height);

    const fallbackBlob = await new Promise<Blob>((resolve, reject) => {
      fallbackCanvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error('Unable to encode compact image for AI vision.')),
        'image/jpeg',
        0.72
      );
    });

    return {
      imageBase64: await blobToBase64(fallbackBlob),
      mimeType: 'image/jpeg'
    };
  }

  return {
    imageBase64: await blobToBase64(blob),
    mimeType: 'image/jpeg'
  };
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const separatorIndex = dataUrl.indexOf(',');
      if (separatorIndex < 0) {
        reject(new Error('Unable to encode AI vision image.'));
        return;
      }
      resolve(dataUrl.slice(separatorIndex + 1));
    };
    reader.onerror = () => reject(new Error('Unable to read image for AI vision.'));
    reader.readAsDataURL(blob);
  });
}

export async function analyzeProductVision(
  file: File,
  context: VisionContext
): Promise<VisionAssessment> {
  const startedAt = performance.now();
  const prepared = await prepareImageForVision(file);

  const response = await analyzeProductVisionCallable({
    imageBase64: prepared.imageBase64,
    mimeType: prepared.mimeType,
    context: {
      ocrText: context.ocrText.slice(0, 6000),
      ocrConfidence: context.ocrConfidence,
      productInfo: {
        brand: context.productInfo.brand ?? null,
        productName: context.productInfo.productName ?? null,
        variant: context.productInfo.variant ?? null,
        batchNumber: context.productInfo.batchNumber ?? null,
        lotNumber: context.productInfo.lotNumber ?? null,
        mrp: context.productInfo.mrp ?? null,
        manufacturingDate: context.productInfo.manufacturingDate ?? null,
        expiryDate: context.productInfo.expiryDate ?? null,
        netWeight: context.productInfo.netWeight ?? null,
        volume: context.productInfo.volume ?? null,
        spf: context.productInfo.spf ?? null
      },
      barcode: context.barcode,
      qr: context.qr
    }
  });

  const value = response.data;

  return {
    status: 'COMPLETED',
    model: value.model,
    confidence: clampConfidence(value.confidence),
    packagingConsistency: value.packagingConsistency,
    aiRiskHint: value.aiRiskHint,
    packagingObservations: value.packagingObservations ?? [],
    positiveVisualIndicators: value.positiveVisualIndicators ?? [],
    visualWarningIndicators: value.visualWarningIndicators ?? [],
    visibleTextIssues: value.visibleTextIssues ?? [],
    tamperEvidence: value.tamperEvidence ?? [],
    limitations: value.limitations ?? [],
    processingTimeMs: Math.round(performance.now() - startedAt)
  };
}
