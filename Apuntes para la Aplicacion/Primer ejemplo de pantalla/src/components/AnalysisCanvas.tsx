import { 
  ClipboardPaste, 
  Upload, 
  Bolt, 
  AlertTriangle, 
  Flag, 
  ExternalLink, 
  Copy, 
  Link2Off, 
  Link2, 
  ShieldAlert 
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export default function AnalysisCanvas() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      {/* Page Title */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-headline font-bold text-white tracking-tight">Threat Analysis Canvas</h2>
          <p className="text-slate-400 text-sm font-sans">Analyze suspicious emails for indicators of compromise and social engineering.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface-container-high border border-outline-variant/30 text-xs font-mono text-slate-300 hover:bg-surface-container-highest transition-colors flex items-center gap-2">
            <ClipboardPaste size={14} />
            PASTE LOGS
          </button>
          <button className="px-4 py-2 bg-surface-container-high border border-outline-variant/30 text-xs font-mono text-slate-300 hover:bg-surface-container-highest transition-colors flex items-center gap-2">
            <Upload size={14} />
            UPLOAD .EML
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* INPUT SECTION */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container-low p-6 border-l-2 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <label className="font-headline text-[10px] uppercase font-bold tracking-[0.15em] text-primary">Email Headers</label>
              <span className="text-[9px] font-mono text-slate-500">FORMAT: RAW_RFC5322</span>
            </div>
            <textarea 
              className="w-full h-48 bg-surface-lowest border-none focus:ring-2 focus:ring-primary/30 p-4 font-mono text-xs text-primary/80 leading-relaxed resize-none rounded-sm" 
              placeholder="Paste full RFC 5322 headers here..."
            />
          </div>

          <div className="bg-surface-container-low p-6 border-l-2 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <label className="font-headline text-[10px] uppercase font-bold tracking-[0.15em] text-primary">Email Body</label>
              <span className="text-[9px] font-mono text-slate-500">FORMAT: TEXT/HTML</span>
            </div>
            <textarea 
              className="w-full h-64 bg-surface-lowest border-none focus:ring-2 focus:ring-primary/30 p-4 font-mono text-xs text-slate-300 leading-relaxed resize-none rounded-sm" 
              placeholder="Paste email content here..."
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-4 bg-primary text-on-primary font-headline font-bold uppercase tracking-widest text-sm hover:shadow-[0_0_20px_rgba(74,225,118,0.3)] transition-all duration-300 flex justify-center items-center gap-3"
          >
            <Bolt size={18} className="fill-current" />
            Analyze Threat
          </motion.button>
        </div>

        {/* RESULTS SECTION */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Veredicto Card */}
            <div className="bg-surface-container-low p-6 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <ShieldAlert size={96} />
              </div>
              <label className="font-headline text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400">Veredicto</label>
              <div className="mt-4">
                <span className="text-4xl font-headline font-extrabold text-secondary tracking-tighter">MALICIOUS</span>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '92%' }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-secondary"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-secondary">92% CONF.</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-400 leading-relaxed italic">
                "Potential credential harvesting attack detected. Impersonation of Microsoft O365 identified."
              </p>
            </div>

            {/* Origin Details */}
            <div className="bg-surface-container-low p-6 space-y-4">
              <label className="font-headline text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400">Origin Details</label>
              <div className="space-y-3">
                <DetailRow label="Sender IP" value="185.234.12.98" valueClass="text-secondary" />
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Country</span>
                  <span className="text-xs font-mono text-white flex items-center gap-2">
                    <Flag size={12} />
                    Russia (RU)
                  </span>
                </div>
                <DetailRow label="X-Mailer" value="PHPMailer 5.2" />
              </div>
            </div>
          </div>

          {/* Security Headers */}
          <div className="bg-surface-container-low p-6">
            <label className="font-headline text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400 mb-6 block">Authentication Protocols</label>
            <div className="grid grid-cols-3 gap-4">
              <ProtocolCard label="SPF" status="PASS" color="primary" value="v=spf1 include:_spf.google.com ~all" />
              <ProtocolCard label="DKIM" status="FAIL" color="secondary" value="Body hash did not verify against selector" />
              <ProtocolCard label="DMARC" status="QUARANTINE" color="tertiary" value="p=quarantine; sp=none; adkim=s" />
            </div>
          </div>

          {/* Extracted URLs */}
          <div className="bg-surface-container-low p-6">
            <div className="flex justify-between items-center mb-6">
              <label className="font-headline text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400">Extracted URLs (4)</label>
              <button className="text-[10px] font-mono text-primary flex items-center gap-1 hover:underline">
                SCAN ALL
                <ExternalLink size={10} />
              </button>
            </div>
            <div className="space-y-2">
              <URLRow icon={Link2Off} url="https://microsoft-security-portal.xyz/login/verify-account..." status="PHISHING" color="secondary" />
              <URLRow icon={Link2} url="https://www.microsoft.com/en-us/microsoft-365/privacy..." status="SAFE" color="primary" />
              <URLRow icon={AlertTriangle} url="http://cdn-msft.tracking-api.co/tracking/v1/pixel.png" status="TRACKER" color="tertiary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, valueClass = "text-white" }: { label: string, value: string, valueClass?: string }) {
  return (
    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
      <span className="text-[10px] font-mono text-slate-500 uppercase">{label}</span>
      <span className={cn("text-xs font-mono", valueClass)}>{value}</span>
    </div>
  );
}

function ProtocolCard({ label, status, color, value }: { label: string, status: string, color: 'primary' | 'secondary' | 'tertiary', value: string }) {
  const colorMap = {
    primary: 'border-primary text-primary bg-primary/10',
    secondary: 'border-secondary text-secondary bg-secondary/10',
    tertiary: 'border-tertiary text-tertiary bg-tertiary/10',
  };

  return (
    <div className={cn("bg-surface-lowest p-4 rounded-sm border-t-2", color.startsWith('primary') ? 'border-primary' : color.startsWith('secondary') ? 'border-secondary' : 'border-tertiary')}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-mono text-slate-500">{label}</span>
        <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-full", colorMap[color])}>{status}</span>
      </div>
      <p className="text-[9px] font-mono text-slate-400 break-all leading-tight">{value}</p>
    </div>
  );
}

function URLRow({ icon: Icon, url, status, color }: { icon: any, url: string, status: string, color: 'primary' | 'secondary' | 'tertiary' }) {
  const colorMap = {
    primary: 'text-primary bg-primary/5',
    secondary: 'text-secondary bg-secondary/5',
    tertiary: 'text-tertiary bg-tertiary/5',
  };

  return (
    <div className={cn("bg-surface-lowest p-3 flex items-center justify-between group", color === 'tertiary' && "border-l-2 border-tertiary/40")}>
      <div className="flex items-center gap-3 overflow-hidden">
        <Icon size={14} className={cn(color === 'primary' ? 'text-primary' : color === 'secondary' ? 'text-secondary' : 'text-tertiary')} />
        <span className="text-xs font-mono text-slate-300 truncate">{url}</span>
      </div>
      <div className="flex gap-4 items-center">
        <span className={cn("text-[9px] font-mono px-2 py-1", colorMap[color])}>{status}</span>
        <button className="text-slate-500 hover:text-white transition-colors">
          <Copy size={14} />
        </button>
      </div>
    </div>
  );
}
