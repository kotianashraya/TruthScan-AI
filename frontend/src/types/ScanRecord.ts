import type { ProductDetectionResult } from './ProductDetectionResult';
import type { AuthenticityResult, RiskLevel } from './AuthenticityResult';
import type { ProductVerificationResult } from './ProductDatabase';

export interface ScanRecord extends ProductDetectionResult {
  id: string;
  uid: string;
  userId?: string;
  createdAt: unknown;
  updatedAt?: unknown;
  scanStatus: 'completed' | 'processing' | 'failed';
  authenticityStatus: string | null;
  authenticityScore: number | null;
  riskLevel?: RiskLevel | null;
  authenticity?: AuthenticityResult;
  databaseVerification?: ProductVerificationResult;
}