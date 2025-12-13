import type { ReactNode } from 'react';
import { GripVertical, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
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

  // If node doesn't exist (deleted), return null
  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = node.isCollapsed;

  return (
    <div
      className={`oo-node-shell group relative select-none transition-colors duration-200
                ${isSelected ? 'bg-blue-50/80 -ml-2 pl-2 rounded-lg' : ''}
            `}
      style={{
        paddingLeft: isSelected ? `${level * 24}px` : `${level * 24}px`
        // Adjust logic: if selected, we might want background to span? 
        // For now, keep simple indentation.
      }}
    >
      <div className={`flex items-start min-h-[32px] py-0.5 pr-2 rounded-md ${isFocused ? '' : 'hover:bg-slate-50'}`}>

        {/* Left Controls (Desktop Only - Hover) */}
        <div
          className="hidden md:flex items-center justify-end w-12 -ml-12 pr-1 h-7 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          contentEditable={false} // Prevent cursor entering here
        >
          <div className="flex items-center gap-0.5">
            <button
              className="p-0.5 text-slate-300 hover:text-slate-600 hover:bg-slate-200 rounded cursor-grab active:cursor-grabbing transition-colors"
              title="Drag to move"
            >
              <GripVertical size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(id);
              }}
              className="p-0.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
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
