export default function StatusFooter() {
  return (
    <footer className="h-8 bg-surface-lowest border-t border-outline-variant/10 px-8 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">System Online</span>
        </div>
        <span className="text-[10px] font-mono text-primary/50">LATENCY: 24ms</span>
        <span className="text-[10px] font-mono text-primary/50">API VERSION: 4.2.0-STABLE</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-mono text-slate-500">SESSION: analyst_alpha_niner</span>
        <span className="text-[10px] font-mono text-slate-500 uppercase">2023-10-27 14:42:01 UTC</span>
      </div>
    </footer>
  );
}
