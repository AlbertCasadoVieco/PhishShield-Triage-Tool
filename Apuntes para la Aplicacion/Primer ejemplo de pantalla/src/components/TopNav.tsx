import { Search, Settings, User } from 'lucide-react';

export default function TopNav() {
  return (
    <header className="flex justify-between items-center w-full px-8 h-16 bg-surface border-b border-outline-variant/15 z-40">
      <div className="flex items-center gap-8">
        <span className="text-xl font-bold tracking-tighter text-primary font-headline">PHISH_SHIELD</span>
        <nav className="hidden md:flex gap-6 font-headline tracking-tight text-sm uppercase">
          <a className="text-slate-400 font-medium hover:text-primary transition-colors duration-200" href="#">Dashboard</a>
          <a className="text-primary border-b-2 border-primary pb-1" href="#">Live Triage</a>
          <a className="text-slate-400 font-medium hover:text-primary transition-colors duration-200" href="#">Intelligence</a>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input 
            type="text" 
            className="bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-1.5 text-xs font-mono text-slate-300 focus:ring-1 focus:ring-primary w-64 transition-all" 
            placeholder="Global Search..."
          />
        </div>
        <button className="text-slate-400 hover:text-primary transition-colors">
          <Settings size={18} />
        </button>
        <button className="text-slate-400 hover:text-primary transition-colors">
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
