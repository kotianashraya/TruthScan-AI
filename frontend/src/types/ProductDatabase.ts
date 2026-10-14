export type VerificationStatus = 'MATCHED' | 'PARTIAL_MATCH' | 'NO_MATCH' | 'UNKNOWN';

export interface VerifiedProductRecord {
  id: string;
  brand: string;
  productName: string;
  variant?: string;
  barcode?: string;
  category: string;
  manufacturer: string;
  typicalBatchPattern?: RegExp | string;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  keyIngredients?: string[];
  features?: string[];
}

export interface ProductVerificationResult {
  status: VerificationStatus;
  statusLabel: string;
  details: string;
  brandMatched: boolean;
  productMatched: boolean;
  barcodeMatched: boolean;
  matchedRecord: VerifiedProductRecord | null;
  notes: string[];
}
