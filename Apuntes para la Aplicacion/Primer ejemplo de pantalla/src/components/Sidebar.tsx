import { 
  Shield, 
  History, 
  UserCheck, 
  BarChart3, 
  HelpCircle, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navItems = [
  { icon: Shield, label: 'Analyzer', active: true },
  { icon: History, label: 'History' },
  { icon: UserCheck, label: 'Whitelists' },
  { icon: BarChart3, label: 'Reports' },
];

const bottomItems = [
  { icon: HelpCircle, label: 'Help' },
  { icon: LogOut, label: 'Logout' },
];

export default function Sidebar() {
  return (
    <aside className="flex flex-col fixed left-0 top-0 h-full py-8 border-r border-outline-variant/10 bg-surface-container-low w-64 z-50">
      <div className="px-6 mb-10 flex items-center gap-3">
        <Shield className="text-primary fill-primary/20" size={24} />
        <h1 className="font-headline font-bold text-primary tracking-tighter text-xl">Sentinel-01</h1>
      </div>

      <div className="px-4 mb-8">
        <div className="flex items-center gap-3 p-3 bg-surface-container-high border-l-4 border-primary">
          <img 
            className="w-10 h-10 rounded-lg object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGQPCb1JWdk6BVgR5BRujQm5RLbrhrZXDuj7bW-XOf8FYAwLmYSZbR12IqpGuPc0Uj2PYhdmRQg9vtr7hG05-gv0OJGavA2iQ_Stl_zWmYF0Q8iOcX4AhsabFBN2THXmCbps_uGEMa7jk-kRho0aFR2SnQEgIx6B3yCcyrxeY7KLqj6fCraJEocfBBEqMlu8UQ6mpkAWUb3oQvgrBYWnCG_R4AxaPZl56jzHvo_XhpL-V5wdt7WFg3fe7cNOyiHhf11cucTp-4GCg" 
            alt="Analyst Profile"
            referrerPolicy="no-referrer"
          />
          <div>
            <p className="font-sans text-sm tracking-wide text-white font-medium">Analyst Profile</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Level 2 Analyst</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className={cn(
              "flex items-center gap-3 px-4 py-3 font-sans text-sm tracking-wide transition-all duration-200",
              item.active 
                ? "bg-surface-container-high text-primary border-l-4 border-primary" 
                : "text-slate-500 hover:bg-surface-container-high hover:text-white"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </a>
        ))}
      </nav>

      <div className="px-4 mt-auto space-y-1">
        {bottomItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-slate-500 font-sans text-sm tracking-wide hover:bg-surface-container-high hover:text-white transition-all duration-200"
          >
            <item.icon size={18} />
            {item.label}
          </a>
        ))}
      </div>
    </aside>
  );
}
