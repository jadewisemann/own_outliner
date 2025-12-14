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
        // Refresh state for common actions
        const currentState = useOutlinerStore.getState();
        const currentKeys = currentState.settings.keybindings;

        if (currentState.slashMenu.isOpen) {
            // Let the SlashMenu handle navigation via its window listener.
            // But we must block internal handlers (moveNode, etc) from firing.
            // ArrowUp/Down/Enter are the main ones managed by SlashMenu.

            // However, useNodeKeys's handleKeyDown logic processes "moveNode" (Alt+Arrow) and "moveFocus" (Arrow).
            // We should block plain arrows. 
            // Alt+Arrows might be fine? No, usually menu navigation takes precedence.

            // SlashMenu uses: ArrowUp, ArrowDown, Enter, Escape.
            if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
                return; // Do nothing, let global listener handle (or let it bubble)
                // Actually, SlashMenu uses capture phase window listener.
                // The issue was: useNodeKeys ALSO runs.
                // If we return here, we skip 'handleCommonActions' and 'handleFocusNavigation'.
                // So the editor WON'T move focus. Correct.
            }
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
