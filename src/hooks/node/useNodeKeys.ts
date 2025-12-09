import { useOutlinerStore } from '@/store/useOutlinerStore';
import { isMatch } from '@/utils/keybindings';
import type { NodeId, NodeData } from '@/types/outliner';
import type { RefObject } from 'react';

export const useNodeKeys = (
    id: NodeId,
    node: NodeData,
    isSelected: boolean,
    inputRef: RefObject<HTMLInputElement | null>,
    updateContent: (id: NodeId, content: string) => void
) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        const state = useOutlinerStore.getState();
        const keys = state.settings.keybindings;

        // Common actions
        if (isMatch(e, keys.moveUp)) {
            e.preventDefault();
            state.moveNode(id, 'up');
            return;
        }
        if (isMatch(e, keys.moveDown)) {
            e.preventDefault();
            state.moveNode(id, 'down');
            return;
        }

        // --- Focus Navigation (Standard Arrows) ---
        if (e.key === 'ArrowUp' && !isMatch(e, keys.moveUp)) {
            e.preventDefault();
            state.moveFocus('up', e.shiftKey);
            return;
        }
        if (e.key === 'ArrowDown' && !isMatch(e, keys.moveDown)) {
            e.preventDefault();
            state.moveFocus('down', e.shiftKey);
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

            if (e.key === 'Enter') {
                e.preventDefault();
                state.selectNode(id, false); // Switch to Edit Mode
                return;
            }

            if (isMatch(e, keys.deleteNode) || e.key === 'Backspace') {
                e.preventDefault();
                if (state.selectedIds.length > 1) {
                    state.deleteNodes(state.selectedIds);
                } else {
                    state.deleteNode(id);
                }
                return;
            }

            if (isMatch(e, keys.deleteLine)) {
                e.preventDefault();
                if (state.selectedIds.length > 1) {
                    state.deleteNodes(state.selectedIds);
                } else {
                    state.deleteNodes([id]);
                }
                return;
            }

            if (isMatch(e, keys.selectLine)) {
                e.preventDefault();
                state.selectNode(id, false);
                return;
            }

            if (isMatch(e, keys.selectAll)) {
                e.preventDefault();
                state.expandSelection(id);
                return;
            }

            if (isMatch(e, keys.toggleCollapse)) {
                e.preventDefault();
                state.toggleCollapse(id);
                return;
            }

            if (isMatch(e, keys.zoomIn)) {
                e.preventDefault();
                state.setHoistedNode(id);
                return;
            }

            if (isMatch(e, keys.zoomOut)) {
                e.preventDefault();
                const currentHoistedId = state.hoistedNodeId;
                if (currentHoistedId) {
                    const currentHoistedNode = state.nodes[currentHoistedId];
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
                import('@/utils/clipboard').then(({ serializeNodesToClipboard }) => {
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
                import('@/utils/clipboard').then(({ serializeNodesToClipboard }) => {
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
                handleClipboardPaste(id, state);
                return;
            }

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                state.deselectAll();
                state.setFocus(id, 0);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                state.deselectAll();
                state.setFocus(id, node.content.length);
            }

        } else {
            // --- Edit Mode (Input) ---
            if (e.key === 'Escape') {
                e.preventDefault();
                state.selectNode(id);
                return;
            }

            if (isMatch(e, keys.splitNode)) {
                e.preventDefault();
                if (inputRef.current) {
                    const cursorPos = inputRef.current.selectionStart || 0;
                    state.splitNode(id, cursorPos);
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
                        state.deleteNode(id);
                    } else {
                        state.mergeNode(id);
                    }
                }
                return;
            }

            if (isMatch(e, keys.deleteNode)) {
                if (node.content.length === 0) {
                    e.preventDefault();
                    state.deleteNode(id);
                }
                return;
            }

            if (isMatch(e, keys.selectAll)) {
                if (inputRef.current && inputRef.current.selectionStart === 0 && inputRef.current.selectionEnd === inputRef.current.value.length) {
                    e.preventDefault();
                    state.expandSelection(id);
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
                state.selectNode(id, false);
                return;
            }

            // --- Formatting Shortcuts ---
            const applyFormat = (marker: string) => {
                if (!inputRef.current) return;
                e.preventDefault();

                const input = inputRef.current;
                const start = input.selectionStart || 0;
                const end = input.selectionEnd || 0;
                const value = input.value;

                let textToWrap = value.slice(start, end);
                let before = value.slice(0, start);
                let after = value.slice(end);

                // Simple toggle check
                if (before.endsWith(marker) && after.startsWith(marker)) {
                    // Unwrap
                    const newContent = before.slice(0, -marker.length) + textToWrap + after.slice(marker.length);
                    updateContent(id, newContent);
                    setTimeout(() => {
                        if (inputRef.current) {
                            inputRef.current.setSelectionRange(start - marker.length, end - marker.length);
                        }
                    }, 0);
                } else {
                    // Wrap
                    const newContent = before + marker + textToWrap + marker + after;
                    updateContent(id, newContent);
                    setTimeout(() => {
                        if (inputRef.current) {
                            inputRef.current.setSelectionRange(start + marker.length, end + marker.length);
                        }
                    }, 0);
                }
            };

            if (isMatch(e, keys.formatBold)) {
                applyFormat('**');
                return;
            }
            if (isMatch(e, keys.formatItalic)) {
                applyFormat('*');
                return;
            }
            if (isMatch(e, keys.formatStrike)) {
                applyFormat('~~');
                return;
            }

            if (isMatch(e, keys.undo)) {
                e.preventDefault();
                const store = useOutlinerStore as any;
                if (store.temporal) {
                    store.temporal.getState().undo();
                }
                return;
            }
            if (isMatch(e, keys.redo)) {
                e.preventDefault();
                const store = useOutlinerStore as any;
                if (store.temporal) {
                    store.temporal.getState().redo();
                }
                return;
            }
        }
    };

    return { handleKeyDown };
};

// Helper for paste logic reuse
const handleClipboardPaste = (id: NodeId, state: any) => {
    navigator.clipboard.read().then(items => {
        for (const item of items) {
            if (item.types.includes('application/json')) {
                item.getType('application/json').then(blob => {
                    blob.text().then(json => {
                        import('@/utils/clipboard').then(() => {
                            try {
                                const parsed = JSON.parse(json);
                                if (parsed.format === 'outliner/nodes') {
                                    const node = state.nodes[id];
                                    const parent = state.nodes[node.parentId || ''];
                                    if (parent) {
                                        const index = parent.children.indexOf(id) + 1;
                                        state.pasteNodes(parent.id, index, parsed.nodes);
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
                import('@/utils/clipboard').then(({ parseIndentedText }) => {
                    const parsed = parseIndentedText(text);
                    if (parsed.length > 0) {
                        const node = state.nodes[id];
                        const parent = state.nodes[node.parentId || ''];
                        if (parent) {
                            const index = parent.children.indexOf(id) + 1;
                            state.pasteNodes(parent.id, index, parsed);
                        }
                    }
                });
            }
        });
    }).catch(() => {
        navigator.clipboard.readText().then(text => {
            if (text) {
                import('@/utils/clipboard').then(({ parseIndentedText }) => {
                    const parsed = parseIndentedText(text);
                    if (parsed.length > 0) {
                        const node = state.nodes[id];
                        const parent = state.nodes[node.parentId || ''];
                        if (parent) {
                            const index = parent.children.indexOf(id) + 1;
                            state.pasteNodes(parent.id, index, parsed);
                        }
                    }
                });
            }
        });
    });
};
