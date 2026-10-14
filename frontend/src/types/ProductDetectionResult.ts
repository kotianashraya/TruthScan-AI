import type { AuthenticityResult } from './AuthenticityResult';
import type { ProductVerificationResult } from './ProductDatabase';
import type { VisionAssessment } from './VisionAssessment';

export interface QRResult {
  detected: boolean;
  rawValue?: string | null;
  url?: string | null;
}

export interface BarcodeResult {
  detected: boolean;
  format?: string | null;
  value?: string | null;
}

export interface OCRResult {
  status: 'success' | 'completed' | 'failed';
  rawText: string;
  confidence?: number | null;
  durationMs?: number;
  error?: string | null;
}

export interface ProductInfo {
  brand?: string | null;
  productName?: string | null;
  productType?: string | null;
  variant?: string | null;
  quantity?: string | null;
  ingredients?: string[] | null;
  netWeight?: string | null;
  volume?: string | null;
  manufacturer?: string | null;
  countryOfOrigin?: string | null;
  batchNumber?: string | null;
  lotNumber?: string | null;
  mrp?: string | null;
  spf?: string | null;
  productFeatures?: string[] | null;
  parserConfidence?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  detectedDate?: string | null;
}

export interface ProductDetectionResult {
  imageUrl: string | null;
  processingTimeMs: number;
  ocrProcessingTimeMs?: number;
  timings?: {
    imageLoadingTimeMs: number;
    qrDetectionTimeMs: number;
    barcodeDetectionTimeMs: number;
    ocrInitializationTimeMs: number;
    ocrPreprocessingTimeMs: number;
    ocrRecognitionTimeMs: number;
    productParsingTimeMs: number;
    databaseVerificationTimeMs?: number;
    authenticityEvaluationTimeMs?: number;
  };
  qr: QRResult;
  barcode: BarcodeResult;
  ocr: OCRResult | null;
  productInfo: ProductInfo;
  databaseVerification?: ProductVerificationResult;
  authenticity?: AuthenticityResult;
  /** Server-side multimodal AI vision assessment; optional and non-authoritative. */
  visionAssessment?: VisionAssessment;
  errors: string[];
}
