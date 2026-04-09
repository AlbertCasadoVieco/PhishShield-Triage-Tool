// API Service Module for PhishShield Analyzer

const VIRUSTOTAL_API_KEY = '2fe313ca57bb6a2962b1fd8f69daf40cac501bcdfde653295ec38c9011d77036';
const URLSCAN_API_KEY = '019d72ab-c0cb-739c-8ad3-a5d8f7338d19';
const ABUSEIPDB_API_KEY = '7b062e5395458559da6ee6b86dc81ce575b947a5b8b2c47752ccd63f9404417a88a431344d8258b0';

export interface APIThreatResult {
  virusTotal?: {
    malicious: number;
    suspicious: number;
    detected: boolean;
  };
  urlscan?: {
    malicious: boolean;
    suspicious: boolean;
  };
  abuseipdb?: {
    abuseScore: number;
    isMalicious: boolean;
  };
}

// VirusTotal Check for URL
export const checkVirusTotalURL = async (url: string): Promise<APIThreatResult['virusTotal']> => {
  try {
    // Encode URL to base64 for VirusTotal API
    const urlEncoded = btoa(url).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    const response = await fetch(
      `https://www.virustotal.com/api/v3/urls/${urlEncoded}`,
      {
        method: 'GET',
        headers: {
          'x-apikey': VIRUSTOTAL_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.warn('VirusTotal API error:', response.status);
      return undefined;
    }

    const data = await response.json();
    const stats = data.data?.attributes?.last_analysis_stats || {};

    return {
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      detected: (stats.malicious || 0) > 0 || (stats.suspicious || 0) > 0,
    };
  } catch (error) {
    console.warn('VirusTotal check failed:', error);
    return undefined;
  }
};

// URLScan.io Check
export const checkURLScan = async (url: string): Promise<APIThreatResult['urlscan']> => {
  try {
    const response = await fetch(
      `https://urlscan.io/api/v1/search/?q=url:${encodeURIComponent(url)}`,
      {
        method: 'GET',
        headers: {
          'API-Key': URLSCAN_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.warn('URLScan API error:', response.status);
      return undefined;
    }

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) return undefined;

    const firstResult = results[0];
    const verdict = firstResult.verdict || {};

    return {
      malicious: verdict.malicious || false,
      suspicious: verdict.suspicious || false,
    };
  } catch (error) {
    console.warn('URLScan check failed:', error);
    return undefined;
  }
};

// AbuseIPDB Check for IP
export const checkAbuseIPDB = async (ip: string): Promise<APIThreatResult['abuseipdb']> => {
  try {
    const response = await fetch(
      `https://api.abuseipdb.com/api/v2/check`,
      {
        method: 'GET',
        headers: {
          'Key': ABUSEIPDB_API_KEY,
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          ipAddress: ip,
          maxAgeInDays: '90',
        }).toString(),
      }
    );

    if (!response.ok) {
      console.warn('AbuseIPDB API error:', response.status);
      return undefined;
    }

    const data = await response.json();
    const abuseData = data.data || {};

    return {
      abuseScore: abuseData.abuseConfidenceScore || 0,
      isMalicious: (abuseData.abuseConfidenceScore || 0) > 50,
    };
  } catch (error) {
    console.warn('AbuseIPDB check failed:', error);
    return undefined;
  }
};

// Batch check all URLs
export const checkAllURLs = async (urls: string[]): Promise<Map<string, APIThreatResult>> => {
  const results = new Map<string, APIThreatResult>();

  for (const url of urls) {
    const [vt, urlscan] = await Promise.all([
      checkVirusTotalURL(url),
      checkURLScan(url),
    ]);

    results.set(url, { virusTotal: vt, urlscan });
  }

  return results;
};

// Check IP reputation
export const checkIPReputation = async (ip: string): Promise<APIThreatResult['abuseipdb']> => {
  return checkAbuseIPDB(ip);
};
