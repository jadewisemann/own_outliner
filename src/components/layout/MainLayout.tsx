import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileToolbar } from '../editor/MobileToolbar';

interface MainLayoutProps {
  children: React.ReactNode;
  onAddNode?: () => void;
  onIndent?: () => void;
  onOutdent?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  onAddNode = () => { },
  onIndent = () => { },
  onOutdent = () => { }
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden selection:bg-yellow-200 selection:text-slate-900">

      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-10 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative scroll-smooth">
        {/* Top Header / Breadcrumbs (Desktop) - Optional in this layout if integrated elsewhere */}
        <div className="sticky top-0 z-10 bg-[#f8fafc]/80 backdrop-blur-md h-14 flex items-center px-4 md:px-8 border-b border-transparent md:border-slate-100/50 transition-colors">
          <div className="text-sm text-slate-400 flex items-center gap-2">
            <span className="hover:text-slate-600 cursor-pointer">Workspace</span>
            <span>/</span>
            <span className="text-slate-900 font-medium">Project Alpha</span>
          </div>
          <div className="ml-auto text-xs text-slate-400 hidden md:block">
            Last edited just now
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 pb-32 md:pb-12 min-h-screen">
          {children}
        </div>
      </main>

      {/* Floating Elements */}
      <MobileToolbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onAdd={onAddNode}
        onIndent={onIndent}
        onOutdent={onOutdent}
      />
    </div>
  );
};
