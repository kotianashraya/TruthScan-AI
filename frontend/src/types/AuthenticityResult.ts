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

export function resolveScanRiskLevel(scan: {
  riskLevel?: string | null;
  authenticityStatus?: string | null;
  authenticity?: { riskLevel?: string | null; status?: string | null } | null;
  authenticityScore?: number | null;
  score?: number | null;
} | null | undefined): RiskLevel {
  if (!scan) return 'UNABLE_TO_VERIFY';

  const raw = (scan.riskLevel || scan.authenticity?.riskLevel || '').toUpperCase().trim();
  if (raw === 'LIKELY_GENUINE' || raw === 'LIKELY_AUTHENTIC') return 'LIKELY_GENUINE';
  if (raw === 'SUSPICIOUS') return 'SUSPICIOUS';
  if (raw === 'HIGH_RISK') return 'HIGH_RISK';
  if (raw === 'UNABLE_TO_VERIFY' || raw === 'INSUFFICIENT_EVIDENCE' || raw === 'UNVERIFIED') return 'UNABLE_TO_VERIFY';

  const status = (scan.authenticityStatus || scan.authenticity?.status || '').toLowerCase().trim();
  if (status.includes('genuine') || status.includes('authentic')) return 'LIKELY_GENUINE';
  if (status.includes('suspicious') || status.includes('incomplete')) return 'SUSPICIOUS';
  if (status.includes('high risk') || status.includes('anomalies')) return 'HIGH_RISK';
  if (status.includes('unable') || status.includes('insufficient') || status.includes('unverified')) return 'UNABLE_TO_VERIFY';

  // Fallback solely if no risk string is available:
  // Low score without a confirmed anomaly conflict must NEVER become HIGH_RISK!
  const score = scan.authenticityScore ?? scan.score;
  if (score != null) {
    if (score >= 75) return 'LIKELY_GENUINE';
    if (score >= 45) return 'SUSPICIOUS';
    return 'UNABLE_TO_VERIFY';
  }

  return 'UNABLE_TO_VERIFY';
}
