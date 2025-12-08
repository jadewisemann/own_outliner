import React, { useEffect, useRef } from 'react';
import { useOutlinerStore } from '../store/useOutlinerStore';
import type { NodeId } from '../types/outliner';
import { ChevronRight, ChevronDown, ZoomIn } from 'lucide-react';
import { isMatch } from '../utils/keybindings';

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
    const focusCursorPos = useOutlinerStore((state) => state.focusCursorPos);
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
    const deselectAll = useOutlinerStore((state) => state.deselectAll);

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

                    // Handle cursor positioning based on store intent or default to end
                    const len = inputRef.current.value.length;
                    let newPos = len; // Default to end

                    if (focusCursorPos !== null) {
                        newPos = focusCursorPos;
                    }

                    // Safety check
                    if (newPos < 0) newPos = 0;
                    if (newPos > len) newPos = len;

                    inputRef.current.setSelectionRange(newPos, newPos);
                }
            }
        }
    }, [focusedId, id, isSelected, focusCursorPos]);



    const handleKeyDown = (e: React.KeyboardEvent) => {
        const state = useOutlinerStore.getState();
        const keys = state.settings.keybindings;

        // Common actions
        if (isMatch(e, keys.moveUp)) {
            e.preventDefault();
            moveNode(id, 'up');
            return;
        }
        if (isMatch(e, keys.moveDown)) {
            e.preventDefault();
            moveNode(id, 'down');
            return;
        }

        // --- Focus Navigation (Standard Arrows) ---
        // Fallback to standard behavior if not matched by moveUp/moveDown
        if (e.key === 'ArrowUp' && !isMatch(e, keys.moveUp)) {
            e.preventDefault();
            moveFocus('up', e.shiftKey);
            return;
        }
        if (e.key === 'ArrowDown' && !isMatch(e, keys.moveDown)) {
            e.preventDefault();
            moveFocus('down', e.shiftKey);
            return;
        }

        if (isSelected) {
            // --- Node Mode ---
            if (isMatch(e, keys.indentNode)) {
                e.preventDefault();
                const ids = state.selectedIds.length > 0 ? state.selectedIds : [id];
                state.indentNodes(ids);
                return;
            }
            if (isMatch(e, keys.outdentNode)) {
                e.preventDefault();
                const ids = state.selectedIds.length > 0 ? state.selectedIds : [id];
                state.outdentNodes(ids);
                return;
            }

            if (e.key === 'Escape') {
                // No binding for this yet
            }
            // Enter to Edit
            if (e.key === 'Enter') {
                e.preventDefault();
                selectNode(id, false); // Switch to Edit Mode
                return;
            }

            if (isMatch(e, keys.deleteNode) || e.key === 'Backspace') {
                e.preventDefault();
                if (state.selectedIds.length > 1) {
                    state.deleteNodes(state.selectedIds);
                } else {
                    deleteNode(id);
                }
                return;
            }

            if (isMatch(e, keys.deleteLine)) {
                e.preventDefault();
                // "Delete Line" concept: Delete entire node even if not empty
                if (state.selectedIds.length > 1) {
                    state.deleteNodes(state.selectedIds);
                } else {
                    // Single node delete (deleteNodes handles children logic implicitly by tree structure)
                    // If we want to strictly emulate "Delete Line" vs "Delete Node", in outliner they are usually same for single line.
                    state.deleteNodes([id]);
                }
                return;
            }

            if (isMatch(e, keys.selectLine)) {
                e.preventDefault();
                if (inputRef.current) {
                    inputRef.current.select();
                }
                return;
            }

            if (isMatch(e, keys.selectAll)) {
                e.preventDefault();
                expandSelection(id);
                return;
            }

            if (isMatch(e, keys.toggleCollapse)) {
                e.preventDefault();
                state.toggleCollapse(id);
                return;
            }

            if (isMatch(e, keys.zoomIn)) {
                e.preventDefault();
                // Zoom into the current node
                state.setHoistedNode(id);
                return;
            }

            if (isMatch(e, keys.zoomOut)) {
                e.preventDefault();
                // Zoom out one level from the CURRENT HOISTED VIEW (not necessarily the focused node)
                const currentHoistedId = state.hoistedNodeId;
                if (currentHoistedId) {
                    const currentHoistedNode = state.nodes[currentHoistedId];
                    // If current hoisted node has a parent, zoom to that parent.
                    // If parent is root, or null, un-hoist (show root).
                    if (currentHoistedNode && currentHoistedNode.parentId && currentHoistedNode.parentId !== state.rootNodeId) {
                        state.setHoistedNode(currentHoistedNode.parentId);
                    } else {
                        state.setHoistedNode(null); // Go to Root
                    }
                }
                return;
            }

            // Clipboard
            if (isMatch(e, keys.copyNode)) {
                e.preventDefault();
                const targets = state.selectedIds.length > 0 ? state.selectedIds : [id];
                import('../utils/clipboard').then(({ serializeNodesToClipboard }) => {
                    const { text, json } = serializeNodesToClipboard(targets, state.nodes);
                    const data = [new ClipboardItem({
                        'text/plain': new Blob([text], { type: 'text/plain' }),
                        'application/json': new Blob([json], { type: 'application/json' })
                    })];
                    navigator.clipboard.write(data).catch(() => navigator.clipboard.writeText(text));
                });
                return;
            }
            if (isMatch(e, keys.cutNode)) {
                e.preventDefault();
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
                        navigator.clipboard.writeText(text).then(() => state.deleteNodes(targets));
                    });
                });
                return;
            }
            if (isMatch(e, keys.pasteNode)) {
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
                                    const parent = state.nodes[node.parentId || ''];
                                    if (parent) {
                                        const index = parent.children.indexOf(id) + 1;
                                        pasteNodes(parent.id, index, parsed);
                                    }
                                }
                            });
                        }
                    });
                }).catch(() => {
                    navigator.clipboard.readText().then(text => {
                        if (text) {
                            import('../utils/clipboard').then(({ parseIndentedText }) => {
                                const parsed = parseIndentedText(text);
                                if (parsed.length > 0) {
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
                return;
            }

            // Arrow Left/Right to switch mode
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                deselectAll();
                setFocus(id, 0);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                deselectAll();
                setFocus(id, node.content.length);
            }

        } else {
            // --- Edit Mode (Input) ---
            if (e.key === 'Escape') {
                e.preventDefault();
                selectNode(id);
                return;
            }

            if (isMatch(e, keys.splitNode)) {
                e.preventDefault();
                if (inputRef.current) {
                    const cursorPos = inputRef.current.selectionStart || 0;
                    splitNode(id, cursorPos);
                }
                return;
            }

            if (isMatch(e, keys.indentNode)) {
                e.preventDefault();
                state.indentNodes([id]);
                return;
            }
            if (isMatch(e, keys.outdentNode)) {
                e.preventDefault();
                state.outdentNodes([id]);
                return;
            }

            if (isMatch(e, keys.mergeNode)) {
                // Only if at start
                if (inputRef.current && inputRef.current.selectionStart === 0 && inputRef.current.selectionEnd === 0) {
                    e.preventDefault();
                    if (node.content.length === 0) {
                        deleteNode(id);
                    } else {
                        mergeNode(id);
                    }
                }
                return;
            }

            if (isMatch(e, keys.deleteNode)) {
                // Delete key specifically
                // Usually Delete in Edit Mode only deletes if empty? Or standard text behavior.
                // Existing logic: if empty, delete node.
                if (node.content.length === 0) {
                    e.preventDefault();
                    deleteNode(id);
                }
                return;
            }

            if (isMatch(e, keys.selectAll)) {
                if (inputRef.current && inputRef.current.selectionStart === 0 && inputRef.current.selectionEnd === inputRef.current.value.length) {
                    e.preventDefault();
                    expandSelection(id);
                }
                return;
            }

            if (isMatch(e, keys.deleteLine)) {
                e.preventDefault();
                state.deleteNodes([id]);
                return;
            }

            if (isMatch(e, keys.selectLine)) {
                e.preventDefault();
                if (inputRef.current) {
                    inputRef.current.select();
                }
                return;
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
                <div className="w-6 h-6 flex items-center justify-center mr-1 cursor-pointer text-gray-400 hover:text-gray-600 relative group/bullet">
                    {/* Zoom Button (only visible on hover) */}
                    <div
                        className="absolute right-full mr-1 opacity-0 group-hover/bullet:opacity-100 transition-opacity p-0.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                        title="Zoom In"
                        onClick={(e) => {
                            e.stopPropagation();
                            useOutlinerStore.getState().setHoistedNode(id);
                        }}
                    >
                        <ZoomIn size={14} />
                    </div>
                    {/* Actually, user requested 'Zoom In Icon'. I'll add ZoomIn import later or use a simple visual for now. */}

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
