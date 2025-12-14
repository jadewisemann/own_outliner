import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
// import { useOutlinerStore } from '@/store/useOutlinerStore'; 
import { MobileToolbar } from '../editor/MobileToolbar';
import { ChevronRight, Search, Settings } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  onTitleChange: (newTitle: string) => void;
  onTitleKeyDown?: (e: React.KeyboardEvent) => void;
  headerInputRef?: React.RefObject<HTMLInputElement | null>;
  breadcrumbs?: React.ReactNode;
  onAddNode?: () => void;
  onIndent?: () => void;
  onOutdent?: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
  onTitleFocus?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  onTitleChange,
  onTitleKeyDown,
  headerInputRef,
  breadcrumbs,
  onAddNode = () => { },
  onIndent = () => { },
  onOutdent = () => { },
  onSearch,
  onSettings,
  onTitleFocus
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden selection:bg-yellow-200 selection:text-slate-900">

      {/* Sidebar - Desktop: fixed width, Mobile: absolute over content */}
      <div
        className={`fixed inset-y-0 left-0 z-20 w-64 transform bg-white dark:bg-neutral-900 transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'
          }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-10 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative scroll-smooth">
        {/* Top Header / Breadcrumbs (Desktop) */}
        <div className="sticky top-0 z-10 bg-[#f8fafc] h-12 flex items-center px-4 md:px-8 transition-colors">

          {/* Sidebar Toggle for Desktop (when closed) & Mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-3 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded md:hidden"
          >
            <ChevronRight size={20} className={sidebarOpen ? 'rotate-180' : ''} />
          </button>

          {/* Desktop Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`hidden md:flex mr-3 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-transform duration-200 ${sidebarOpen ? 'rotate-180' : ''}`}
            title="Toggle Sidebar"
          >
            <ChevronRight size={18} />
          </button>

          {/* Breadcrumbs */}
          {breadcrumbs && (
            <div className="flex items-center text-sm text-slate-500">
              {breadcrumbs}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right Actions: Search & Settings */}
          <div className="flex items-center gap-1">
            <button
              onClick={onSearch}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
              title="Search (Cmd+K)"
            >
              <Search size={18} />
            </button>
            <button
              onClick={onSettings}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 md:px-12 pb-32 md:pb-12 min-h-screen">
          {/* Document Title Input - Moved here */}
          <div className="mb-6 mt-8 group relative">
            <input
              ref={headerInputRef}
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onFocus={onTitleFocus}
              onKeyDown={onTitleKeyDown}
              className="w-full bg-transparent text-4xl font-bold text-slate-900 placeholder-slate-300 outline-none"
              placeholder="Untitled"
            />
          </div>

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
