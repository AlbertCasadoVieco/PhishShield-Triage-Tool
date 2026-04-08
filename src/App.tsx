import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  History, 
  Verified, 
  Search, 
  Bell, 
  Settings, 
  ChevronRight, 
  Filter, 
  Download, 
  Eye, 
  Trash2,
  Plus,
  Bolt,
  FileText,
  HelpCircle,
  AlertCircle,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnalysisRecord, WhitelistEntry, Verdict } from './types';
import { MOCK_HISTORY, MOCK_WHITELIST } from './constants';

const parsePayload = (headers: string, body: string, whitelists: WhitelistEntry[]) => {
  const triggers: string[] = [];
  let score = 0;

  const extractHeader = (rgx: RegExp) => {
    const match = headers.match(rgx);
    return match ? match[1].trim() : 'Unknown';
  };

  const fromRaw = extractHeader(/^From:\s*(.*)$/im);
  const returnPathRaw = extractHeader(/^Return-Path:\s*<?([^>\n]+)>?/im);
  const subject = extractHeader(/^Subject:\s*(.*)$/im);
  
  const authResults = extractHeader(/^Authentication-Results:\s*(.*?)(?=\n\S|$)/is);
  const spfMatch = authResults.match(/spf=(\w+)/i) || headers.match(/spf=(\w+)/i);
  const dkimMatch = authResults.match(/dkim=(\w+)/i) || headers.match(/dkim=(\w+)/i);
  const dmarcMatch = authResults.match(/dmarc=(\w+)/i) || headers.match(/dmarc=(\w+)/i);

  const spfStatus = spfMatch ? spfMatch[1].toUpperCase() : 'NONE';
  const dkimStatus = dkimMatch ? dkimMatch[1].toUpperCase() : 'NONE';
  const dmarcStatus = dmarcMatch ? dmarcMatch[1].toUpperCase() : 'NONE';

  if (spfStatus === 'FAIL' || spfStatus === 'SOFTFAIL') { triggers.push('SPF_FAIL'); score += 2; }
  if (dmarcStatus === 'FAIL') { triggers.push('DMARC_FAIL'); score += 3; }
  if (dkimStatus === 'FAIL') { triggers.push('DKIM_FAIL'); score += 1; }

  const ipMatch = headers.match(/Received: from .*?\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]/i);
  const senderIp = ipMatch ? ipMatch[1] : 'Unknown IP';

  let senderDomain = 'unknown';
  const emailRgx = /[\w.-]+@([\w.-]+\.[a-zA-Z]{2,})/;
  const fromDomainMatch = fromRaw.match(emailRgx);
  if (fromDomainMatch) senderDomain = fromDomainMatch[1].toLowerCase();

  // BEC Detection: Check if From domain mismatches Return-Path domain
  const rpMatch = returnPathRaw.match(emailRgx);
  const rpDomain = rpMatch ? rpMatch[1].toLowerCase() : '';
  if (rpDomain && senderDomain !== 'unknown' && rpDomain !== senderDomain) {
    triggers.push('IDENTITY_MISMATCH (BEC_INDICATOR)');
    score += 3;
  }

  // Typosquatting Analysis (from notes)
  const knownBrands = ['amazon', 'microsoft', 'outlook', 'dhl', 'paypal', 'apple', 'netflix', 'google', 'bank', 'secure'];
  knownBrands.forEach(brand => {
    if (senderDomain.includes(brand) && !senderDomain.endsWith(`.${brand}.com`) && !senderDomain.endsWith(`${brand}.com`)) {
        if (!senderDomain.includes('email.' + brand) && !senderDomain.includes('mail.' + brand)) {
            triggers.push(`TYPOSQUATTING_LIKELY (${brand})`);
            score += 4;
        }
    }
  });

  // URL Extraction & Analysis
  const urlPattern = /https?:\/\/[^\s"'<>()]+/gi;
  const bodyUrls = body.match(urlPattern) || [];
  const headerUrls = headers.match(urlPattern) || [];
  const urls = Array.from(new Set([...bodyUrls, ...headerUrls]));
  
  urls.forEach(u => {
    if (u.includes('bit.ly') || u.includes('t.co') || u.includes('tinyurl.com') || u.includes('shorturl.at')) {
        triggers.push('URL_SHORTENER_DETECTED');
        score += 2;
    }
    if (/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(u)) {
        triggers.push('IP_ADDRESS_IN_URL');
        score += 4;
    }
  });

  // Tracking Pixels
  if (body.includes('height="1"') || body.includes('width="1"') || body.includes('opacity:0')) {
    triggers.push('TRACKING_PIXEL_INDICATOR');
    score += 1;
  }

  // Urgency & Social Engineering (from notes)
  const urgencyKeywords = ['urgent', 'important', 'action required', 'account suspended', 'locked', 'locked out', 'failed delivery', 'failed payment', 'verify', 'invoice', 'payroll'];
  const textToScan = (subject + ' ' + body).toLowerCase();
  urgencyKeywords.forEach(k => {
    if (textToScan.includes(k)) {
        triggers.push(`SOCIAL_ENG_KEYWORD (${k.toUpperCase()})`);
        score += 1;
    }
  });

  let verdict: Verdict = 'SAFE';
  const isWhitelisted = whitelists.some(w => w.domain.toLowerCase() === senderDomain);
  
  if (isWhitelisted) {
      verdict = 'SAFE';
  } else {
      if (score >= 5) verdict = 'MALICIOUS';
      else if (score >= 2) verdict = 'SUSPICIOUS';
      else if (score === 0 && dmarcStatus === 'PASS') verdict = 'SAFE';
      else verdict = 'SUSPICIOUS';
  }

  return { senderIp, fromRaw, returnPathRaw, spfStatus, dkimStatus, dmarcStatus, urls, verdict, triggers };
};

