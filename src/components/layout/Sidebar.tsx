import React from 'react';
import { Search, Plus, Settings, ChevronLeft } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
  return (
    <aside
      className={`
            fixed md:relative z-20 h-full bg-[#fcfcfd] border-r border-slate-200/60
            transition-all duration-300 ease-in-out
            ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 opacity-0 md:opacity-100'}
            flex flex-col
        `}
    >
      {/* Header (Mobile Close Only) */}
      <div className="h-14 flex items-center justify-end px-4 border-b border-slate-100/50 md:hidden">
        <button onClick={toggle} className="p-1 text-slate-400">
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-3">
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-slate-100 text-sm py-2 pl-9 pr-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
          />
          <div className="absolute right-2 top-2 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-400 hidden group-hover:block shadow-sm">⌘K</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">

        <div className="space-y-0.5">
          <SidebarItem icon={Plus} label="New Page" active={false} />
        </div>

        {/* 
            <div>
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Workspace</div>
                <div className="space-y-0.5">
                    <SidebarItem icon={Hash} label="All Notes" active={true} />
                </div>
            </div>
            */}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors w-full">
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

const SidebarItem = ({ icon: Icon, label, active }: { icon: any, label: string, active: boolean }) => (
  <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group ${active ? 'bg-slate-200/50 text-slate-900 font-medium' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
    <Icon size={16} className={`${active ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`} />
    <span>{label}</span>
  </button>
);
