import { Database, Save, Trash2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const historyItems = [
  { id: 'SH-9021', time: '02:14 PM', subject: 'URGENT: Action Required on your Office365 Account', status: 'MALICIOUS', color: 'secondary' },
  { id: 'SH-9018', time: '12:45 PM', subject: 'Invoice INV-2023-00921 from Cloud Systems', status: 'SAFE', color: 'primary' },
  { id: 'SH-8994', time: '09:12 AM', subject: 'Weekly Team Sync Meeting Invitation', status: 'SAFE', color: 'primary' },
  { id: 'SH-8972', time: 'Yesterday', subject: 'Notification: You have a new encrypted message', status: 'SUSPICIOUS', color: 'tertiary' },
];

export default function HistorySection() {
  return (
    <div className="bg-surface-container-low border-t border-outline-variant/20 mt-12">
      <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Database className="text-slate-500" size={18} />
          <h3 className="font-headline text-sm font-bold text-white uppercase tracking-wider">Analysis History</h3>
        </div>
        <div className="flex gap-4">
          <button className="px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-tighter border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-2">
            <Save size={12} />
            Save Current
          </button>
          <button className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-tighter">Clear History</button>
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {historyItems.map((item) => (
          <div 
            key={item.id} 
            className={cn(
              "bg-surface-lowest p-4 flex flex-col justify-between hover:bg-surface transition-colors cursor-pointer group",
              item.color === 'tertiary' && "border-l-2 border-tertiary"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-mono text-slate-500">ID: {item.id}</span>
              <span className="text-[9px] font-mono text-primary">{item.time}</span>
            </div>
            <p className="text-xs font-medium text-slate-200 line-clamp-1 mb-2">Subject: {item.subject}</p>
            <div className="flex justify-between items-center">
              <span className={cn(
                "text-[9px] font-mono px-1.5 py-0.5",
                item.color === 'primary' ? 'bg-primary/10 text-primary' : 
                item.color === 'secondary' ? 'bg-secondary/10 text-secondary' : 
                'bg-tertiary/10 text-tertiary'
              )}>
                {item.status}
              </span>
              <button className="text-slate-600 hover:text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
