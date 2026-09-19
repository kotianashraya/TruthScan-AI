import type { ProductDetectionResult } from './ProductDetectionResult';

export interface ScanRecord extends ProductDetectionResult {
  id: string;
  uid: string;
  createdAt: unknown;
  scanStatus: 'completed';
  authenticityStatus: 'authentic' | 'suspicious' | 'counterfeit' | null;
  authenticityScore: null;
}