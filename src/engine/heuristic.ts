import { WhitelistEntry, Verdict, AnalysisRecord } from '../types';
import rules from './rules.json';

export const decodeEmailContent = (content: string): string => {
  try {
    let decoded = content;

    decoded = decoded.replace(/=\r?\n/g, '');

    decoded = decoded.replace(/=\?(utf-8|iso-8859-1|windows-1252)\?B\?([^?]+)\?=/gi, (match, charset, b64) => {
      try {
        const binString = atob(b64);
        const bytes = new Uint8Array(binString.length);
        for (let i = 0; i < binString.length; i++) bytes[i] = binString.charCodeAt(i);
        return new TextDecoder().decode(bytes);
      } catch {
        return match;
      }
    });
    
    decoded = decoded.replace(/=\?(utf-8|iso-8859-1|windows-1252)\?Q\?([^?]+)\?=/gi, (match, charset, qp) => {
      try {
        return decodeURIComponent(qp.replace(/_/g, '%20').replace(/=([0-9A-Fa-f]{2})/g, '%$1'));
      } catch {
        return match;
      }
    });

    try {
        const urlEncoded = decoded.replace(/=([0-9A-Fa-f]{2})/g, '%$1');
        decoded = decodeURIComponent(urlEncoded);
    } catch {
        decoded = decoded.replace(/=([0-9A-Fa-f]{2})/g, (match, hex) => {
          return String.fromCharCode(parseInt(hex, 16));
        });
    }

    decoded = decoded
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200D\uFEFF]/g, '')
      .replace(/&zwnj;/gi, '')
      .replace(/&nbsp;|\u00A0/g, ' ')
      .replace(/\r?\n\s*\r?\n/g, '\n\n');

    return decoded.trim();
  } catch {
    return content;
  }
};

export const extractKeyHeaders = (
  headersRaw: string
): {
  from: string;
  to: string;
  returnPath: string;
  subject: string;
  date: string;
  spf: string;
  dkim: string;
  dmarc: string;
  raw: string;
} => {
  const lines = headersRaw.split(/\r?\n/);
  const headers: Record<string, string> = {};
  let lastKey = '';

  for (const line of lines) {
    if (/^\s/.test(line) && lastKey) {
      headers[lastKey] += ' ' + line.trim();
    } else {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        lastKey = match[1].toLowerCase();
        headers[lastKey] = match[2].trim();
      }
    }
  }

  const getHeader = (key: string) => headers[key] || 'N/A';

  const authResults = getHeader('authentication-results');
  const spfMatch = authResults.match(/spf=(\w+)/i) || headersRaw.match(/spf=(\w+)/i);
  const dkimMatch = authResults.match(/dkim=(\w+)/i) || headersRaw.match(/dkim=(\w+)/i);
  const dmarcMatch = authResults.match(/dmarc=(\w+)/i) || headersRaw.match(/dmarc=(\w+)/i);

  let returnPath = getHeader('return-path');
  if (returnPath !== 'N/A') {
    const rpMatch = returnPath.match(/<?([^>\n]+)>?/);
    if (rpMatch) returnPath = rpMatch[1];
  }

  return {
    from: getHeader('from'),
    to: getHeader('to'),
    returnPath: returnPath,
    subject: decodeEmailContent(getHeader('subject')),
    date: getHeader('date'),
    spf: (spfMatch ? spfMatch[1] : 'NONE').toUpperCase(),
    dkim: (dkimMatch ? dkimMatch[1] : 'NONE').toUpperCase(),
    dmarc: (dmarcMatch ? dmarcMatch[1] : 'NONE').toUpperCase(),
    raw: headersRaw.substring(0, 1000)
  };
};

