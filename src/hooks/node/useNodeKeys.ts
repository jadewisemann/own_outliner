import { useOutlinerStore } from '@/store/outliner';
import { isMatch, executeIfMatch } from '@/utils/keybindings';
import type { NodeId, NodeData } from '@/types/outliner';
import type { RefObject } from 'react';
import { useSelectionKeys } from './useSelectionKeys';
import { useEditKeys } from './useEditKeys';

export const useNodeKeys = (
    id: NodeId,
    node: NodeData,
    isSelected: boolean,
    inputRef: RefObject<HTMLInputElement | null>,
    updateContent: (id: NodeId, content: string) => void
) => {
    const state = useOutlinerStore.getState();
    const keys = state.settings.keybindings;

    // Delegate mode-specific logic
    const { handleSelectionMode } = useSelectionKeys(id, node, keys);
    const { handleEditMode } = useEditKeys(id, node, keys, inputRef, updateContent);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Refresh state
        const currentState = useOutlinerStore.getState();
        const currentKeys = currentState.settings.keybindings;

        if (currentState.slashMenu.isOpen) {
            if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) return;
        }

        // 1. Ctrl+Enter (or Cmd+Enter) -> Insert Node Below
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();

            const currentNode = currentState.nodes[id];
            if (currentNode && currentNode.parentId) {
                const parent = currentState.nodes[currentNode.parentId];
                const index = parent?.children.indexOf(id);
                if (index !== undefined && index !== -1) {
                    currentState.addNode(currentNode.parentId, index + 1);
                }
            }
            return;
        }

        if (handleCommonActions(e, currentKeys, currentState, id)) return;
        if (handleFocusNavigation(e, currentKeys, currentState)) return;

        if (isSelected) {
            handleSelectionMode(e);
        } else {
            handleEditMode(e);
        }
    };

    return { handleKeyDown };
};

// --- Helper Handlers ---

const handleCommonActions = (e: React.KeyboardEvent, keys: any, state: any, id: NodeId) => {
    if (executeIfMatch(e, keys.moveUp, () => state.moveNode(id, 'up'))) return true;
    if (executeIfMatch(e, keys.moveDown, () => state.moveNode(id, 'down'))) return true;
    return false;
};

const handleFocusNavigation = (e: React.KeyboardEvent, keys: any, state: any) => {
    if (e.key === 'ArrowUp' && !isMatch(e, keys.moveUp)) {
        e.preventDefault();
        const success = state.moveFocus('up', e.shiftKey);
        if (!success && !e.shiftKey) {
            // Dispatch event to focus header
            document.dispatchEvent(new CustomEvent('outliner:focus-header'));
        }
        return true;
    }
    if (e.key === 'ArrowDown' && !isMatch(e, keys.moveDown)) {
        e.preventDefault();
        state.moveFocus('down', e.shiftKey);
        return true;
    }
    return false;
};
