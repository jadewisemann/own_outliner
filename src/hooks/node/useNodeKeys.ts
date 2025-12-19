import type { KeyboardEvent } from 'react';
import { useOutlinerStore } from '@/store/outlinerStore';
import { isMatch, executeIfMatch } from '@/utils/keybindings';
import type { NodeId, NodeData, OutlinerState, OutlinerSettings } from '@/types/outliner';
import { useSelectionKeys, useEditKeys } from '@/hooks/node';

export interface NodeKeysProps {
    id: NodeId;
    node: NodeData;
    isSelected: boolean;
    inputRef: React.RefObject<HTMLInputElement | null>;
    updateContent: (id: NodeId, content: string) => void;
}

export const useNodeKeys = ({
    id,
    node,
    isSelected,
    inputRef,
    updateContent
}: NodeKeysProps) => {
    const state = useOutlinerStore.getState();
    const keys = state.settings.keybindings;

    // Delegate mode-specific logic
    const { handleSelectionMode } = useSelectionKeys({ id, node, keys });
    const { handleEditMode } = useEditKeys({ id, node, keys, inputRef, updateContent });

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

        if (handleCommonActions({ e, keys: currentKeys, state: currentState, id })) return;
        if (handleFocusNavigation({ e, keys: currentKeys, state: currentState })) return;

        if (isSelected) {
            handleSelectionMode(e);
        } else {
            handleEditMode(e);
        }
    };

    return { handleKeyDown };
};

// --- Helper Handlers ---
export interface CommonActionArgs {
    e: KeyboardEvent;
    keys: OutlinerSettings['keybindings'];
    state: OutlinerState;
    id: NodeId;
}

const handleCommonActions = ({
    e,
    keys,
    state,
    id
}: CommonActionArgs) => {
    if (executeIfMatch(e as any, keys.moveUp, () => state.moveNode(id, 'up'))) return true;
    if (executeIfMatch(e as any, keys.moveDown, () => state.moveNode(id, 'down'))) return true;
    return false;
};


export interface FocusNavigationArgs {
    e: KeyboardEvent;
    keys: OutlinerSettings['keybindings'];
    state: OutlinerState;
}

const handleFocusNavigation = ({
    e,
    keys,
    state
}: FocusNavigationArgs) => {
    if (e.key === 'ArrowUp' && !isMatch(e as any, keys.moveUp)) {
        e.preventDefault();
        const success = state.moveFocus('up', e.shiftKey);
        if (!success && !e.shiftKey) {
            // Dispatch event to focus header
            document.dispatchEvent(new CustomEvent('outliner:focus-header'));
        }
        return true;
    }
    if (e.key === 'ArrowDown' && !isMatch(e as any, keys.moveDown)) {
        e.preventDefault();
        state.moveFocus('down', e.shiftKey);
        return true;
    }
    return false;
};
