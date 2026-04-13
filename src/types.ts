export type Verdict = 'SAFE' | 'MALICIOUS' | 'SUSPICIOUS';

export interface AnalysisRecord {
  id: string;
  timestamp: string;
  sender: string;
  subject: string;
  verdict: Verdict;
  headers: string;
  body: string;
  score?: number;
  category?: string;
  subcategory?: string;
  triggers?: string[];
  extra?: any;
}

export interface WhitelistEntry {
  domain: string;
  description: string;
  addedAt: string;
}
