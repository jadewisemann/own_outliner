import type { RefObject } from 'react';
import type { NodeId, NodeData } from '@/types/outliner';
import { executeIfMatch, isMatch } from '@/utils/keybindings';
import { useNodeFormatting } from './useNodeFormatting';
import { useOutlinerStore } from '@/store/useOutlinerStore';

export const useEditKeys = (
    id: NodeId,
    node: NodeData,
    keys: any,
    inputRef: RefObject<HTMLInputElement | null>,
    updateContent: (id: NodeId, content: string) => void
) => {
    const { applyFormat } = useNodeFormatting(inputRef, updateContent);

    const handleEditMode = (e: React.KeyboardEvent) => {
        const state = useOutlinerStore.getState();

        if (e.key === 'Escape') {
            e.preventDefault();
            state.selectNode(id);
            return;
        }

        if (executeIfMatch(e, keys.splitNode, () => {
            if (inputRef.current) {
                const cursorPos = inputRef.current.selectionStart || 0;
                const selectionEnd = inputRef.current.selectionEnd || 0;

                if (cursorPos === 0 && selectionEnd === 0) {
                    state.addNodeBefore(id);
                } else {
                    state.splitNode(id, cursorPos);
                }
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
        if (executeIfMatch(e, keys.formatBold, () => applyFormat(id, '**'))) return;
        if (executeIfMatch(e, keys.formatItalic, () => applyFormat(id, '*'))) return;
        if (executeIfMatch(e, keys.formatStrike, () => applyFormat(id, '~~'))) return;

        // Undo/Redo
        if (executeIfMatch(e, keys.undo, () => state.undo())) return;
        if (executeIfMatch(e, keys.redo, () => state.redo())) return;
    };

    return { handleEditMode };
};
