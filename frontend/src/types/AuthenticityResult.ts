export type RiskLevel = 'LIKELY_GENUINE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'UNABLE_TO_VERIFY';

export interface AuthenticityResult {
  score: number;
  authenticityScore: number;
  confidence: number;
  status: string;
  riskLevel: RiskLevel;
  verdictLabel?: string;
  summary?: string;
  explanation?: string;
  recommendation?: string;
  evidence: string[];
  positiveIndicators: string[];
  warningIndicators: string[];
  hardFails?: string[];
  anomalies?: string[];
  verificationLimitations: string[];
  breakdown?: {
    category: string;
    score: number;
    maxScore: number;
    details: string;
  }[];
  positiveEvidence?: string[];
  warnings?: string[];
  riskFactors?: string[];
}

/**
 * Universal deterministic risk resolver.
 * Ensures UNABLE_TO_VERIFY is NEVER conflated with HIGH_RISK.
 * High Risk requires an actual contradiction / hard conflict (e.g., date impossibility,
 * barcode brand mismatch), whereas missing signals or lack of database catalog record
 * cleanly yield UNABLE_TO_VERIFY or SUSPICIOUS.
 */
export function resolveScanRiskLevel(scan: {
  riskLevel?: string | null;
  authenticityStatus?: string | null;
  authenticity?: { riskLevel?: string | null; status?: string | null; hardFails?: string[] | null } | null;
  authenticityScore?: number | null;
  score?: number | null;
  hardFails?: string[] | null;
  verdict?: string | null;
} | null | undefined): RiskLevel {
  if (!scan) return 'UNABLE_TO_VERIFY';

  const raw = (scan.riskLevel || scan.authenticity?.riskLevel || scan.verdict || '').toUpperCase().trim();
  if (raw === 'LIKELY_GENUINE' || raw === 'LIKELY_AUTHENTIC' || raw === 'GENUINE') return 'LIKELY_GENUINE';
  if (raw === 'SUSPICIOUS') return 'SUSPICIOUS';
  if (raw === 'HIGH_RISK' || raw === 'COUNTERFEIT') return 'HIGH_RISK';
  if (raw === 'UNABLE_TO_VERIFY' || raw === 'INSUFFICIENT_EVIDENCE' || raw === 'UNVERIFIED') return 'UNABLE_TO_VERIFY';

  const status = (scan.authenticityStatus || scan.authenticity?.status || '').toLowerCase().trim();
  if (status.includes('genuine') || status.includes('authentic')) return 'LIKELY_GENUINE';
  if (status.includes('suspicious') || status.includes('incomplete')) return 'SUSPICIOUS';
  if (status.includes('high risk') || status.includes('anomalies') || status.includes('counterfeit')) return 'HIGH_RISK';
  if (status.includes('unable') || status.includes('insufficient') || status.includes('unverified')) return 'UNABLE_TO_VERIFY';

  // Check hard fails (e.g. date conflict, barcode database mismatch)
  const fails = scan.hardFails || scan.authenticity?.hardFails;
  if (fails && fails.length > 0) return 'HIGH_RISK';

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