// --- Components ---

const Sidebar = ({ currentView, setView }: { currentView: string, setView: (v: string) => void }) => {
  const navItems = [
    { id: 'analyzer', label: 'Analyzer', icon: Shield },
    { id: 'history', label: 'History', icon: History },
    { id: 'whitelists', label: 'Whitelists', icon: Verified },
  ];

  return (
    <aside className="hidden md:flex bg-surface-low h-screen w-64 border-r border-outline-variant/15 flex-col py-4 sticky top-0 shrink-0">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <Shield className="text-primary fill-primary/20" size={24} />
          <div>
            <div className="text-primary font-black font-display text-sm tracking-wider">PHISH_OPS</div>
            <div className="text-[10px] text-slate-500 font-mono">V3.14-ALPHA</div>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center px-6 py-3 font-display text-xs font-bold uppercase tracking-widest transition-all duration-200 ease-in-out group border-l-4 ${
              currentView === item.id 
                ? 'bg-surface-high text-primary border-primary' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-surface-high/50 border-transparent'
            }`}
          >
            <item.icon className={`mr-3 ${currentView === item.id ? 'text-primary' : 'group-hover:text-primary'}`} size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-6 py-4">
        <button 
          onClick={() => setView('analyzer')}
          className="w-full bg-primary text-on-primary py-2.5 rounded-sm text-[10px] font-bold tracking-widest uppercase hover:shadow-[0_0_15px_rgba(74,225,118,0.2)] transition-all active:scale-95"
        >
          NEW ANALYSIS
        </button>
      </div>

      <div className="mt-auto border-t border-outline-variant/15 pt-4">
        <button className="w-full flex items-center px-6 py-2.5 font-display text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors group">
          <FileText className="mr-3" size={14} />
          Documentation
        </button>
        <button className="w-full flex items-center px-6 py-2.5 font-display text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors group">
          <HelpCircle className="mr-3" size={14} />
          Support
        </button>
      </div>
    </aside>
  );
};

const TopBar = () => (
  <header className="bg-surface text-primary font-display tracking-tight w-full border-b border-outline-variant/15 flex justify-between items-center px-6 h-16 z-50 sticky top-0">
    <div className="flex items-center gap-4">
      <span className="text-xl font-bold tracking-widest uppercase">SENTINEL PHISH</span>
    </div>
    <div className="flex items-center gap-6">
      <div className="hidden md:flex items-center bg-surface-low rounded-lg px-3 py-1.5 border border-outline-variant/30">
        <Search className="text-slate-400 mr-2" size={14} />
        <input 
          className="bg-transparent border-none focus:ring-0 text-[10px] font-mono uppercase text-slate-200 placeholder-slate-500 w-48" 
          placeholder="QUERY LOGS..." 
          type="text"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="text-slate-400 hover:bg-surface-high transition-colors duration-200 p-2 rounded-md">
          <Bell size={20} />
        </button>
        <button className="text-slate-400 hover:bg-surface-high transition-colors duration-200 p-2 rounded-md">
          <Settings size={20} />
        </button>
        <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-highest border border-primary/30">
          <img 
            alt="Analyst profile avatar" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaF63FBIqHIlnUmScKluHbyqPw_h2lTp238wuZkdQQw8fVjZebrvu74LElwbCkFOfcJRpq4ixmREy3O0D_oo6lPj-840-Fw8bNCGCTIV3yv2LNdiFJ0gZP1dIINE8PP0imVgW1dHGqgqqMLEZXMV1nJ7F7UVN_0AA5MO4MbeCi-JUKY3OyRcuTui4CglcWqVvnC7IhA35gqPN2s4s9mvHVEvIQEsIuv3XHWdrrJT7ctb6ZnxsO7ARs_hJWMm40SlinvmivG29yCUY"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  </header>
);

const Footer = () => (
  <footer className="bg-surface text-primary font-mono text-[10px] uppercase w-full border-t border-outline-variant/15 fixed bottom-0 left-0 flex justify-between items-center px-6 py-2 z-50">
    <div className="flex items-center gap-4">
      <span>SENTINEL_OS v3.1.4 | SYSTEM_STATUS: NOMINAL</span>
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
      <span className="text-slate-500">BTL1 Framework Integrated V1.0</span>
    </div>
    <div className="flex items-center gap-6">
      <a className="text-slate-500 hover:text-primary transition-opacity duration-300 underline" href="#">Privacy Protocol</a>
      <a className="text-slate-500 hover:text-primary transition-opacity duration-300 underline" href="#">Clearance Levels</a>
    </div>
  </footer>
);

// --- Views ---

const AnalyzerView = () => {
  const [headers, setHeaders] = useState('');
  const [body, setBody] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisRecord & { extra: any } | null>(null);

  const handleAnalyze = () => {
    if (!headers || !body) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const whitelists = JSON.parse(localStorage.getItem('phishOpsWhitelists') || '[]');
      const parsed = parsePayload(headers, body, whitelists);
      
      setResult({
        id: `SH-${Math.floor(Math.random() * 9000) + 1000}`,
        timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
        sender: parsed.fromRaw.slice(0, 50),
        subject: parsed.returnPathRaw.slice(0, 50),
        verdict: parsed.verdict as Verdict,
        headers,
        body,
        extra: parsed
      });
      setIsAnalyzing(false);
    }, 800);
  };

  const handleSave = () => {
    if (!result) return;
    const currentList = JSON.parse(localStorage.getItem('phishOpsHistory') || '[]');
    localStorage.setItem('phishOpsHistory', JSON.stringify([result, ...currentList]));
    alert('ANALYSIS LOGGED TO HISTORY FILES.');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      <div className="mb-6">
        <div className="flex items-center gap-2 tactical-label mb-2">
          <span>SYSTEM</span>
          <ChevronRight size={12} />
          <span className="text-primary">LIVE_TRIAGE</span>
        </div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-100">Threat Analysis Canvas</h1>
        <p className="text-sm text-slate-400 max-w-2xl mt-1">SOC Level-1 Investigative Workspace. Input raw telemetry for heuristic evaluation.</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="bg-surface-low p-5 border border-outline-variant/15 rounded-sm">
            <label className="tactical-label text-primary mb-3 block">Email Headers</label>
            <textarea 
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              className="w-full h-48 bg-surface-highest/30 border-outline-variant/30 focus:border-primary focus:ring-0 p-4 font-mono text-xs text-primary/80 resize-none rounded-sm"
              placeholder="Paste RAW RFC 5322 headers here..."
            />
          </div>
          <div className="bg-surface-low p-5 border border-outline-variant/15 rounded-sm">
            <label className="tactical-label text-primary mb-3 block">Email Body</label>
            <textarea 
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-56 bg-surface-highest/30 border-outline-variant/30 focus:border-primary focus:ring-0 p-4 font-mono text-xs text-slate-300 resize-none rounded-sm"
              placeholder="Paste email message content here..."
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !headers || !body}
              className="flex-1 py-4 bg-primary text-on-primary font-bold uppercase tracking-widest text-sm hover:brightness-110 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? <Bolt className="animate-spin" size={18} /> : <Shield size={18} />}
              {isAnalyzing ? 'ANALYZING...' : 'RUN ANALYSIS'}
            </button>
            <button className="px-6 py-4 bg-surface-high text-slate-300 font-bold uppercase tracking-widest text-sm hover:bg-surface-highest transition-all border border-outline-variant/30" onClick={handleSave}>
              SAVE
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-low p-6 border border-outline-variant/15 relative overflow-hidden">
                    <label className="tactical-label">Analysis Verdict</label>
                    <div className="mt-4">
                      <span className={`text-4xl font-black tracking-tighter uppercase ${
                        result.verdict === 'MALICIOUS' ? 'text-secondary' : 
                        result.verdict === 'SAFE' ? 'text-primary' : 'text-tertiary'
                      }`}>
                        {result.verdict}
                      </span>
                      <div className="mt-2 h-1.5 w-full bg-surface-highest rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: result.verdict === 'MALICIOUS' ? '95%' : result.verdict === 'SAFE' ? '10%' : '65%' }}
                          className={`h-full ${
                            result.verdict === 'MALICIOUS' ? 'bg-secondary' : 
                            result.verdict === 'SAFE' ? 'bg-primary' : 'bg-tertiary'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface-low p-6 border border-outline-variant/15 space-y-3 font-mono">
                    <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                      <span className="text-[10px] text-slate-500">SENDER IP</span>
                      <span className="text-xs text-slate-200">{result.extra.senderIp}</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                      <span className="text-[10px] text-slate-500">RETURN-PATH</span>
                      <span className="text-xs text-slate-200 truncate max-w-[150px]">{result.extra.returnPathRaw}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-500">FROM</span>
                      <span className="text-xs text-slate-200 truncate max-w-[150px]">{result.extra.fromRaw}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-low p-6 border border-outline-variant/15">
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`bg-surface-highest/20 p-3 rounded-sm border-t-2 ${result.extra.spfStatus === 'PASS' ? 'border-primary' : 'border-secondary'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-500">SPF</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${result.extra.spfStatus === 'PASS' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>{result.extra.spfStatus}</span>
                      </div>
                    </div>
                    <div className={`bg-surface-highest/20 p-3 rounded-sm border-t-2 ${result.extra.dkimStatus === 'PASS' ? 'border-primary' : 'border-secondary'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-500">DKIM</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${result.extra.dkimStatus === 'PASS' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>{result.extra.dkimStatus}</span>
                      </div>
                    </div>
                    <div className={`bg-surface-highest/20 p-3 rounded-sm border-t-2 ${result.extra.dmarcStatus === 'PASS' ? 'border-primary' : 'border-secondary'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-500">DMARC</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${result.extra.dmarcStatus === 'PASS' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>{result.extra.dmarcStatus}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-low p-6 border border-outline-variant/15">
                  <label className="tactical-label block mb-4">Heuristic Triggers</label>
                  <div className="flex flex-wrap gap-2">
                    {result.extra.triggers && result.extra.triggers.length > 0 ? result.extra.triggers.map((t: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-sm text-[10px] font-bold font-mono uppercase">
                        {t}
                      </span>
                    )) : (
                      <span className="text-[10px] font-mono text-slate-500">NO ADVERSE TRIGGERS DETECTED</span>
                    )}
                  </div>
                </div>

                <div className="bg-surface-low p-6 border border-outline-variant/15">
                  <label className="tactical-label block mb-4">Extracted URLs</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {result.extra.urls && result.extra.urls.length > 0 ? result.extra.urls.map((u: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-surface-highest/20 p-2 border border-outline-variant/10 rounded-sm group">
                        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[80%]">{u}</span>
                        <button className="text-slate-600 hover:text-primary transition-colors" onClick={() => navigator.clipboard.writeText(u)}>
                          <Copy size={14} />
                        </button>
                      </div>
                    )) : (
                      <span className="text-[10px] font-mono text-slate-500">NO URLS DETECTED</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-surface-low/30 border-2 border-dashed border-outline-variant/10 rounded-lg p-12 text-slate-600">
                <AlertCircle className="mb-4 opacity-20" size={64} />
                <p className="font-mono text-sm uppercase tracking-widest opacity-40">Awaiting analysis execution...</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const HistoryView = () => {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('phishOpsHistory') || JSON.stringify(MOCK_HISTORY));
    setHistory(list);
  }, []);

  const handleDelete = (index: number) => {
    const newList = [...history];
    newList.splice(index, 1);
    setHistory(newList);
    localStorage.setItem('phishOpsHistory', JSON.stringify(newList));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      <div className="mb-6">
        <div className="flex items-center gap-2 tactical-label mb-2">
          <span>SYSTEM</span>
          <ChevronRight size={12} />
          <span className="text-primary">ARCHIVE_LOGS</span>
        </div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-100">Analysis History</h1>
        <p className="text-sm text-slate-400 max-w-2xl mt-1">Review previously scanned telemetry and audit trails. All records are indexed for BTL1 compliance.</p>
      </div>

      <div className="grid grid-cols-12 gap-4 mb-8">
        <div className="col-span-12 lg:col-span-8 bg-surface-low p-5 rounded-lg border border-outline-variant/10 flex items-center justify-between">
          <div>
            <div className="tactical-label mb-1">TOTAL_SAMPLES_RETAINED</div>
            <div className="text-3xl font-mono font-medium text-primary">{history.length}</div>
          </div>
          <div className="h-10 w-[1px] bg-outline-variant/20"></div>
          <div>
            <div className="tactical-label mb-1">MALICIOUS_DETECTED</div>
            <div className="text-3xl font-mono font-medium text-secondary">{history.filter(h => h.verdict === 'MALICIOUS').length}</div>
          </div>
          <div className="h-10 w-[1px] bg-outline-variant/20"></div>
          <div>
            <div className="tactical-label mb-1">STORAGE_CAPACITY</div>
            <div className="text-3xl font-mono font-medium text-tertiary">99%</div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4 bg-primary/5 p-5 rounded-lg border border-primary/20 flex flex-col justify-center">
          <div className="tactical-label text-primary mb-1">BTL1_INTEGRATION_STATUS</div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-sm font-mono text-slate-100 font-bold">V1.0_OPERATIONAL</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-low rounded-lg border border-outline-variant/10 overflow-hidden shadow-2xl shadow-black/40">
        <div className="px-6 py-4 flex items-center justify-between border-b border-outline-variant/10">
          <div className="flex items-center gap-4">
            <button className="tactical-label px-3 py-1.5 bg-surface-high text-slate-200 border border-outline-variant/30 rounded flex items-center gap-2 hover:bg-surface-highest transition-colors">
              <Filter size={14} /> Filter
            </button>
            <button className="tactical-label px-3 py-1.5 bg-surface-high text-slate-200 border border-outline-variant/30 rounded flex items-center gap-2 hover:bg-surface-highest transition-colors">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="text-[10px] font-mono text-slate-500">DISPLAYING: 001 - 005 OF 1,402</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-highest/10 border-b border-outline-variant/10">
                <th className="px-6 py-4 tactical-label">ID_REF</th>
                <th className="px-6 py-4 tactical-label">DATE_TIME_UTC</th>
                <th className="px-6 py-4 tactical-label">SENDER_VECTOR</th>
                <th className="px-6 py-4 tactical-label">SUBJECT_PAYLOAD</th>
                <th className="px-6 py-4 tactical-label text-center">VERDICT</th>
                <th className="px-6 py-4 tactical-label text-right">OPERATIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {history.map((item, idx) => (
                <tr key={`${item.id}-${idx}`} className="hover:bg-surface-high transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-primary">{item.id}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">{item.timestamp}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-200 truncate max-w-[150px] block">{item.sender}</td>
                  <td className="px-6 py-4 text-sm text-slate-400 italic truncate max-w-[150px]">{item.subject}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-display uppercase tracking-tight border ${
                      item.verdict === 'MALICIOUS' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                      item.verdict === 'SAFE' ? 'bg-primary/10 text-primary border-primary/20' :
                      'bg-tertiary/10 text-tertiary border-tertiary/20'
                    }`}>
                      {item.verdict}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded hover:bg-secondary/20 text-secondary transition-colors" onClick={() => handleDelete(idx)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

const WhitelistsView = () => {
  const [domain, setDomain] = useState('');
  const [list, setList] = useState<WhitelistEntry[]>([]);

  useEffect(() => {
    const s = JSON.parse(localStorage.getItem('phishOpsWhitelists') || JSON.stringify(MOCK_WHITELIST));
    setList(s);
  }, []);

  const handleAdd = () => {
    if (!domain) return;
    const added = [{
      domain,
      description: 'User Defined Trusted Domain',
      addedAt: new Date().toISOString().split('T')[0]
    }, ...list];
    setList(added);
    localStorage.setItem('phishOpsWhitelists', JSON.stringify(added));
    setDomain('');
  };

  const handleRemove = (idx: number) => {
    const newList = [...list];
    newList.splice(idx, 1);
    setList(newList);
    localStorage.setItem('phishOpsWhitelists', JSON.stringify(newList));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-10"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-100 font-display tracking-tight">DOMAIN_WHITELIST</h2>
        <p className="text-slate-400 text-sm mt-2">Manage trusted domains to bypass automated heuristic filtering and prevent false positives.</p>
      </div>

      <div className="bg-surface-low p-6 rounded-lg border-l-2 border-primary">
        <h3 className="tactical-label text-primary mb-4">Add Trusted Domain</h3>
        <div className="flex gap-4">
          <div className="relative flex-grow">
            <input 
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-surface-highest/30 border-none text-slate-200 font-mono text-sm px-4 py-3 focus:ring-1 focus:ring-primary transition-all rounded-sm placeholder:text-slate-600" 
              placeholder="e.g., inetum.com" 
              type="text"
            />
            <div className="absolute left-0 top-0 w-[2px] h-full bg-primary opacity-50"></div>
          </div>
          <button 
            onClick={handleAdd}
            className="bg-primary text-on-primary font-display font-bold text-xs tracking-widest px-6 py-3 rounded-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            AUTHORIZE
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="tactical-label">Currently Whitelisted Clusters</h3>
          <span className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded">{list.length} DOMAINS ACTIVE</span>
        </div>

        {list.map((item, idx) => (
          <div key={item.domain + idx} className="group bg-surface-low transition-colors duration-200 hover:bg-surface-high p-4 flex justify-between items-center rounded-sm border border-outline-variant/5">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center bg-surface-highest/20 text-primary rounded-sm border border-outline-variant/15">
                <Verified size={16} />
              </div>
              <div>
                <p className="font-mono text-slate-200 text-sm">{item.domain}</p>
                <p className="text-[10px] text-slate-500 font-display uppercase tracking-tighter mt-0.5">{item.description}</p>
              </div>
            </div>
            <button className="text-slate-500 hover:text-secondary transition-colors p-2 flex items-center gap-2 group/btn" onClick={() => handleRemove(idx)}>
              <span className="text-[10px] font-mono opacity-0 group-hover/btn:opacity-100 transition-opacity">REMOVE_ACCESS</span>
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        <div className="border-2 border-dashed border-outline-variant/10 rounded-lg py-8 flex flex-col items-center justify-center opacity-30">
          <AlertCircle className="mb-2 text-slate-600" size={32} />
          <p className="font-mono text-[10px] text-slate-600 uppercase">Awaiting additional telemetry...</p>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState('analyzer');

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentView={view} setView={setView} />
        <main className="flex-1 bg-surface overflow-y-auto p-6 pb-20 relative">
          <AnimatePresence mode="wait">
            {view === 'analyzer' && <AnalyzerView key="analyzer" />}
            {view === 'history' && <HistoryView key="history" />}
            {view === 'whitelists' && <WhitelistsView key="whitelists" />}
          </AnimatePresence>
        </main>
      </div>
      <Footer />
    </div>
  );
}
