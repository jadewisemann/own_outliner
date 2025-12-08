import React from 'react';
import { useOutlinerStore } from '../store/useOutlinerStore';
import type { NodeId } from '../types/outliner';
import { ChevronRight, ChevronDown, Circle } from 'lucide-react';

interface NodeItemProps {
    id: NodeId;
    level?: number;
}

export const NodeItem: React.FC<NodeItemProps> = ({ id, level = 0 }) => {
    const node = useOutlinerStore((state) => state.nodes[id]);
    const updateContent = useOutlinerStore((state) => state.updateContent);
    const toggleCollapse = useOutlinerStore((state) => state.toggleCollapse);
    const setFocus = useOutlinerStore((state) => state.setFocus);
    const focusedId = useOutlinerStore((state) => state.focusedId);
    const deleteNode = useOutlinerStore((state) => state.deleteNode);
    const indentNode = useOutlinerStore((state) => state.indentNode);
    const splitNode = useOutlinerStore((state) => state.splitNode);
    const mergeNode = useOutlinerStore((state) => state.mergeNode);
    const outdentNode = useOutlinerStore((state) => state.outdentNode);
    const moveFocus = useOutlinerStore((state) => state.moveFocus);
    const moveNode = useOutlinerStore((state) => state.moveNode);
    const setHoistedNode = useOutlinerStore((state) => state.setHoistedNode);
    const pasteNodes = useOutlinerStore((state) => state.pasteNodes);

    // Selection
    const selectedIds = useOutlinerStore((state) => state.selectedIds);
    const expandSelection = useOutlinerStore((state) => state.expandSelection);
    const isSelected = selectedIds.includes(id);
    const selectNode = useOutlinerStore((state) => state.selectNode);

    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (focusedId === id) {
            // Decide where to focus
            if (isSelected) {
                if (document.activeElement !== containerRef.current && containerRef.current) {
                    containerRef.current.focus();
                }
            } else {
                if (document.activeElement !== inputRef.current && inputRef.current) {
                    inputRef.current.focus();
                    // Fix: Clear persistent text selection by moving cursor to end
                    // This ensures that navigating back to a node doesn't restore old highlights
                    const len = inputRef.current.value.length;
                    inputRef.current.setSelectionRange(len, len);
                }
            }
        }
    }, [focusedId, id, isSelected]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Common navigation that overrides default behavior
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (e.altKey) {
                moveNode(id, 'up');
            } else {
                moveFocus('up', e.shiftKey);
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (e.altKey) {
                moveNode(id, 'down');
            } else {
                moveFocus('down', e.shiftKey);
            }
            return;
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                outdentNode(id);
            } else {
                indentNode(id);
            }
            return;
        }

        if (e.key === '.' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            setHoistedNode(id);
            return;
        }

        if (e.key === ',' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            setHoistedNode(null);
            return;
        }

        // Mode-specific handling
        if (isSelected) {
            // --- Node Mode ---
            if (e.key === 'Enter') {
                e.preventDefault();
                // Switch to Edit Mode (focus input, clear selection)
                selectNode(id, false);
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                const state = useOutlinerStore.getState();
                if (state.selectedIds.length > 1) {
                    state.deleteNodes(state.selectedIds);
                } else {
                    deleteNode(id);
                }
            } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                expandSelection(id);
            }
        } else {
            // --- Edit Mode (Input) ---
            if (e.key === 'Escape') {
                e.preventDefault();
                // Switch to Node Mode
                selectNode(id);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.currentTarget as HTMLInputElement; // Use currentTarget for event listener element
                const cursorPos = input.selectionStart || 0;
                splitNode(id, cursorPos);
            } else if (e.key === 'Backspace') {
                const input = e.currentTarget as HTMLInputElement;
                if (input.selectionStart === 0 && input.selectionEnd === 0) {
                    e.preventDefault(); // Only prevent if at start
                    if (node.content.length === 0) {
                        deleteNode(id);
                    } else {
                        mergeNode(id);
                    }
                }
            } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
                const input = e.target as HTMLInputElement;
                if (input instanceof HTMLInputElement && input.selectionStart === 0 && input.selectionEnd === input.value.length) {
                    e.preventDefault();
                    expandSelection(id);
                }
            }
        }
    };

    const handleCopy = (e: React.ClipboardEvent) => {
        if (!isSelected) return; // Only handle in Node Mode
        e.preventDefault();
        e.stopPropagation();

        const state = useOutlinerStore.getState();
        // If multiple selected, copy all. If single, copy self (and children).
        // If single node selected but not in selectedIds? (Shouldn't happen if isSelected is true)
        const targets = state.selectedIds.length > 0 ? state.selectedIds : [id];

        // Dynamic import to avoid circular dep issues during render if any (though utils are safe)
        import('../utils/clipboard').then(({ serializeNodesToClipboard }) => {
            const { text, json } = serializeNodesToClipboard(targets, state.nodes);
            if (e.clipboardData) {
                e.clipboardData.setData('text/plain', text);
                e.clipboardData.setData('application/json', json); // For internal
            }
        });
    };

    const handleCut = (e: React.ClipboardEvent) => {
        if (!isSelected) return;
        handleCopy(e); // Copy first
        // Then delete
        // We need to wait for copy? handleCopy is sync (setData).
        const state = useOutlinerStore.getState();
        const targets = state.selectedIds.length > 0 ? state.selectedIds : [id];
        state.deleteNodes(targets);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        // Should work in both modes? 
        // If in Edit Mode (Input), standard paste puts text in input.
        // Unless we intercept "multiline" or "structured" paste?
        // User request: "Logical Copy/Paste".
        // If I have structured nodes copied, and I paste in input...
        // If I paste in Node Mode: Paste as siblings/children.
        // If I paste in Edit Mode: Paste as text? Or smart paste?

        if (isSelected) {
            // Node Mode Paste: Paste as siblings after current? Or children?
            // Standard: Paste as siblings after current focus.
            e.preventDefault();
            e.stopPropagation();

            const json = e.clipboardData.getData('application/json');
            const text = e.clipboardData.getData('text');

            import('../utils/clipboard').then(({ parseIndentedText }) => {
                let nodesToPaste: any[] = [];

                if (json) {
                    try {
                        const parsed = JSON.parse(json);
                        if (parsed.format === 'outliner/nodes') {
                            nodesToPaste = parsed.nodes;
                        }
                    } catch (err) {
                        console.error('Failed to parse internal JSON', err);
                    }
                }

                if (nodesToPaste.length === 0 && text) {
                    // Fallback to text parsing
                    nodesToPaste = parseIndentedText(text);
                }

                if (nodesToPaste.length > 0) {
                    const state = useOutlinerStore.getState();
                    const parent = state.nodes[node.parentId || ''];
                    if (parent) {
                        const index = parent.children.indexOf(id) + 1; // After current
                        pasteNodes(parent.id, index, nodesToPaste);
                    }
                }
            });
        } else {
            // Edit Mode
            const text = e.clipboardData.getData('text');
            if (text.includes('\n')) {
                e.preventDefault();
                import('../utils/clipboard').then(({ parseIndentedText }) => {
                    const parsed = parseIndentedText(text);
                    // If complex structure, maybe paste as nodes?
                    if (parsed.length > 0) {
                        const state = useOutlinerStore.getState();
                        const parent = state.nodes[node.parentId || ''];
                        if (parent) {
                            const index = parent.children.indexOf(id) + 1;
                            pasteNodes(parent.id, index, parsed);
                        }
                    }
                });
            }
        }
    };

    return (
        <div
            className={`flex flex-col select-none ${isSelected ? 'bg-blue-100 rounded' : ''}`}
        >
            {/* Node Row */}
            <div
                ref={containerRef}
                tabIndex={-1}
                className="flex items-center group py-1 relative outline-none"
                style={{ paddingLeft: `${level * 20}px` }}
                onKeyDown={handleKeyDown}
                onCopy={handleCopy}
                onCut={handleCut}
                onPaste={handlePaste}
            >
                {/* Bullet / Toggle */}
                <div className="w-6 h-6 flex items-center justify-center mr-1 cursor-pointer text-gray-400 hover:text-gray-600">
                    {node.children.length > 0 ? (
                        <button onClick={(e) => { e.stopPropagation(); toggleCollapse(id); }} className="p-0.5 hover:bg-gray-200 rounded">
                            {node.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        </button>
                    ) : (
                        <Circle size={6} fill="currentColor" className="text-gray-300 group-hover:text-gray-400" />
                    )}
                </div>

                {/* Content */}
                <input
                    ref={inputRef}
                    value={node.content}
                    onChange={(e) => {
                        updateContent(id, e.target.value);
                    }}
                    onClick={(e) => {
                        e.stopPropagation();

                        if (e.shiftKey || e.metaKey || e.ctrlKey) {
                            // Modifiers -> Selection Logic
                            // If Shift+Click, we probably want range? 
                            // MVP: Toggle selection or standard behavior
                            // For now let's just allow browser default or handle selection later.
                            // Logic: If modifier, let's keep Node Mode?
                            // selectNode(id, ...);
                        } else {
                            // Simple Click -> Edit Mode
                            // Deselect All to remove "Node Selection" (Blue BG)
                            useOutlinerStore.getState().deselectAll();
                            setFocus(id);
                        }
                    }}
                    onFocus={() => {
                        // If we got focus via Tab? 
                        if (!isSelected && focusedId !== id) setFocus(id);
                    }}
                    onPaste={handlePaste}
                    className="flex-1 min-w-0 bg-transparent outline-none ml-2 text-gray-800 font-sans"
                    placeholder=""
                    readOnly={isSelected} // Optional: Explicitly readonly when selected (Node mode)
                />
            </div>

            {/* Children */}
            {!node.isCollapsed && node.children.length > 0 && (
                <div className="flex flex-col">
                    {node.children.map((childId) => (
                        <NodeItem key={childId} id={childId} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};
