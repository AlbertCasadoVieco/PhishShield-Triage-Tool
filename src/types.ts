export type Verdict = 'SAFE' | 'MALICIOUS' | 'SUSPICIOUS';

export interface AnalysisRecord {
  id: string;
  timestamp: string;
  sender: string;
  subject: string;
  verdict: Verdict;
  headers: string;
  body: string;
}

export interface WhitelistEntry {
  domain: string;
  description: string;
  addedAt: string;
}
