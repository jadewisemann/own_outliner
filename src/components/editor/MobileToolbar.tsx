import React from 'react';
import { Plus, Search, ArrowLeft, ArrowRight, Menu } from 'lucide-react';

interface MobileToolbarProps {
  onToggleSidebar: () => void;
  onAdd: () => void;
  onIndent: () => void;
  onOutdent: () => void;
}

export const MobileToolbar: React.FC<MobileToolbarProps> = ({ onToggleSidebar, onAdd, onIndent, onOutdent }) => {
  return (
    <>
      {/* Keyboard Accessory Bar (Mockup - would normally attach to keyboard height) */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="flex items-center gap-2 overflow-x-auto bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-100 pointer-events-auto mx-auto max-w-sm">
          <AccessoryButton label="B" bold />
          <AccessoryButton label="I" italic />
          <AccessoryButton label="H1" />
          <AccessoryButton label="H2" />
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <AccessoryButton label="[]" />
          <AccessoryButton label="<>" />
        </div>
      </div>

      {/* Main Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="h-16 bg-slate-900/95 backdrop-blur-xl text-white rounded-full shadow-2xl flex items-center justify-between px-6 border border-white/10">

          <button onClick={onToggleSidebar} className="p-2 text-slate-400 hover:text-white transition-colors active:scale-95">
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-4">
            <button onClick={onOutdent} className="p-2 text-slate-300 hover:text-white transition-colors active:scale-95">
              <ArrowLeft size={20} />
            </button>

            <button onClick={onAdd} className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-90 transition-transform">
              <Plus size={24} strokeWidth={3} />
            </button>

            <button onClick={onIndent} className="p-2 text-slate-300 hover:text-white transition-colors active:scale-95">
              <ArrowRight size={20} />
            </button>
          </div>

          <button className="p-2 text-slate-400 hover:text-white transition-colors active:scale-95">
            <Search size={20} />
          </button>
        </div>
      </div>
    </>
  );
};

const AccessoryButton = ({ label, bold, italic }: { label: string, bold?: boolean, italic?: boolean }) => (
  <button className={`h-8 min-w-[32px] px-2 flex items-center justify-center rounded-lg bg-slate-50 text-slate-700 text-xs font-medium active:bg-slate-200 transition-colors ${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''}`}>
    {label}
  </button>
);
