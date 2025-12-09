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

        if (handleCommonActions(e, keys, state, id)) return;
        if (handleFocusNavigation(e, keys, state)) return;

        if (isSelected) {
            handleSelectionMode(e, keys, state, id, node);
        } else {
            handleEditMode(e, keys, state, id, node, inputRef, updateContent);
        }
    };

    return { handleKeyDown };
};

// --- Helper Handlers ---

const executeIfMatch = (e: React.KeyboardEvent, binding: any, action: () => void) => {
    if (isMatch(e, binding)) {
        e.preventDefault();
        action();
        return true;
    }
    return false;
};

const handleCommonActions = (e: React.KeyboardEvent, keys: any, state: any, id: NodeId) => {
    if (executeIfMatch(e, keys.moveUp, () => state.moveNode(id, 'up'))) return true;
    if (executeIfMatch(e, keys.moveDown, () => state.moveNode(id, 'down'))) return true;
    return false;
};

const handleFocusNavigation = (e: React.KeyboardEvent, keys: any, state: any) => {
    if (e.key === 'ArrowUp' && !isMatch(e, keys.moveUp)) {
        e.preventDefault();
        state.moveFocus('up', e.shiftKey);
        return true;
    }
    if (e.key === 'ArrowDown' && !isMatch(e, keys.moveDown)) {
        e.preventDefault();
        state.moveFocus('down', e.shiftKey);
        return true;
    }
    return false;
};

const handleSelectionMode = (e: React.KeyboardEvent, keys: any, state: any, id: NodeId, node: NodeData) => {
    if (executeIfMatch(e, keys.indentNode, () => {
        const ids = state.selectedIds.length > 0 ? state.selectedIds : [id];
        state.indentNodes(ids);
    })) return;

    if (executeIfMatch(e, keys.outdentNode, () => {
        const ids = state.selectedIds.length > 0 ? state.selectedIds : [id];
        state.outdentNodes(ids);
    })) return;

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

    if (executeIfMatch(e, keys.deleteLine, () => {
        if (state.selectedIds.length > 1) {
            state.deleteNodes(state.selectedIds);
        } else {
            state.deleteNodes([id]);
        }
    })) return;

    if (executeIfMatch(e, keys.selectLine, () => state.selectNode(id, false))) return;

    if (executeIfMatch(e, keys.selectAll, () => state.expandSelection(id))) return;

    if (executeIfMatch(e, keys.toggleCollapse, () => state.toggleCollapse(id))) return;

    if (executeIfMatch(e, keys.zoomIn, () => state.setHoistedNode(id))) return;

    if (executeIfMatch(e, keys.zoomOut, () => {
        const currentHoistedId = state.hoistedNodeId;
        if (currentHoistedId) {
            const currentHoistedNode = state.nodes[currentHoistedId];
            if (currentHoistedNode && currentHoistedNode.parentId && currentHoistedNode.parentId !== state.rootNodeId) {
                state.setHoistedNode(currentHoistedNode.parentId);
            } else {
                state.setHoistedNode(null); // Go to Root
            }
        }
    })) return;

    // Clipboard
    if (executeIfMatch(e, keys.copyNode, () => {
        const targets = state.selectedIds.length > 0 ? state.selectedIds : [id];
        copyNodes(targets, state.nodes);
    })) return;

    if (executeIfMatch(e, keys.cutNode, () => {
        const targets = state.selectedIds.length > 0 ? state.selectedIds : [id];
        cutNodes(targets, state);
    })) return;

    if (executeIfMatch(e, keys.pasteNode, () => handleClipboardPaste(id, state))) return;

    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        state.deselectAll();
        state.setFocus(id, 0);
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        state.deselectAll();
        state.setFocus(id, node.content.length);
    }
};

