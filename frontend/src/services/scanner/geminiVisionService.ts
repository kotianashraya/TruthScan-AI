import type { VisionAssessment } from '@/types/VisionAssessment';
import type { ProductInfo, BarcodeResult, QRResult } from '@/types/ProductDetectionResult';

interface VisionContext {
  ocrText: string;
  ocrConfidence: number | null;
  productInfo: ProductInfo;
  barcode: BarcodeResult;
  qr: QRResult;
}

interface WorkerResponse {
  status: 'COMPLETED' | 'FAILED';
  model?: string;
  confidence?: number;
  packagingConsistency?: VisionAssessment['packagingConsistency'];
  aiRiskHint?: VisionAssessment['aiRiskHint'];
  packagingObservations?: string[];
  positiveVisualIndicators?: string[];
  visualWarningIndicators?: string[];
  visibleTextIssues?: string[];
  tamperEvidence?: string[];
  limitations?: string[];
  error?: string;
}

const visionUrl = (import.meta.env.VITE_AI_VISION_URL || '').trim();

function clampConfidence(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : 0;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      const comma = value.indexOf(',');
      if (comma < 0) {
        reject(new Error('Unable to encode image for AI vision.'));
        return;
      }
      resolve(value.slice(comma + 1));
    };
    reader.onerror = () => reject(new Error('Unable to read image for AI vision.'));
    reader.readAsDataURL(file);
  });
}

export async function analyzeProductVision(
  file: File,
  context: VisionContext
): Promise<VisionAssessment> {
  if (!visionUrl) {
    return {
      status: 'UNAVAILABLE',
      confidence: 0,
      packagingConsistency: 'NOT_ASSESSABLE',
      aiRiskHint: 'INCONCLUSIVE',
      packagingObservations: [],
      positiveVisualIndicators: [],
      visualWarningIndicators: [],
      visibleTextIssues: [],
      tamperEvidence: [],
      limitations: [
        'Free multimodal AI vision endpoint is not configured. Deterministic verification continues.'
      ]
    };
  }

  const startedAt = performance.now();
  const rawBase64 = await fileToBase64(file);

  const response = await fetch(visionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageBase64: rawBase64,
      mimeType: file.type || 'image/jpeg',
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
    })
  });

  let payload: WorkerResponse;
  try {
    payload = await response.json() as WorkerResponse;
  } catch {
    throw new Error('Free AI vision endpoint returned an invalid response.');
  }

  if (!response.ok || payload.status !== 'COMPLETED') {
    throw new Error(payload.error || 'Free AI vision service is unavailable.');
  }

  return {
    status: 'COMPLETED',
    model: payload.model || '@cf/google/gemma-4-26b-a4b-it',
    confidence: clampConfidence(payload.confidence),
    packagingConsistency: payload.packagingConsistency || 'NOT_ASSESSABLE',
    aiRiskHint: payload.aiRiskHint || 'INCONCLUSIVE',
    packagingObservations: payload.packagingObservations || [],
    positiveVisualIndicators: payload.positiveVisualIndicators || [],
    visualWarningIndicators: payload.visualWarningIndicators || [],
    visibleTextIssues: payload.visibleTextIssues || [],
    tamperEvidence: payload.tamperEvidence || [],
    limitations: payload.limitations || [],
    processingTimeMs: Math.round(performance.now() - startedAt)
  };
}
