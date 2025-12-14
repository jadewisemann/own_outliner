import React, { useEffect, useState, useRef } from 'react';
import { Type, Heading1, Heading2, MessageSquare, CheckSquare, Code } from 'lucide-react';
import type { NodeType } from '../../types/outliner';

interface SlashMenuProps {
  position: { x: number, y: number } | null;
  onSelect: (type: NodeType) => void;
  onClose: () => void;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({ position, onSelect, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const items = [
    { type: 'text', label: 'Text', icon: Type, desc: 'Plain text writing.' },
    { type: 'h1', label: 'Heading 1', icon: Heading1, desc: 'Big section heading.' },
    { type: 'h2', label: 'Heading 2', icon: Heading2, desc: 'Medium section heading.' },
    { type: 'todo', label: 'To-do List', icon: CheckSquare, desc: 'Track tasks.' },
    { type: 'quote', label: 'Quote', icon: MessageSquare, desc: 'Capture a quote.' },
    { type: 'code', label: 'Code Block', icon: Code, desc: 'Capture code snippets.' },
  ] as const;

  // Use ref to access latest selectedIndex in event listener without re-binding
  const selectedIndexRef = useRef(selectedIndex);
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    if (position) {
      setSelectedIndex(0);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }

        if (e.key === 'ArrowDown') {
          setSelectedIndex(i => (i + 1) % items.length);
        } else if (e.key === 'ArrowUp') {
          setSelectedIndex(i => (i - 1 + items.length) % items.length);
        } else if (e.key === 'Enter') {
          onSelect(items[selectedIndexRef.current].type as NodeType);
          onClose();
        } else if (e.key === 'Escape') {
          onClose();
        }
      };

      // Capture phase to intercept events before they reach the editor input
      window.addEventListener('keydown', handleKeyDown, true);
      return () => window.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [position, onSelect, onClose]); // selectedIndex removed from deps

  // Close if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (position) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [position, onClose]);

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
      style={{ top: position.y + 8, left: position.x }}
    >
      <div className="px-3 py-2 text-xs font-semibold text-slate-400 bg-slate-50 border-b border-slate-100">
        Basic Blocks
      </div>
      <div className="p-1 max-h-64 overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={item.type}
            onClick={() => {
              onSelect(item.type as NodeType);
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-md transition-colors text-left
                        ${index === selectedIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}
                    `}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="w-10 h-10 rounded border border-slate-200 bg-white flex items-center justify-center shrink-0 shadow-sm">
              <item.icon size={18} className="text-slate-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800">{item.label}</div>
              <div className="text-xs text-slate-500">{item.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