const handleEditMode = (
    e: React.KeyboardEvent,
    keys: any,
    state: any,
    id: NodeId,
    node: NodeData,
    inputRef: RefObject<HTMLInputElement | null>,
    updateContent: (id: NodeId, content: string) => void
) => {
    if (e.key === 'Escape') {
        e.preventDefault();
        state.selectNode(id);
        return;
    }

    if (executeIfMatch(e, keys.splitNode, () => {
        if (inputRef.current) {
            const cursorPos = inputRef.current.selectionStart || 0;
            state.splitNode(id, cursorPos);
        }
    })) return;

    if (executeIfMatch(e, keys.indentNode, () => state.indentNodes([id]))) return;
    if (executeIfMatch(e, keys.outdentNode, () => state.outdentNodes([id]))) return;

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

    if (executeIfMatch(e, keys.deleteLine, () => state.deleteNodes([id]))) return;

    if (executeIfMatch(e, keys.selectLine, () => state.selectNode(id, false))) return;

    // Formatting
    if (executeIfMatch(e, keys.formatBold, () => applyFormat(inputRef, updateContent, id, '**'))) return;
    if (executeIfMatch(e, keys.formatItalic, () => applyFormat(inputRef, updateContent, id, '*'))) return;
    if (executeIfMatch(e, keys.formatStrike, () => applyFormat(inputRef, updateContent, id, '~~'))) return;

    // Undo/Redo
    if (executeIfMatch(e, keys.undo, () => (useOutlinerStore as any).temporal?.getState().undo())) return;
    if (executeIfMatch(e, keys.redo, () => (useOutlinerStore as any).temporal?.getState().redo())) return;
};

// --- Utilities ---

const applyFormat = (
    inputRef: RefObject<HTMLInputElement | null>,
    updateContent: (id: NodeId, content: string) => void,
    id: NodeId,
    marker: string
) => {
    if (!inputRef.current) return;

    // e.preventDefault() is handled by executeIfMatch

    const input = inputRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const value = input.value;

    let textToWrap = value.slice(start, end);
    let before = value.slice(0, start);
    let after = value.slice(end);

    const isWrapped = before.endsWith(marker) && after.startsWith(marker);
    let newContent = '';
    let newStart = 0;
    let newEnd = 0;

    if (isWrapped) {
        newContent = before.slice(0, -marker.length) + textToWrap + after.slice(marker.length);
        newStart = start - marker.length;
        newEnd = end - marker.length;
    } else {
        newContent = before + marker + textToWrap + marker + after;
        newStart = start + marker.length;
        newEnd = end + marker.length;
    }

    updateContent(id, newContent);
    setTimeout(() => {
        if (inputRef.current) {
            inputRef.current.setSelectionRange(newStart, newEnd);
        }
    }, 0);
};

const copyNodes = (targets: NodeId[], nodes: any) => {
    import('@/utils/clipboard').then(({ serializeNodesToClipboard }) => {
        const { text, json } = serializeNodesToClipboard(targets, nodes);
        const data = [new ClipboardItem({
            'text/plain': new Blob([text], { type: 'text/plain' }),
            'application/json': new Blob([json], { type: 'application/json' })
        })];
        navigator.clipboard.write(data).catch(() => navigator.clipboard.writeText(text));
    });
};

const cutNodes = (targets: NodeId[], state: any) => {
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
};

const handleClipboardPaste = async (id: NodeId, state: any) => {
    // Common paste execution logic
    const executePaste = async (content: string, isJson: boolean) => {
        if (!content) return;

        const { parseIndentedText } = await import('@/utils/clipboard');
        let parsedData = null;

        if (isJson) {
            try {
                const json = JSON.parse(content);
                if (json.format === 'outliner/nodes') {
                    parsedData = json.nodes;
                }
            } catch (e) {
                console.warn('Clipboard contained invalid JSON', e);
            }
        } else {
            parsedData = parseIndentedText(content);
        }

        if (parsedData && parsedData.length > 0) {
            const node = state.nodes[id];
            const parent = state.nodes[node.parentId || ''];
            if (parent) {
                const index = parent.children.indexOf(id) + 1;
                state.pasteNodes(parent.id, index, parsedData);
            }
        }
    };

    try {
        // 1. Try to read rich objects (JSON)
        const items = await navigator.clipboard.read();
        for (const item of items) {
            if (item.types.includes('application/json')) {
                const blob = await item.getType('application/json');
                const text = await blob.text();
                await executePaste(text, true);
                return; // Prioritize JSON if found
            }
        }
    } catch (e) {
        // Ignore read() errors (e.g. firefox, permission), fallback to text
    }

    // 2. Fallback to plain text
    try {
        const text = await navigator.clipboard.readText();
        await executePaste(text, false);
    } catch (e) {
        console.error('Failed to paste from clipboard', e);
    }
};
