import React from 'react';
import { SidebarProvider, useSidebarContext } from '@/components/layout/sidebar/SidebarContext';
import { SidebarHeader } from '@/components/layout/sidebar/SidebarHeader';
import { SidebarTree } from '@/components/layout/sidebar/SidebarTree';
import { SidebarContextMenu } from '@/components/layout/sidebar/SidebarContextMenu';
import { SidebarConflictResolver } from '@/components/layout/sidebar/SidebarConflictResolver';
import { useSidebarKeyboard } from '@/hooks/useSidebarKeyboard';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

const SidebarContent: React.FC<SidebarProps> = ({ className }) => {
  const {
    handleDrop,
    sidebarRef,
    focusedId, setFocusedId
  } = useSidebarContext();

  const { handleKeyDown, visibleItems } = useSidebarKeyboard();

  // Re-implement the onFocus auto-select logic
  const handleFocus = () => {
    if (!focusedId && visibleItems.length > 0) {
      setFocusedId(visibleItems[0].id);
    }
  };

  return (
    <div
      className={`outline-none flex flex-col h-full bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={sidebarRef}
      onFocus={handleFocus}
    >
      <SidebarHeader />


      <div
        className="flex-1 overflow-y-auto py-2"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => handleDrop(e, null)}
      >
        <SidebarTree
          parentId={null}
        />
      </div>

      <SidebarContextMenu />
      <SidebarConflictResolver />
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = (props) => {
  return (
    <SidebarProvider>
      <SidebarContent {...props} />
    </SidebarProvider>
  );
};
