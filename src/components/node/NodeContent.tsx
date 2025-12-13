import React, { useRef } from 'react';
import type { NodeId } from '@/types/outliner';
import { useNodeLogic } from '@/hooks/node/useNodeLogic';
import { useNodeFocusProcessing } from '@/hooks/node/useNodeFocusProcessing';
import { useNodePaste } from '@/hooks/node/useNodePaste';
import { useNodeKeys } from '@/hooks/node/useNodeKeys';
// Components
import { Check, Terminal } from 'lucide-react';
import { NodeBacklinksIndicator } from './NodeBacklinksIndicator';

// We'll use a simplified ContentInput for now, but configured with types
interface NodeContentProps {
    id: NodeId;
}

export const NodeContent: React.FC<NodeContentProps> = ({ id }) => {
    const {
        node,
        isSelected,
        isFocused,
        focusCursorPos,
        setFocus,
        deselectAll,
        updateContent,
        toggleComplete,
        setSlashMenu,

    } = useNodeLogic(id);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null); // For future use if we make the container focusable

    // Hooks
    useNodeFocusProcessing(id, isSelected, isFocused, focusCursorPos, inputRef, containerRef);
    const { handlePaste } = useNodePaste(id);
    const { handleKeyDown } = useNodeKeys(id, node, isSelected, inputRef, updateContent);

    if (!node) return null;

    // --- Type Styles ---
    const getStyles = () => {
        switch (node.type) {
            case 'h1': return "text-3xl font-bold text-slate-900 mt-6 mb-2 tracking-tight placeholder-slate-300";
            case 'h2': return "text-xl font-semibold text-slate-800 mt-4 mb-1 tracking-tight placeholder-slate-300";
            case 'quote': return "text-lg text-slate-600 italic border-l-4 border-slate-300 pl-4 py-1 my-2 placeholder-slate-300";
            case 'code': return "font-mono text-sm text-slate-200 bg-slate-900 rounded p-2 my-1";
            case 'todo': return node.completed ? "text-slate-400 line-through decoration-slate-400" : "text-slate-700";
            default: return "text-base text-slate-700 leading-relaxed py-0.5 placeholder-slate-300";
        }
    };

    // --- Special Renderers ---
    if (node.type === 'code') {
        const language = node.meta?.language || 'text';
        return (
            <div className="w-full relative group/code bg-slate-900 rounded-lg border border-slate-800 my-1 overflow-hidden transition-all shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-xs text-slate-400 select-none">
                    <div className="flex items-center gap-1.5">
                        <Terminal size={12} />
                        <span>Code Block</span>
                    </div>
                    <span className="opacity-0 group-hover/code:opacity-100 transition-opacity uppercase font-mono text-[10px]">{language}</span>
                </div>
                <div className="p-0">
                    <textarea
                        // Use textarea for code blocks
                        value={node.content}
                        onChange={(e) => updateContent(id, e.target.value)}
                        onKeyDown={(e) => {
                            // Stop propagation for code block editing if needed
                            if (e.key === 'Enter' && !e.shiftKey) {
                                // Maybe allow Shift+Enter for new line?
                                // For now, simple text area behavior
                                e.stopPropagation();
                            }
                            // Pass others to global handler?
                            // handleKeyDown(e); 
                        }}
                        onFocus={() => {
                            deselectAll();
                            setFocus(id);
                        }}
                        className="w-full bg-slate-900 text-slate-50 font-mono text-sm p-3 outline-none resize-none h-auto min-h-[3rem]"
                        spellCheck={false}
                    />
                </div>
            </div>
        );
    }

    // Default & other types
    return (
        <div
            className="flex-1 min-w-0 flex items-center relative group/input"
            onClick={(e) => {
                e.stopPropagation();
                deselectAll();
                setFocus(id);
            }}
        >
            {/* Type Icons / Checkboxes */}
            {node.type === 'todo' && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleComplete(id);
                    }}
                    className={`mr-3 flex-shrink-0 w-5 h-5 rounded border transition-colors flex items-center justify-center 
                        ${node.completed ? 'bg-blue-500 border-blue-500' : 'border-slate-300 hover:border-slate-400'}`}
                >
                    {node.completed && <Check size={12} className="text-white" />}
                </button>
            )}

            {node.type === 'quote' && (
                <div className="absolute left-0 top-2 -ml-2 w-1 h-full bg-slate-300 rounded-full" />
            )}

            <input
                ref={inputRef}
                type="text"
                value={node.content || ''}
                onChange={(e) => {
                    const val = e.target.value;
                    updateContent(id, val);
                    if (val === '/') {
                         const rect = e.target.getBoundingClientRect();
                         setSlashMenu({
                             isOpen: true,
                             position: { x: rect.left, y: rect.bottom },
                             targetNodeId: id
                         });
                    }
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={node.type === 'text' ? "Type '/' for commands" : "Heading"}
                className={`w-full bg-transparent outline-none transition-all ${getStyles()}`}
                autoComplete="off"
            />

            {/* Indicators */}
            <NodeBacklinksIndicator id={id} />
        </div>
    );
};
