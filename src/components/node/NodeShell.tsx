import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Trash2, ChevronRight, ChevronDown, MoreHorizontal } from 'lucide-react';
import type { NodeId } from '@/types/outliner';
import { useNodeLogic } from '@/hooks/node/useNodeLogic';

interface NodeShellProps {
  id: NodeId;
  level: number;
  children: ReactNode;
}

export const NodeShell: React.FC<NodeShellProps> = ({
  id,
  level,
  children
}) => {
  // We can use the logic hook here for toggle/delete actions
  const {
    node,
    isSelected,
    isFocused,
    toggleCollapse,
    deleteNode,
    selectNode
  } = useNodeLogic(id);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isMenuOpen]);

  // If node doesn't exist (deleted), return null
  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = node.isCollapsed;

  return (
    <div
      className={`oo-node-shell group relative select-none transition-colors duration-200
                ${isSelected ? 'bg-blue-50/80 rounded-lg' : ''}
                ${isFocused && !isSelected ? 'bg-slate-100/50 rounded-lg' : ''}
            `}
      style={{
        paddingLeft: isSelected || isFocused ? `${level * 24}px` : `${level * 24}px`
        // Adjust logic: if selected, we might want background to span? 
        // For now, keep simple indentation.
      }}
    >
      <div className={`flex items-start min-h-[32px] py-0.5 pr-2 rounded-md`}>

        {/* Left Controls (Desktop Only - Hover) */}
        <div
          className="hidden md:flex items-center justify-end w-12 -ml-12 pr-1 h-7 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          contentEditable={false}
        >
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>

            {isMenuOpen && (
              <div className="absolute left-0 top-6 w-32 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(id);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bullet / Expander */}
        <div className="flex items-center justify-center w-6 h-7 flex-shrink-0 relative mt-0.5 z-10">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(id);
              }}
              className="group/toggle w-5 h-5 flex items-center justify-center rounded-sm hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {/* Bullet (Default Visible) */}
              <div className="group-hover/toggle:hidden flex items-center justify-center">
                <div
                  className={`
                        rounded-full transition-all duration-300
                        ${isCollapsed ? 'w-2 h-2 bg-slate-400' : 'w-1.5 h-1.5 bg-slate-300'}
                        ${isFocused ? '!bg-blue-400 scale-125' : ''}
                    `}
                />
              </div>

              {/* Chevron (Hover Visible) */}
              <div className="hidden group-hover/toggle:block text-slate-500">
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>
          ) : (
            <div className="w-5 h-5 flex items-center justify-center">
              <div
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300
                                    ${isFocused ? 'bg-blue-400 scale-125' : 'bg-slate-300 group-hover:bg-slate-400'}
                                `}
                onClick={(e) => {
                  e.preventDefault();
                  selectNode(id);
                }}
              />
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 relative">
          {children}
        </div>
      </div>
    </div>
  );
};
