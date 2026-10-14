export type RiskLevel =
  | 'LIKELY_GENUINE'
  | 'SUSPICIOUS'
  | 'HIGH_RISK'
  | 'UNABLE_TO_VERIFY';

export type AuthenticityStatus =
  | 'likely_authentic'
  | 'suspicious'
  | 'high_risk'
  | 'insufficient_evidence'
  | RiskLevel;

export interface AuthenticityResult {
  /** Authenticity score from 0 to 100 */
  authenticityScore: number;
  /** Primary risk classification */
  riskLevel: RiskLevel;
  /** Confidence in the assessment (0 to 100) */
  confidence: number;
  /** Human-readable status label */
  status: string;
  /** Neutral, fact-grounded explanation */
  explanation: string;
  /** Signals indicating consistency or expected markers */
  positiveIndicators: string[];
  /** Signals indicating anomalies, missing standard markers, or conflicts */
  warningIndicators: string[];
  /** List of observed factual evidence */
  evidence: string[];
  /** Limitations of optical & digital verification */
  verificationLimitations: string[];
  /** Actionable recommendation for user */
  recommendation: string;

  // Backwards compatibility fields
  score: number;
  positiveEvidence: string[];
  warnings: string[];
  riskFactors: string[];
}
