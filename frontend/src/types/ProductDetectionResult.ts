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
  error?: string | null;
}

export interface ProductInfo {
  brand?: string | null;
  productName?: string | null;
  productType?: string | null;
  variant?: string | null;
  quantity?: string | null;
  ingredients?: string[] | null;
  manufacturer?: string | null;
  countryOfOrigin?: string | null;
  batchNumber?: string | null;
  lotNumber?: string | null;
  mrp?: string | null;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
}

export interface ProductDetectionResult {
  imageUrl: string;
  processingTimeMs: number;
  ocrProcessingTimeMs?: number;
  qr: QRResult;
  barcode: BarcodeResult;
  ocr: OCRResult | null;
  productInfo: ProductInfo;
  errors: string[];
}
