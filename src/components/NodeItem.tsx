import React, { useEffect, useRef } from 'react';
import { useOutlinerStore } from '../store/useOutlinerStore';
import type { NodeId } from '../types/outliner';
import { ChevronRight, ChevronDown } from 'lucide-react';

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
    // indent/outdent/moveNode/setHoistedNode unused locally but good to have refs if needed
    const moveFocus = useOutlinerStore((state) => state.moveFocus);
    const moveNode = useOutlinerStore((state) => state.moveNode);
    const pasteNodes = useOutlinerStore((state) => state.pasteNodes);
    const splitNode = useOutlinerStore((state) => state.splitNode);
    const mergeNode = useOutlinerStore((state) => state.mergeNode);

    // Selection
    const selectedIds = useOutlinerStore((state) => state.selectedIds);
    const expandSelection = useOutlinerStore((state) => state.expandSelection);
    const isSelected = selectedIds.includes(id);
    const selectNode = useOutlinerStore((state) => state.selectNode);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (focusedId === id) {
            if (isSelected) {
                if (document.activeElement !== containerRef.current && containerRef.current) {
                    containerRef.current.focus();
                }
            } else {
                if (document.activeElement !== inputRef.current && inputRef.current) {
                    inputRef.current.focus();
                    // Clear persistent text selection
                    const len = inputRef.current.value.length;
                    inputRef.current.setSelectionRange(len, len);
                }
            }
        }
    }, [focusedId, id, isSelected]);

    if (!node) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
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
            const state = useOutlinerStore.getState();
            if (e.shiftKey) {
                state.outdentNode(id);
            } else {
                state.indentNode(id);
            }
            return;
        }

        if (isSelected) {
            // --- Node Mode ---
            if (e.key === 'Enter') {
                e.preventDefault();
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
                        const data = [new ClipboardItem({
                            'text/plain': new Blob([text], { type: 'text/plain' }),
                            'application/json': new Blob([json], { type: 'application/json' })
                        })];
                        navigator.clipboard.write(data).catch(err => {
                            console.warn('Clipboard write failed', err);
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
                        }).catch(() => {
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
                                return;
                            }
                        }
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
                selectNode(id);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.currentTarget as HTMLInputElement;
                const cursorPos = input.selectionStart || 0;
                splitNode(id, cursorPos);
            } else if (e.key === 'Backspace') {
                const input = e.currentTarget as HTMLInputElement;
                if (input.selectionStart === 0 && input.selectionEnd === 0) {
                    e.preventDefault();
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
        <div className={`flex flex-col select-none ${isSelected ? 'bg-blue-100 rounded' : ''}`}>
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
                            if (isSelected) useOutlinerStore.getState().selectNode(id, false);
                            updateContent(id, e.target.value);
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            useOutlinerStore.getState().deselectAll();
                            setFocus(id);
                        }}
                        onFocus={() => {
                            if (!isSelected && focusedId !== id) setFocus(id);
                        }}
                        onPaste={handlePaste}
                    />
                </div>
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
