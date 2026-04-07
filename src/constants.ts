import { AnalysisRecord, WhitelistEntry } from './types';

export const MOCK_HISTORY: AnalysisRecord[] = [
  {
    id: 'SH-9042',
    timestamp: '2023-11-24 14:22:10',
    sender: 'support@bank-verify.com',
    subject: 'Action Required: Account Suspended',
    verdict: 'MALICIOUS',
    headers: 'From: support@bank-verify.com\nReturn-Path: attacker@evil.com\nSPF: fail',
    body: 'Your account has been suspended. Please click here to verify.'
  },
  {
    id: 'SH-9041',
    timestamp: '2023-11-24 13:05:44',
    sender: 'it-service@internal-corp.net',
    subject: 'Software Update: Q4 Patchset',
    verdict: 'SAFE',
    headers: 'From: it-service@internal-corp.net\nReturn-Path: it-service@internal-corp.net\nSPF: pass',
    body: 'The latest security patches are ready for deployment.'
  },
  {
    id: 'SH-9040',
    timestamp: '2023-11-23 23:59:12',
    sender: 'j.doe@unknown-external.io',
    subject: 'Invoice_003841.pdf.exe',
    verdict: 'SUSPICIOUS',
    headers: 'From: j.doe@unknown-external.io\nReturn-Path: j.doe@unknown-external.io\nSPF: neutral',
    body: 'Please find the attached invoice.'
  },
  {
    id: 'SH-9039',
    timestamp: '2023-11-23 20:15:02',
    sender: 'hr@legit-company.com',
    subject: 'Benefit Enrollment Period',
    verdict: 'SAFE',
    headers: 'From: hr@legit-company.com\nReturn-Path: hr@legit-company.com\nSPF: pass',
    body: 'The open enrollment period starts next week.'
  },
  {
    id: 'SH-9038',
    timestamp: '2023-11-23 18:44:30',
    sender: 'no-reply@amazon-secure.cc',
    subject: 'Your Order #8271 is delayed',
    verdict: 'MALICIOUS',
    headers: 'From: no-reply@amazon-secure.cc\nReturn-Path: bounce@scam-center.org\nSPF: fail',
    body: 'Your order is delayed. Click here to track.'
  }
];

export const MOCK_WHITELIST: WhitelistEntry[] = [
  {
    domain: 'google.com',
    description: 'Global System Default Cluster',
    addedAt: '2023-01-01'
  },
  {
    domain: 'microsoft.com',
    description: 'Enterprise Infrastructure Root',
    addedAt: '2023-01-01'
  }
];
