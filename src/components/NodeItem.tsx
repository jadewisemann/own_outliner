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
            } else if ((e.ctrlKey || e.metaKey)) {
                // Copy / Cut / Paste Handlers for Node Mode
                if (e.key === 'c') {
                    e.preventDefault();
                    const state = useOutlinerStore.getState();
                    const targets = state.selectedIds.length > 0 ? state.selectedIds : [id];
                    import('../utils/clipboard').then(({ serializeNodesToClipboard }) => {
                        const { text, json } = serializeNodesToClipboard(targets, state.nodes);
                        // Use Clipboard API
                        // Create ClipboardItem for multi-mime type support
                        const data = [new ClipboardItem({
                            'text/plain': new Blob([text], { type: 'text/plain' }),
                            'application/json': new Blob([json], { type: 'application/json' })
                        })];
                        navigator.clipboard.write(data).catch(err => {
                            // Fallback to text if JSON write fails (Safari sometimes strict)
                            console.warn('Clipboard write failed (likely format issue), falling back to text', err);
                            navigator.clipboard.writeText(text);
                        });
                    });
                } else if (e.key === 'x') {
                    e.preventDefault();
                    const state = useOutlinerStore.getState();
                    const targets = state.selectedIds.length > 0 ? state.selectedIds : [id];
                    import('../utils/clipboard').then(({ serializeNodesToClipboard }) => {
                        const { text, json } = serializeNodesToClipboard(targets, state.nodes);
                        const data = [new ClipboardItem({
                            'text/plain': new Blob([text], { type: 'text/plain' }),
                            'application/json': new Blob([json], { type: 'application/json' })
                        })];
                        navigator.clipboard.write(data).then(() => {
                            state.deleteNodes(targets);
                        }).catch(err => {
                            navigator.clipboard.writeText(text).then(() => {
                                state.deleteNodes(targets);
                            });
                        });
                    });
                } else if (e.key === 'v') {
                    e.preventDefault();
                    navigator.clipboard.read().then(items => {
                        for (const item of items) {
                            if (item.types.includes('application/json')) {
                                item.getType('application/json').then(blob => {
                                    blob.text().then(json => {
                                        import('../utils/clipboard').then(() => {
                                            try {
                                                const parsed = JSON.parse(json);
                                                if (parsed.format === 'outliner/nodes') {
                                                    const state = useOutlinerStore.getState();
                                                    const parent = state.nodes[node.parentId || ''];
                                                    if (parent) {
                                                        const index = parent.children.indexOf(id) + 1;
                                                        pasteNodes(parent.id, index, parsed.nodes);
                                                    }
                                                }
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        });
                                    });
                                });
                                return; // Found json, stop
                            }
                        }
                        // Fallback to text
                        navigator.clipboard.readText().then(text => {
                            if (text) {
                                import('../utils/clipboard').then(({ parseIndentedText }) => {
                                    const parsed = parseIndentedText(text);
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
                        });
                    }).catch(err => {
                        // Fallback for browsers prohibiting read() but allowing readText()
                        console.warn('Clipboard read failed, trying readText', err);
                        navigator.clipboard.readText().then(text => {
                            if (text) {
                                import('../utils/clipboard').then(({ parseIndentedText }) => {
                                    const parsed = parseIndentedText(text);
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
                        });
                    });
                }
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

    const handlePaste = (e: React.ClipboardEvent) => {
        // Edit Mode Paste (Input only)
        // Intercept multiline text to perform smart paste of nodes
        const text = e.clipboardData.getData('text');
        if (text.includes('\n')) {
            e.preventDefault();
            import('../utils/clipboard').then(({ parseIndentedText }) => {
                const parsed = parseIndentedText(text);
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
            >
                {/* Bullet / Toggle */}
                <div className="w-6 h-6 flex items-center justify-center mr-1 cursor-pointer text-gray-400 hover:text-gray-600">
                    <span onClick={(e) => { e.stopPropagation(); toggleCollapse(id); }}>
                        {node.children.length > 0 && (
                            !node.isCollapsed ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                        )}
                        {node.children.length === 0 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                    </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <input
                        ref={inputRef}
                        className={`w-full bg-transparent outline-none ${isSelected ? 'cursor-default caret-transparent' : ''}`}
                        value={node.content}
                        readOnly={isSelected}
                        onChange={(e) => {
                            if (isSelected) useOutlinerStore.getState().selectNode(id, false); // Clear selection on type
                            updateContent(id, e.target.value);
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            useOutlinerStore.getState().deselectAll();
                            setFocus(id);
                            onFocus = {() => {
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
