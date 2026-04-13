import React, { useState, useEffect, createContext, useContext } from 'react';
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
  Copy,
  Volume2,
  VolumeX,
  X,
  AlertTriangle,
  CheckCircle,
  Terminal,
  Code,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnalysisRecord, WhitelistEntry, Verdict } from './types';
import { MOCK_HISTORY, MOCK_WHITELIST } from './constants';
import PostalMime from 'postal-mime';

import { parsePayload } from './engine/heuristic';
import { getHistory, saveHistoryRecord, deleteHistoryRecord, getWhitelists, saveWhitelistEntry, removeWhitelistEntry } from './store/db';

// --- Notification Context ---
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error';
  timestamp: number;
}

export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (title: string, message: string, type: 'success' | 'warning' | 'error') => void;
  removeNotification: (id: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};

// --- Components ---

const Sidebar = ({ currentView, setView }: { currentView: string, setView: (v: string) => void }) => {
  const navItems = [
    { id: 'analyzer', label: 'Analyzer', icon: Shield },
    { id: 'toolkit', label: 'Decoder Engine', icon: Terminal },
    { id: 'history', label: 'History', icon: History },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'whitelists', label: 'Whitelists', icon: Verified },
  ];

  return (
    <aside className="hidden md:flex bg-surface-low h-screen w-64 border-r border-outline-variant/15 flex-col py-4 sticky top-0 shrink-0">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <Shield className="text-primary fill-primary/20" size={24} />
          <div>
            <div className="text-primary font-black font-display text-sm tracking-wider">PHISH_OPS</div>
            <div className="text-[10px] text-slate-500 font-mono">ALPHA VERSION</div>
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

const TopBar = () => {
  const { notifications, soundEnabled, setSoundEnabled } = useNotificationContext();
  const [showSoundMenu, setShowSoundMenu] = useState(false);

  return (
    <header className="bg-surface text-primary font-display tracking-tight w-full border-b border-outline-variant/15 flex justify-between items-center px-6 h-16 z-50 sticky top-0">
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold tracking-widest uppercase">SENTINEL PHISH</span>
      </div>
      <div className="flex items-center gap-4 relative">
        <button className="text-slate-400 hover:text-primary hover:bg-surface-high transition-colors duration-200 p-2 rounded-md relative">
          <Bell size={20} />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
          )}
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowSoundMenu(!showSoundMenu)}
            className="text-slate-400 hover:text-primary hover:bg-surface-high transition-colors duration-200 p-2 rounded-md flex items-center gap-1.5"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          
          {showSoundMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 mt-2 bg-surface-low border border-outline-variant/30 rounded-md shadow-xl overflow-hidden"
            >
              <button
                onClick={() => {
                  setSoundEnabled(true);
                  setShowSoundMenu(false);
                }}
                className={`w-full px-4 py-2.5 flex items-center gap-2 text-[10px] font-mono uppercase font-bold tracking-tight transition-colors ${
                  soundEnabled ? 'bg-surface-high text-primary' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Volume2 size={14} />
                SOUND ON
              </button>
              <button
                onClick={() => {
                  setSoundEnabled(false);
                  setShowSoundMenu(false);
                }}
                className={`w-full px-4 py-2.5 flex items-center gap-2 text-[10px] font-mono uppercase font-bold tracking-tight transition-colors border-t border-outline-variant/10 ${
                  !soundEnabled ? 'bg-surface-high text-primary' : 'text-slate-400 hover:text-slate-200 hover:bg-surface-high'
                }`}
              >
                <VolumeX size={14} />
                SOUND OFF
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
};

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

// --- Notification Center ---

const NotificationCenter = () => {
  const { notifications, removeNotification } = useNotificationContext();

  return (
    <div className="fixed top-20 right-6 space-y-3 pointer-events-none z-[999]">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`pointer-events-auto px-4 py-3 rounded-sm border-l-4 backdrop-blur-sm flex items-center justify-between gap-3 ${
              notif.type === 'success' 
                ? 'bg-primary/10 border-primary text-primary' 
                : notif.type === 'warning'
                ? 'bg-tertiary/10 border-tertiary text-tertiary'
                : 'bg-secondary/10 border-secondary text-secondary'
            }`}
          >
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold uppercase tracking-tight">{notif.title}</p>
              <p className="text-[9px] opacity-80">{notif.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notif.id)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- Views ---

const AnalysisResultDisplay = ({ result }: { result: AnalysisRecord & { extra: any } }) => {
  if (!result) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-low p-6 border border-outline-variant/15 relative overflow-hidden">
          <label className="tactical-label">Analysis Verdict</label>
          <div className="mt-4">
            <span className={`text-4xl font-black tracking-tighter uppercase ${
              result?.verdict === 'MALICIOUS' ? 'text-secondary' : 
              result?.verdict === 'SAFE' ? 'text-primary' : 'text-tertiary'
            }`}>
              {result?.verdict}
            </span>
            <div className="mt-2 text-[10px] font-mono font-bold tracking-widest text-slate-400">
               CATEGORY: <span className={
                 result?.extra?.category === 'Malicious' ? 'text-secondary' : 
                 result?.extra?.category === 'Suspicious' ? 'text-tertiary' : 'text-primary'
               }>{result?.extra?.category?.toUpperCase() || 'N/A'}</span>
               {result?.extra?.subcategory && (
                 <span className="ml-2 text-slate-500">({result.extra.subcategory.toUpperCase()})</span>
               )}
            </div>
            <div className="mt-4 h-1.5 w-full bg-surface-highest rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: result?.verdict === 'MALICIOUS' ? '95%' : result?.verdict === 'SAFE' ? '10%' : '65%' }}
                className={`h-full ${
                  result?.verdict === 'MALICIOUS' ? 'bg-secondary' : 
                  result?.verdict === 'SAFE' ? 'bg-primary' : 'bg-tertiary'
                }`}
              />
            </div>
          </div>
        </div>
        <div className="bg-surface-low p-6 border border-outline-variant/15 space-y-4 font-mono text-xs">
          <div className="border-l-2 border-primary/50 pl-4">
            <p className="text-[10px] text-slate-500 mb-1">SENDER IP</p>
            <p className="text-slate-200 break-all font-semibold">{result?.extra?.senderIp || 'N/A'}</p>
          </div>
          <div className="border-l-2 border-primary/50 pl-4">
            <p className="text-[10px] text-slate-500 mb-1">FROM</p>
            <p className="text-slate-200 break-all font-semibold">{result?.extra?.fromRaw || 'N/A'}</p>
          </div>
          <div className="border-l-2 border-primary/50 pl-4">
            <p className="text-[10px] text-slate-500 mb-1">RETURN-PATH</p>
            <p className="text-slate-200 break-all font-semibold">{result?.extra?.returnPathRaw || 'N/A'}</p>
          </div>
          <div className="border-l-2 border-tertiary/50 pl-4">
            <p className="text-[10px] text-slate-500 mb-1">SUBJECT</p>
            <p className="text-slate-200 break-all font-semibold">{result?.subject || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Opt: Obfuscated Payloads */}
      {result?.extra?.obfuscatedPayloads && result.extra.obfuscatedPayloads.length > 0 && (
        <div className="bg-secondary/10 border-2 border-secondary/50 p-6 rounded-sm">
          <label className="tactical-label block mb-4 text-secondary flex items-center gap-2">
            <AlertTriangle size={16} /> 
            AUTO-DEOBFUSCATOR: MALICIOUS PAYLOAD EXTRACTED
          </label>
          <div className="space-y-3">
             {result.extra.obfuscatedPayloads.map((payload: string, idx: number) => (
                <div key={idx} className="bg-black/40 border border-secondary/20 rounded-sm p-4 text-[10px] font-mono text-secondary max-h-48 overflow-y-auto whitespace-pre-wrap break-words">
                  {payload}
                </div>
             ))}
          </div>
        </div>
      )}

      {/* Header Summary Section */}
      <div className="bg-surface-low p-6 border border-outline-variant/15">
        <label className="tactical-label block mb-4">Email Header Summary</label>
        <div className="bg-surface-highest/30 border border-outline-variant/10 rounded-sm p-4 text-[10px] font-mono text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
          <span className="text-slate-500 block mb-1">SUBJECT:</span>
          <span className="text-primary font-bold text-sm block mb-4">{result?.subject || 'N/A'}</span>
          <span className="text-slate-500 block mb-1">SENDER ADDRESS:</span>
          <span className="text-slate-300">{result?.extra?.fromRaw || 'N/A'}</span>
        </div>
      </div>

      <div className="bg-surface-low p-6 border border-outline-variant/15">
        <label className="tactical-label block mb-4">Email Body Summary</label>
        <div className="bg-surface-highest/30 border border-outline-variant/10 rounded-sm p-4 text-[10px] font-mono text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap break-words">
          {result?.extra?.cleanBody || 'No body content extracted'}
        </div>
      </div>

      <div className="bg-surface-low p-6 border border-outline-variant/15">
        <div className="grid grid-cols-3 gap-3">
          <div className={`bg-surface-highest/20 p-3 rounded-sm border-t-2 ${result?.extra?.spfStatus === 'PASS' ? 'border-primary' : 'border-secondary'}`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-500">SPF</span>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${result?.extra?.spfStatus === 'PASS' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>{result?.extra?.spfStatus || 'N/A'}</span>
            </div>
          </div>
          <div className={`bg-surface-highest/20 p-3 rounded-sm border-t-2 ${result?.extra?.dkimStatus === 'PASS' ? 'border-primary' : 'border-secondary'}`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-500">DKIM</span>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${result?.extra?.dkimStatus === 'PASS' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>{result?.extra?.dkimStatus || 'N/A'}</span>
            </div>
          </div>
          <div className={`bg-surface-highest/20 p-3 rounded-sm border-t-2 ${result?.extra?.dmarcStatus === 'PASS' ? 'border-primary' : 'border-secondary'}`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-500">DMARC</span>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${result?.extra?.dmarcStatus === 'PASS' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>{result?.extra?.dmarcStatus || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-low p-6 border border-outline-variant/15">
        <label className="tactical-label block mb-4">Heuristic Triggers</label>
        <div className="flex flex-wrap gap-2">
          {result?.extra?.triggers && result.extra.triggers.length > 0 ? result.extra.triggers.map((t: string, idx: number) => (
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
          {result?.extra?.urls && result.extra.urls.length > 0 ? result.extra.urls.map((u: string, idx: number) => (
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
    </div>
  );
};

// --- Toolkit View ---
const ToolkitView = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [operation, setOperation] = useState('b64decode');
    const [xorKey, setXorKey] = useState('');
    const { addNotification } = useNotificationContext();

    const handleExecute = async () => {
        if (!input) return;
        try {
            let res = '';
            
            if (operation === 'b64decode') res = atob(input);
            else if (operation === 'b64encode') res = btoa(input);
            else if (operation === 'urldecode') res = decodeURIComponent(input);
            else if (operation === 'urlencode') res = encodeURIComponent(input);
            else if (operation === 'defang') res = input.replace(/https?:\/\//gi, 'hxxp://').replace(/\./g, '[.]');
            else if (operation === 'refang') res = input.replace(/hxxps?:\/\//gi, match => match.replace('x', 't').replace('x', 't')).replace(/\[\.\]/g, '.');
            else if (operation === 'extract_iocs') {
                const ipsMatch = input.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) || [];
                const urlsMatch = input.match(/https?:\/\/[^\s"'<>]+/gi) || [];
                res = `[EXTRACTED INDICATORS]\n\n--- IPv4 ADDRESSES ---\n${Array.from(new Set(ipsMatch)).join('\n')}\n\n--- URLs ---\n${Array.from(new Set(urlsMatch)).join('\n')}`;
            }
            else if (operation === 'xor') {
                if (!xorKey) throw new Error("XOR requires a key");
                let out = '';
                for (let i = 0; i < input.length; i++) {
                    out += String.fromCharCode(input.charCodeAt(i) ^ xorKey.charCodeAt(i % xorKey.length));
                }
                res = out;
            }
            else if (operation === 'rot13') {
                res = input.replace(/[A-Za-z]/g, c => {
                    const isUpper = c <= 'Z';
                    const charCode = c.charCodeAt(0);
                    const offset = isUpper ? 65 : 97;
                    return String.fromCharCode(((charCode - offset + 13) % 26) + offset);
                });
            }
            else if (operation === 'hex_to_raw') {
                const cleanHex = input.replace(/\s+/g, '');
                const bytes = cleanHex.match(/.{1,2}/g);
                if (bytes) res = bytes.map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
            }
            else if (operation === 'raw_to_hex') {
                res = input.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
            }
            else if (operation === 'decimal_to_string') {
                res = input.split(/[\s,]+/).filter(Boolean).map(n => String.fromCharCode(parseInt(n, 10))).join('');
            }
            else if (operation === 'bitwise_not') {
                let out = '';
                for (let i = 0; i < input.length; i++) {
                    out += String.fromCharCode(255 - input.charCodeAt(i)); // Invert byte for standard ASCII range
                }
                res = out;
            }
            else if (operation === 'reverse') {
                res = input.split('').reverse().join('');
            }
            else if (operation === 'ip_to_dec') {
                const octets = input.trim().split('.');
                if (octets.length !== 4) throw new Error("Invalid IP");
                res = (octets.reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0).toString();
            }
            else if (operation === 'dec_to_ip') {
                const d = parseInt(input.trim(), 10);
                res = [d >>> 24, (d >> 16) & 255, (d >> 8) & 255, d & 255].join('.');
            }
            else if (operation === 'gzip_decompress') {
                // Must convert Base64/Hex to Uint8Array first. Assume input is Base64 for malware payloads
                const binString = atob(input.replace(/\s+/g, ''));
                const bytes = new Uint8Array(binString.length);
                for (let i = 0; i < binString.length; i++) bytes[i] = binString.charCodeAt(i);
                
                // Use native browser DecompressionStream abstraction
                const ds = new DecompressionStream('gzip');
                const writer = ds.writable.getWriter();
                writer.write(bytes);
                writer.close();
                
                const buf = await new Response(ds.readable).arrayBuffer();
                res = new TextDecoder().decode(buf);
            }

            setOutput(res);
            addNotification('DECODER SUCCESS', 'Payload processed successfully', 'success');
        } catch (e) {
            setOutput(`ERROR: Payload decoding failed (${e instanceof Error ? e.message : 'Invalid sequence'}).`);
            addNotification('DECODER ERROR', 'Processing failed or invalid payload', 'error');
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto space-y-6"
        >
            <div className="mb-6">
                <div className="flex items-center gap-2 tactical-label mb-2">
                    <span>SYSTEM</span>
                    <ChevronRight size={12} />
                    <span className="text-secondary">TOOLKIT_ENGINE_V2</span>
                </div>
                <h1 className="text-2xl font-bold font-display tracking-tight text-slate-100 flex items-center gap-3">
                    <Terminal size={28} className="text-secondary" />
                    Advanced Decoder Sandbox
                </h1>
                <p className="text-sm text-slate-400 max-w-2xl mt-1">Manual deobfuscation and cryptography suite matching Tier 2 Threat Intel workflows.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-low p-5 border border-outline-variant/15 rounded-sm space-y-4">
                    <label className="tactical-label text-primary flex items-center gap-2">
                        <Code size={16} /> RAW INPUT PAYLOAD
                    </label>
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full h-80 bg-surface-highest/30 border-outline-variant/30 focus:border-primary focus:ring-0 p-4 font-mono text-[11px] text-slate-200 resize-none rounded-sm"
                        placeholder="Paste obfuscated Base64, URLs, hex dumps, or gzip payloads here..."
                    />
                </div>
                
                <div className="bg-surface-low p-5 border border-outline-variant/15 rounded-sm space-y-4 flex flex-col">
                    <label className="tactical-label text-secondary flex items-center gap-2">
                        <Cpu size={16} /> OUTPUT RESULT
                    </label>
                    <textarea 
                        value={output}
                        readOnly
                        className="w-full flex-1 bg-surface-highest/30 border-outline-variant/30 focus:border-secondary focus:ring-0 p-4 font-mono text-[11px] text-secondary/80 resize-none rounded-sm"
                        placeholder="Decrypted payload or extracted IOCs will appear here..."
                    />
                </div>
            </div>

            <div className="bg-surface-low p-5 border border-outline-variant/15 rounded-sm flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-full sm:w-1/2 flex flex-col gap-4">
                    <div>
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">Select Operations Sequence</label>
                        <select 
                            value={operation}
                            onChange={(e) => setOperation(e.target.value)}
                            className="w-full border border-outline-variant/30 bg-surface-highest/50 text-slate-200 text-sm py-3 px-4 outline-none focus:border-secondary rounded-sm font-mono transition-colors"
                        >
                            <option value="b64decode">Base64 Decode</option>
                            <option value="b64encode">Base64 Encode</option>
                            <option disabled>────── BIT ORIENTED ──────</option>
                            <option value="xor">XOR Brute/Fixed Key</option>
                            <option value="rot13">ROT13 Shift</option>
                            <option value="bitwise_not">Bitwise NOT (Invert Bytes)</option>
                            <option value="reverse">Reverse String</option>
                            <option disabled>────── DATA FORMATS ──────</option>
                            <option value="hex_to_raw">Hex to Raw String</option>
                            <option value="raw_to_hex">Raw String to Hex</option>
                            <option value="decimal_to_string">Decimal Charcodes to String</option>
                            <option value="gzip_decompress">Zlib/Gzip Decompress (from Base64)</option>
                            <option disabled>────── IOC PARSING ──────</option>
                            <option value="defang">Defang Active IOCs (hxxp://)</option>
                            <option value="refang">IP/URL Refang (hxxp to http)</option>
                            <option value="ip_to_dec">IP Address to Decimal Format</option>
                            <option value="dec_to_ip">Decimal Format to IP Address</option>
                            <option value="extract_iocs">IOC Regex Extractor</option>
                        </select>
                    </div>
                    {operation === 'xor' && (
                        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}>
                             <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 block text-secondary">XOR Key (String)</label>
                             <input type="text" value={xorKey} onChange={e => setXorKey(e.target.value)} placeholder="e.g. malw4re_k3y" className="w-full bg-surface-highest/30 border border-secondary/30 focus:border-secondary text-slate-200 text-sm py-2 px-3 outline-none rounded-sm font-mono" />
                        </motion.div>
                    )}
                </div>
                <button 
                  onClick={handleExecute}
                  className="w-full sm:w-1/2 py-3 mt-6 bg-secondary text-on-primary font-bold uppercase tracking-widest text-sm hover:brightness-110 transition-all flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(255,89,94,0.2)] h-[46px]"
                >
                  <Bolt size={18} />
                  EXECUTE
                </button>
            </div>
        </motion.div>
    );
}

const AnalyzerView = () => {
  const [headers, setHeaders] = useState('');
  const [body, setBody] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisRecord & { extra: any } | null>(null);
  const [stagedFile, setStagedFile] = useState<string | null>(null);
  const { addNotification, soundEnabled } = useNotificationContext();

  const playNotificationSound = () => {
    if (soundEnabled) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;
      
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1000, now + 0.1);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      osc.start(now);
      osc.stop(now + 0.2);
    }
  };

  const handleAnalyze = async () => {
    if (!headers || !body) return;
    setIsAnalyzing(true);
    
    // Heavy processes are wrapped to free the main thread optionally later
    setTimeout(async () => {
      try {
          const whitelists = await getWhitelists();
          const targetWhitelists = whitelists.length > 0 ? whitelists : MOCK_WHITELIST;
          
          const worker = new Worker(new URL('./engine/worker.ts', import.meta.url), { type: 'module' });
          
          worker.onmessage = async (e) => {
            if (e.data.status === 'success') {
              const parsed = e.data.result;
              
              const analysisRecord = {
                id: parsed.id,
                timestamp: parsed.timestamp,
                sender: parsed.sender,
                subject: parsed.subject,
                verdict: parsed.verdict as Verdict,
                headers,
                body,
                extra: parsed.extra
              };
              
              setResult(analysisRecord);
              await saveHistoryRecord(analysisRecord);
              
              playNotificationSound();
              addNotification(
                'ANALYSIS COMPLETE',
                `Verdict: ${parsed.verdict}`,
                parsed.verdict === 'MALICIOUS' ? 'error' : parsed.verdict === 'SAFE' ? 'success' : 'warning'
              );
            } else {
              addNotification('ERROR', 'Web Worker crash processing payload.', 'error');
            }
            
            setIsAnalyzing(false);
            worker.terminate();
          };

          worker.postMessage({ headers, body, whitelists: targetWhitelists });
      } catch (e) {
          console.error(e);
          setIsAnalyzing(false);
      }
    }, 50);
  };

  const handleSave = async () => {
    if (!result) return;
    await saveHistoryRecord(result);
    addNotification('SUCCESS', 'Analysis logged to History DB natively.', 'success');
  };



  const handleFileSelect = async (file: File) => {
    const isEml = file.name.toLowerCase().endsWith('.eml');
    const isTxt = file.name.toLowerCase().endsWith('.txt');

    if (!isEml && !isTxt) {
      addNotification('PROTOCOL VIOLATION', 'SECURITY DENIAL: Payload format unauthorized. Only .eml and .txt streams are permitted for triage.', 'error');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const parser = new PostalMime();
      const email = await parser.parse(arrayBuffer);
      
      const rawHeaders = email.headers.map(h => `${h.key}: ${h.value}`).join('\n');
      
      setHeaders(rawHeaders);
      setBody(email.html || email.text || '');
      setResult(null);
      setStagedFile(file.name);
      
      addNotification('FILE STAGED', 'Decrypted and staged successfully. Click RUN ANALYSIS.', 'success');
    } catch (e) {
      console.error(e);
      addNotification('DECRYPTION FAILED', 'Unable to parse file stream headers.', 'error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

      {/* EML IMPORT SECTION */}
      {stagedFile ? (
        <div className="bg-surface-low border-2 border-primary/50 rounded-sm p-6 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 text-primary rounded border border-primary/30">
                    <FileText size={24} />
                </div>
                <div>
                   <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">Staged for Analysis</p>
                   <p className="text-primary font-bold text-lg font-display tracking-tight">{stagedFile}</p>
                </div>
            </div>
            <button 
                onClick={() => { setStagedFile(null); setHeaders(''); setBody(''); setResult(null); }}
                className="text-slate-500 hover:text-secondary group flex items-center gap-2 p-2 border border-transparent hover:border-secondary/30 rounded transition-all"
            >
                <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest text-secondary">Discard</span>
                <X size={20} />
            </button>
        </div>
      ) : (
        <div 
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="bg-surface-low border-2 border-dashed border-primary/30 rounded-sm p-8 mb-6 transition-all hover:border-primary/60 hover:bg-surface-high/20 cursor-pointer relative group"
        >
          <input
            id="eml-import"
            type="file"
            accept=".eml,.txt"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
                e.target.value = ''; // Reset input to allow re-uploading same file
              }
            }}
            className="hidden"
          />
          <label htmlFor="eml-import" className="block cursor-pointer">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="text-primary/40 group-hover:text-primary/60 transition-colors">
                <FileText size={48} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-primary/80 group-hover:text-primary transition-colors">DRAG & DROP TELEMETRY FILE HERE</p>
                <p className="text-[10px] text-slate-500 mt-1">Or click to manually stage file stream</p>
              </div>
              <p className="text-[9px] font-mono text-slate-600">SUPPORTED FORMATS: .eml (RFC 5322), .txt</p>
            </div>
          </label>
        </div>
      )}

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
              className="w-full py-4 bg-primary text-on-primary font-bold uppercase tracking-widest text-sm hover:brightness-110 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? <Bolt className="animate-spin" size={18} /> : <Shield size={18} />}
              {isAnalyzing ? 'ANALYZING...' : 'RUN ANALYSIS'}
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
                <AnalysisResultDisplay result={result} />
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

const HistoryView = ({ onViewAnalysis }: { onViewAnalysis: (record: AnalysisRecord & { extra: any }) => void }) => {
  const [history, setHistory] = useState<(AnalysisRecord & { extra: any })[]>([]);

  useEffect(() => {
    getHistory().then(list => {
      setHistory(list as any);
    });
  }, []);

  const handleDelete = async (index: number) => {
    const recordId = history[index].id;
    await deleteHistoryRecord(recordId);
    const newList = [...history];
    newList.splice(index, 1);
    setHistory(newList);
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
                <tr 
                  key={`${item.id}-${idx}`} 
                  onClick={() => onViewAnalysis(item)}
                  className="hover:bg-surface-high transition-colors group cursor-pointer"
                >
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
                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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

const AnalysisDetailView = ({ record, onClose, onViewFullReport }: { record: AnalysisRecord & { extra: any }, onClose: () => void, onViewFullReport: (record: AnalysisRecord & { extra: any }) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-high border border-outline-variant/20 rounded-lg shadow-2xl max-w-2xl w-full max-h-[75vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="border-b border-outline-variant/10 p-6 flex items-center justify-between sticky top-0 bg-surface-high/95 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-lg font-bold font-display text-primary">Analysis Summary</h2>
            <p className="text-xs text-slate-500 mt-1">{record.timestamp}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-outline-variant/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Verdict Badge */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold font-display uppercase tracking-tight border ${
              record.verdict === 'MALICIOUS' ? 'bg-secondary/20 text-secondary border-secondary/30' :
              record.verdict === 'SAFE' ? 'bg-primary/20 text-primary border-primary/30' :
              'bg-tertiary/20 text-tertiary border-tertiary/30'
            }`}>
              {record.verdict}
            </span>
            {record.score !== undefined && (
              <span className="text-xs text-slate-400">
                Score: {record.score} - Threat Level
              </span>
            )}
          </div>

          {/* Critical Info */}
          <div className="grid grid-cols-12 gap-4">
            <div className="bg-surface border border-outline-variant/10 rounded p-4 col-span-6">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">From</p>
              <p className="font-mono text-sm text-slate-200 break-all">{record.sender}</p>
            </div>
            <div className="bg-surface border border-outline-variant/10 rounded p-4 col-span-6">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Record ID</p>
              <p className="font-mono text-sm text-primary">{record.id}</p>
            </div>
            <div className="bg-surface border border-outline-variant/10 rounded p-4 col-span-12">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Subject</p>
              <p className="text-sm text-slate-200 break-words">{record.subject}</p>
            </div>
          </div>

          {/* Authentication Status */}
          {record.extra?.authStatus && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Authentication Status</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface border border-outline-variant/10 rounded p-2 text-center">
                  <p className="text-xs text-slate-500 mb-1">SPF</p>
                  <p className={`text-xs font-mono font-bold ${record.extra.authStatus.spf === 'PASS' ? 'text-primary' : record.extra.authStatus.spf === 'FAIL' ? 'text-secondary' : 'text-tertiary'}`}>
                    {record.extra.authStatus.spf || 'N/A'}
                  </p>
                </div>
                <div className="bg-surface border border-outline-variant/10 rounded p-2 text-center">
                  <p className="text-xs text-slate-500 mb-1">DKIM</p>
                  <p className={`text-xs font-mono font-bold ${record.extra.authStatus.dkim === 'PASS' ? 'text-primary' : record.extra.authStatus.dkim === 'FAIL' ? 'text-secondary' : 'text-tertiary'}`}>
                    {record.extra.authStatus.dkim || 'N/A'}
                  </p>
                </div>
                <div className="bg-surface border border-outline-variant/10 rounded p-2 text-center">
                  <p className="text-xs text-slate-500 mb-1">DMARC</p>
                  <p className={`text-xs font-mono font-bold ${record.extra.authStatus.dmarc === 'PASS' ? 'text-primary' : record.extra.authStatus.dmarc === 'FAIL' ? 'text-secondary' : 'text-tertiary'}`}>
                    {record.extra.authStatus.dmarc || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick URLs Summary */}
          {record.extra?.urls && record.extra.urls.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide">URLs Found ({record.extra.urls.length})</h3>
              <div className="bg-surface border border-outline-variant/10 rounded p-3">
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {record.extra.urls.slice(0, 3).map((url: string, idx: number) => (
                    <p key={idx} className="text-xs font-mono text-slate-300 break-all truncate">{url}</p>
                  ))}
                  {record.extra.urls.length > 3 && (
                    <p className="text-xs text-slate-500 italic mt-2">+{record.extra.urls.length - 3} more URLs...</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Threats Summary */}
          {record.extra?.threats && record.extra.threats.length > 0 && (
            <div className="bg-secondary/10 border border-secondary/20 rounded p-3">
              <p className="text-sm font-bold text-secondary uppercase tracking-wide mb-2">⚠ Threat Indicators Detected</p>
              <ul className="space-y-1 text-xs text-slate-300">
                {record.extra.threats.slice(0, 3).map((threat: string, idx: number) => (
                  <li key={idx}>• {threat}</li>
                ))}
                {record.extra.threats.length > 3 && (
                  <li className="text-slate-500 italic mt-2">+{record.extra.threats.length - 3} more indicators...</li>
                )}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-outline-variant/10 pt-5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded border border-outline-variant/30 text-slate-300 text-sm font-semibold hover:border-outline-variant/50 hover:bg-surface-high transition-all"
            >
              Close
            </button>
            <button
              onClick={() => {
                onViewFullReport(record);
                onClose();
              }}
              className="flex-1 px-4 py-2.5 rounded bg-primary text-on-primary text-sm font-semibold hover:shadow-[0_0_15px_rgba(74,225,118,0.2)] transition-all"
            >
              View Full Report
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const WhitelistsView = () => {
  const [domain, setDomain] = useState('');
  const [list, setList] = useState<WhitelistEntry[]>([]);

  useEffect(() => {
    getWhitelists().then(res => {
      setList(res);
    });
  }, []);

  const handleAdd = async () => {
    if (!domain) return;
    const added = {
      domain,
      description: 'User Defined Trusted Domain',
      addedAt: new Date().toISOString().split('T')[0]
    };
    await saveWhitelistEntry(added);
    const updated = await getWhitelists();
    setList(updated);
    setDomain('');
  };

  const handleRemove = async (idx: number) => {
    const domainToRemove = list[idx].domain;
    await removeWhitelistEntry(domainToRemove);
    const updated = await getWhitelists();
    setList(updated);
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

const ReportsView = ({ selectedReport }: { selectedReport: (AnalysisRecord & { extra: any }) | null }) => {
  if (!selectedReport) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="h-full flex flex-col items-center justify-center text-center"
      >
        <FileText size={64} className="text-slate-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-400 font-display uppercase tracking-wide mb-2">No Report Selected</h3>
        <p className="text-sm text-slate-500 max-w-md">Select an email from the History view to see the detailed analysis report</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="h-2 w-2 bg-primary rounded-full animate-pulse"></span>
            SYSTEM | FULL_ANALYSIS_REPORT
          </p>
          <h2 className="text-2xl font-black font-display text-primary mt-2">Thread Report Detail</h2>
          <p className="text-xs text-slate-500 font-mono mt-1">ID: {selectedReport.id} | GEN_TIMESTAMP: {selectedReport.timestamp}</p>
        </div>
      </div>

      <AnalysisResultDisplay result={selectedReport} />

      {/* Footer Info */}
      <div className="bg-surface-low border border-outline-variant/15 rounded p-4 flex justify-between text-[10px] text-slate-500 font-mono uppercase tracking-widest">
        <span>BTL1 Framework Integrated | API v1.0-Local</span>
        <span>Secure Session Active</span>
      </div>
    </motion.div>
  );
};


// --- Main App ---

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('phishOpsSoundEnabled');
    return saved ? JSON.parse(saved) : true;
  });

  const addNotification = (title: string, message: string, type: 'success' | 'warning' | 'error') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, title, message, type, timestamp: Date.now() }]);
    
    // Auto remove notification after 4 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 4000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const setSoundEnabledHandler = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('phishOpsSoundEnabled', JSON.stringify(enabled));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, soundEnabled, setSoundEnabled: setSoundEnabledHandler }}>
      {children}
    </NotificationContext.Provider>
  );
};

