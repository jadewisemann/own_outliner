import { useState, useRef } from 'react'; // Added useState
import type { NodeId, LinkPopupState } from '@/types/outliner';
import { useNodeLogic, useNodeFocusProcessing, useNodePaste, useNodeKeys } from '@/hooks/node';
// Components
import { Check, Terminal } from 'lucide-react';

import { NodeMarkdown } from './NodeMarkdown';
import { InlineSearchPopup } from '@/components/InlineSearchPopup'; // Imported

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
        updateType,
        toggleComplete,
        setSlashMenu,

    } = useNodeLogic(id);

    // Popup State
    const [linkPopup, setLinkPopup] = useState<LinkPopupState>({
        isOpen: false,
        type: 'node',
        targetDocTitle: null,
        position: { top: 0, left: 0 },
        query: '',
        triggerIndex: -1,
        triggerLength: 0
    });

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null); // For future use if we make the container focusable

    // Hooks
    useNodeFocusProcessing({ id, isSelected, isFocused, focusCursorPos, inputRef, containerRef });
    const { handlePaste } = useNodePaste(id);
    const { handleKeyDown } = useNodeKeys({ id, node, isSelected, inputRef, updateContent });

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

            {/* Content Area: Hybrid Mode */}
            {isFocused ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={node.content || ''}
                    onChange={(e) => {
                        const val = e.target.value;

                        // Auto-Heading Conversion Logic
                        // # Space -> H1, ## Space -> H2, ### Space -> H3
                        if (val === '# ' && node.type !== 'h1') {
                            updateType(id, 'h1');
                            updateContent(id, ''); // Remove the #
                            return; // Stop processing
                        }
                        if (val === '## ' && node.type !== 'h2') {
                            updateType(id, 'h2');
                            updateContent(id, '');
                            return;
                        }
                        if (val === '### ' && node.type !== 'h3') {
                            updateType(id, 'h3');
                            updateContent(id, '');
                            return;
                        }

                        updateContent(id, val);



                        // 1. Slash Menu Trigger
                        if (val.startsWith('/')) {
                            const filterText = val.slice(1);
                            const rect = e.target.getBoundingClientRect();
                            setSlashMenu({
                                isOpen: true,
                                position: { x: rect.left, y: rect.bottom },
                                targetNodeId: id,
                                filterText
                            });
                        } else {
                            setSlashMenu({ isOpen: false, position: null, targetNodeId: null });
                        }

                        // 2. Internal Link Trigger ([[ only for unified syntax)
                        // Match last occurrence of [[
                        // Regex: /\[\[([^\]]*)$/

                        const selectionStart = e.target.selectionStart || 0;
                        const textBeforeCursor = val.slice(0, selectionStart);

                        const linkMatch = textBeforeCursor.match(/\[\[([^\]]*)$/);

                        if (linkMatch) {
                            const rawQuery = linkMatch[1];
                            const rect = e.target.getBoundingClientRect();
                            const chWidth = 7.5;
                            const leftOffset = (linkMatch.index || 0) * chWidth;

                            let type: 'document' | 'node' = 'document';
                            let query = rawQuery;
                            let targetDocTitle: string | null = null;

                            // 1. Local Block Search: [[^query
                            if (rawQuery.startsWith('^')) {
                                type = 'node';
                                query = rawQuery.slice(1);
                            }
                            // 2. Remote Block Search: [[DocTitle^query
                            else if (rawQuery.includes('^')) {
                                const [docPartial, blockQuery] = rawQuery.split('^');
                                // Check if docPartial matches a known document title exactly? 
                                // Or we assume user selected a doc and typed ^.
                                // Logic: If user types [[Doc^, we treat Doc as target.
                                // But `rawQuery` is everything after [[.
                                if (docPartial) {
                                    type = 'node'; // We want to search nodes
                                    targetDocTitle = docPartial;
                                    query = blockQuery || '';
                                }
                            }

                            setLinkPopup({
                                isOpen: true,
                                type,
                                targetDocTitle,
                                position: { top: rect.bottom + 5, left: rect.left + leftOffset },
                                query,
                                triggerIndex: (linkMatch.index || 0),
                                triggerLength: 2 + rawQuery.length // [[ + query length
                            });
                        } else {
                            setLinkPopup(prev => ({ ...prev, isOpen: false }));
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder={node.type === 'text' ? "Type '/' for commands" : "Heading"}
                    className={`w-full bg-transparent outline-none transition-all ${getStyles()}`}
                    autoComplete="off"
                    autoFocus // Ensure focus when switched
                />
            ) : (
                <div
                    className={`w-full min-h-[1.5rem] cursor-text ${getStyles()}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setFocus(id);
                    }}
                >
                    <NodeMarkdown content={node.content} />
                </div>
            )}

            {/* Internal Link Popup */}
            {linkPopup.isOpen && (
                <InlineSearchPopup
                    mode={linkPopup.type}
                    targetDocTitle={linkPopup.targetDocTitle} // Pass Prop
                    query={linkPopup.query}
                    position={linkPopup.position}
                    onSelect={(selectedId, selectedContent) => {
                        const value = node.content;
                        const triggerIdx = linkPopup.triggerIndex;
                        const before = value.substring(0, triggerIdx);
                        // triggerLength includes [[ + rawQuery so we replace everything user typed
                        const after = value.substring(triggerIdx + linkPopup.triggerLength);

                        let insertion = '';
                        if (linkPopup.type === 'document') {
                            insertion = `[[${selectedContent}]]`;
                        } else {
                            // Node Mode
                            // If Local: [[^id]]
                            // If Remote: [[Doc^id]]

                            // Check if we have a target doc
                            if (linkPopup.targetDocTitle) {
                                insertion = `[[${linkPopup.targetDocTitle}^${selectedId}]]`;
                            } else {
                                insertion = `[[^${selectedId}]]`;
                            }
                        }

                        // Prevent duplicate brackets if user is editing inside existing link (e.g. [[Doc|]])
                        if (after.startsWith(']]')) {
                            insertion = insertion.slice(0, -2);
                        }

                        const newValue = before + insertion + after;
                        updateContent(id, newValue);

                        setLinkPopup({ isOpen: false, type: 'node', position: { top: 0, left: 0 }, query: '', triggerIndex: -1, triggerLength: 0 });

                        requestAnimationFrame(() => {
                            if (inputRef.current) {
                                inputRef.current.focus();
                                // const newCursor = before.length + insertion.length; 
                                // inputRef.current.setSelectionRange(newCursor, newCursor);
                            }
                        });
                    }}
                    onClose={() => setLinkPopup({ isOpen: false, type: 'node', position: { top: 0, left: 0 }, query: '', triggerIndex: -1, triggerLength: 0 })}
                />
            )}

            {/* Indicators */}

        </div>
    );
};
