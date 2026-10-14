export type VisionPackagingConsistency = 'CONSISTENT' | 'INCONSISTENT' | 'NOT_ASSESSABLE';

export type VisionRiskHint =
  | 'SUPPORTS_GENUINE'
  | 'SUPPORTS_SUSPICIOUS'
  | 'SUPPORTS_HIGH_RISK'
  | 'INCONCLUSIVE';

export interface VisionAssessment {
  status: 'COMPLETED' | 'FAILED' | 'UNAVAILABLE';
  model?: string | null;
  confidence: number;
  packagingConsistency: VisionPackagingConsistency;
  aiRiskHint: VisionRiskHint;
  packagingObservations: string[];
  positiveVisualIndicators: string[];
  visualWarningIndicators: string[];
  visibleTextIssues: string[];
  tamperEvidence: string[];
  limitations: string[];
  processingTimeMs?: number;
  error?: string | null;
}