const AppContent = () => {
  const [view, setView] = useState('analyzer');
  const [selectedAnalysis, setSelectedAnalysis] = useState<(AnalysisRecord & { extra: any }) | null>(null);
  const [selectedReport, setSelectedReport] = useState<(AnalysisRecord & { extra: any }) | null>(null);

  const handleViewAnalysis = (record: AnalysisRecord & { extra: any }) => {
    setSelectedAnalysis(record);
  };

  const handleCloseDetailView = () => {
    setSelectedAnalysis(null);
  };

  const handleViewFullReport = (record: AnalysisRecord & { extra: any }) => {
    setSelectedReport(record);
    setView('reports');
  };

  const handleSetView = (newView: string) => {
    setView(newView);
    if (newView !== 'reports') {
      setSelectedReport(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <NotificationCenter />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentView={view} setView={handleSetView} />
        <main className="flex-1 bg-surface overflow-y-auto p-6 pb-20 relative">
          <AnimatePresence mode="wait">
            {view === 'analyzer' && <AnalyzerView key="analyzer" />}
            {view === 'toolkit' && <ToolkitView key="toolkit" />}
            {view === 'history' && <HistoryView key="history" onViewAnalysis={handleViewAnalysis} />}
            {view === 'reports' && <ReportsView key="reports" selectedReport={selectedReport} />}
            {view === 'whitelists' && <WhitelistsView key="whitelists" />}
          </AnimatePresence>
        </main>
      </div>
      <Footer />
      
      {selectedAnalysis && (
        <AnalysisDetailView record={selectedAnalysis} onClose={handleCloseDetailView} onViewFullReport={handleViewFullReport} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}