export const extractBodyText = (text: string): string => {
  // If the content is HTML, we need to extract the text.
  const lowercaseText = text.toLowerCase();
  if (lowercaseText.includes('<html') || lowercaseText.includes('<body') || lowercaseText.includes('</div>') || lowercaseText.includes('<p>')) {
    
    let textContent = "";
    let imgCount = 0;

    // Check if we are in a Web Worker (no DOM access)
    if (typeof DOMParser === 'undefined') {
      // Basic regex stripping for worker environment
      textContent = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/&nbsp;/g, ' ')
                        .replace(/&zwnj;/g, '');
      
      const imgMatches = text.match(/<img[^>]+>/gi);
      imgCount = imgMatches ? imgMatches.length : 0;
    } else {
      // Browser environment with full DOM access
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');

      // Remove noisy elements
      const noisyElements = doc.querySelectorAll('script, style, noscript, svg, iframe');
      noisyElements.forEach(n => n.remove());

      imgCount = doc.querySelectorAll('img').length;
      textContent = doc.body?.textContent || "";
    }

    // Process the text
    textContent = textContent.replace(/\s+/g, ' ').trim();

    // Image-heavy email heuristic
    if (textContent.length < 150 && imgCount > 0) {
        let snippet = `[HEURISTIC SUMMARY]\n- VISUAL PAYLOAD: Email is primarily composed of embedded graphic assets (${imgCount} image layers detected).\n- TEXTUAL: Minimal raw text.`;
        if (textContent.length > 5) {
            snippet += `\n- EXTRACTED: "${textContent}"`;
        }
        return snippet;
    }

    if (textContent.length > 800) {
        textContent = textContent.substring(0, 800) + '...';
    }

    return textContent || "ANALYSIS NOTICE: Blank HTML payload.";
  }

  // Fallback for Pure Plain Text
  const result = text.replace(/https?:\/\/[^\s"'<>()]+/gi, '[URL_REMOVED]');
  return result.substring(0, 800) || "ANALYSIS NOTICE: No textual content extracted.";
};

export const parsePayload = (headers: string, body: string, whitelists: WhitelistEntry[]) => {
  const triggers: string[] = [];
  let score = 0;

  const parsed_headers = extractKeyHeaders(headers);
  const fromRaw = parsed_headers.from;
  const returnPathRaw = parsed_headers.returnPath;
  const subject = parsed_headers.subject;
  const spfStatus = parsed_headers.spf.toUpperCase();
  const dkimStatus = parsed_headers.dkim.toUpperCase();
  const dmarcStatus = parsed_headers.dmarc.toUpperCase();

  if (spfStatus === 'FAIL' || spfStatus === 'SOFTFAIL') { triggers.push('SPF_FAIL'); score += 2; }
  if (dmarcStatus === 'FAIL') { triggers.push('DMARC_FAIL'); score += 3; }
  if (dkimStatus === 'FAIL') { triggers.push('DKIM_FAIL'); score += 1; }

  const ipMatch = headers.match(/Received: from .*?\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]/i);
  const senderIp = ipMatch ? ipMatch[1] : 'Unknown IP';

  let senderDomain = 'unknown';
  const emailRgx = /[\w.-]+@([\w.-]+\.[a-zA-Z]{2,})/;
  const fromDomainMatch = fromRaw.match(emailRgx);
  if (fromDomainMatch) senderDomain = fromDomainMatch[1].toLowerCase();

  const rpMatch = returnPathRaw.match(emailRgx);
  const rpDomain = rpMatch ? rpMatch[1].toLowerCase() : '';
  
  const getBaseDomain = (domain: string) => {
    const parts = domain.split('.');
    if (parts.length >= 2) return parts.slice(-2, -1)[0];
    return domain;
  };

  const isDomainMismatch = () => {
    if (!rpDomain || senderDomain === 'unknown') return false;
    if (rpDomain === senderDomain) return false;
    
    // Check for organizational domain matches (e.g. mkt.brand.com vs brand.com)
    const senderBase = getBaseDomain(senderDomain);
    const rpBase = getBaseDomain(rpDomain);
    
    if (senderBase === rpBase) return false;
    
    // Allow common marketing/service domain patterns
    if (rpDomain.includes(senderBase) || senderDomain.includes(rpBase)) return false;

    if (rpDomain.endsWith('.' + senderDomain) || senderDomain.endsWith('.' + rpDomain)) return false;
    return true;
  };

  if (isDomainMismatch()) {
    triggers.push('IDENTITY_MISMATCH (BEC_INDICATOR)');
    score += 3;
  }

  rules.brands.forEach(brand => {
    if (senderDomain.includes(brand) && !senderDomain.endsWith(`.${brand}.com`) && !senderDomain.endsWith(`${brand}.com`)) {
        if (!senderDomain.includes('email.' + brand) && !senderDomain.includes('mail.' + brand)) {
            triggers.push(`TYPOSQUATTING_LIKELY (${brand})`);
            score += 4;
        }
    }
  });

  const urlPattern = /https?:\/\/[^\s"'<>()]+/gi;
  const bodyUrls = body.match(urlPattern) || [];
  const headerUrls = headers.match(urlPattern) || [];
  const urls = Array.from(new Set([...bodyUrls, ...headerUrls]));
  
  urls.forEach(u => {
    if (u.includes('bit.ly') || u.includes('t.co') || u.includes('tinyurl.com') || u.includes('shorturl.at')) {
        triggers.push('URL_SHORTENER_DETECTED');
        score += 1.5; // Lowered from 2
    }
    if (/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(u)) {
        triggers.push('IP_ADDRESS_IN_URL');
        score += 4;
    }
  });

  if (body.includes('height="1"') || body.includes('width="1"') || body.includes('opacity:0')) {
    triggers.push('TRACKING_PIXEL_INDICATOR');
    score += 0.5; // Lowered from 1
  }

  const obfuscatedPayloads: string[] = [];
  const textToScanAll = (headers + '\n' + body);
  const b64Matches = textToScanAll.match(/(?:[A-Za-z0-9+/]{4}){10,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g);
  
  if (b64Matches) {
      b64Matches.forEach(b64 => {
          try {
              const binString = atob(b64);
              const bytes = new Uint8Array(binString.length);
              for (let i = 0; i < binString.length; i++) bytes[i] = binString.charCodeAt(i);
              
              const asciiDecoded = new TextDecoder('ascii').decode(bytes).toLowerCase();
              const utf16Decoded = new TextDecoder('utf-16le').decode(bytes).toLowerCase();
              
              const isMaliciousPayload = (dec: string) => new RegExp(rules.malwareRegex, 'i').test(dec);
              
              if (isMaliciousPayload(asciiDecoded) || isMaliciousPayload(utf16Decoded)) {
                  const payload = isMaliciousPayload(utf16Decoded) ? utf16Decoded : asciiDecoded;
                  obfuscatedPayloads.push(payload.substring(0, 500));
                  
                  if (!triggers.includes('OBFUSCATED_MALICIOUS_PAYLOAD')) {
                      triggers.push('OBFUSCATED_MALICIOUS_PAYLOAD');
                      score += 6; 
                  }
              }
          } catch (e) {}
      });
  }

  const textToScan = (subject + ' ' + body).toLowerCase();
  let urgencyDetected = false;
  rules.urgencyKeywords.forEach(k => {
    if (textToScan.includes(k)) {
        triggers.push(`SOCIAL_ENG_KEYWORD (${k.toUpperCase()})`);
        score += 1.5; // Higher weight but more specific keywords
        urgencyDetected = true;
    }
  });

  let category = "Legitimate";
  let subcategory = "General Communication";

  const isMalicious = score >= 6 || triggers.some(t => t.includes('MALICIOUS'));
  const isSuspicious = score >= 3;

  // --- Advanced Categorization Logic ---
  const hasExecutiveTriggers = rules.executiveKeywords.some(k => textToScan.includes(k));
  const hasFinancialTriggers = rules.financialInvoicing.some(k => textToScan.includes(k)) || rules.scamFinancial.some(k => textToScan.includes(k));
  const hasMarketingTriggers = rules.marketingKeywords.some(k => textToScan.includes(k));
  const hasTransactionalTriggers = rules.transactionalKeywords.some(k => textToScan.includes(k));
  const hasAccountTakeoverKeywords = rules.accountTakeover.some(k => textToScan.includes(k));

  if (isMalicious) {
      category = "Malicious";
      if (obfuscatedPayloads.length > 0 || rules.malwareExtensions.some(ext => body.toLowerCase().includes(ext))) {
          subcategory = "Malware & Ransomware Delivery";
      } else if (triggers.includes('IDENTITY_MISMATCH (BEC_INDICATOR)') && hasFinancialTriggers) {
          subcategory = "Scam - BEC (Business Email Compromise)";
      } else if (triggers.some(t => t.includes('TYPOSQUATTING'))) {
          subcategory = "Phishing - Brand Impersonation (Deceptive)";
      } else if (hasExecutiveTriggers) {
          subcategory = "Phishing - Whaling (Executive Targeting)";
      } else if (rules.scamSextortion.some(k => textToScan.includes(k))) {
          subcategory = "Scam - Sextortion";
      } else {
          subcategory = "Phishing - Traditional / Mass Mail";
      }
  } else if (isSuspicious) {
      // Branding adjustment: If it's a known brand domain and authentication passed, lower suspicion
      const isKnownBrandDomain = rules.brands.some(b => senderDomain.includes(b));
      const authPassed = spfStatus === 'PASS' && dkimStatus === 'PASS';
      
      if (isKnownBrandDomain && authPassed && !hasAccountTakeoverKeywords && score < 5) {
          category = "Legitimate";
          if (hasMarketingTriggers) subcategory = "Marketing / Promotional";
          else if (hasTransactionalTriggers) subcategory = "Transactional / Service Alert";
          else subcategory = "General Communication";
      } else {
          category = "Suspicious";
          if (hasExecutiveTriggers && triggers.includes('IDENTITY_MISMATCH (BEC_INDICATOR)')) {
              subcategory = "Phishing - Spear Phishing (Targeted)";
          } else if (hasFinancialTriggers) {
              subcategory = "Scam - Financial (Invoicing)";
          } else if (hasAccountTakeoverKeywords && (urgencyDetected || score >= 5)) {
              subcategory = "Phishing - Account Takeover";
          } else if (score >= 4) {
              subcategory = "High Risk Traffic";
          } else {
              subcategory = "Suspicious Heuristics";
          }
      }
  } else {
      category = "Legitimate";
      if (hasTransactionalTriggers) subcategory = "Transactional / Service Alert";
      else if (hasMarketingTriggers) subcategory = "Marketing / Promotional";
      else if (score >= 1) subcategory = "Commercial / Bulk Content";
      else subcategory = "General Communication";
  }

  // --- Final Override for Whitelists ---
  if (whitelists.some(w => w.domain.toLowerCase() === senderDomain)) {
      category = "Legitimate";
      subcategory = "Verified Transactional / Whitelisted";
  }

  let verdict: Verdict = 'SAFE';
  if (category === 'Legitimate') verdict = 'SAFE';
  else if (category === 'Malicious') verdict = 'MALICIOUS';
  else if (category === 'Suspicious') verdict = 'SUSPICIOUS';
  else verdict = 'SAFE';

  return { 
    id: `PH-${Math.floor(Math.random() * 9000) + 1000}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    sender: fromRaw,
    subject: subject,
    score, 
    extra: {
      senderIp, 
      fromRaw, 
      returnPathRaw, 
      spfStatus, 
      dkimStatus, 
      dmarcStatus, 
      urls, 
      verdict, 
      triggers,
      category,
      subcategory,
      subject,
      headerPreview: parsed_headers.raw,
      cleanBody: extractBodyText(body),
      obfuscatedPayloads,
      authStatus: {
          spf: spfStatus,
          dkim: dkimStatus,
          dmarc: dmarcStatus
      }
    },
    verdict,
    category,
    subcategory,
    triggers
  };
};
