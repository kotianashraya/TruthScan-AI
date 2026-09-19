export type AuthenticityStatus =
  | 'likely_authentic'
  | 'suspicious'
  | 'high_risk'
  | 'insufficient_evidence';

export interface AuthenticityResult {
  score: number;
  status: AuthenticityStatus;
  positiveEvidence: string[];
  warnings: string[];
  riskFactors: string[];
  explanation: string;
}
