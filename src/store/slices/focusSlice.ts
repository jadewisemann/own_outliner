
import type { StateCreator } from 'zustand';
import type { OutlinerState, NodeId } from '@/types/outliner';

export interface FocusSlice {
    focusedId: NodeId | null;
    focusCursorPos: number | null;

    setFocus: (id: NodeId | null, cursorPos?: number | null) => void;
    moveFocus: (direction: 'up' | 'down', select?: boolean) => void;
}

export const createFocusSlice: StateCreator<OutlinerState, [], [], FocusSlice> = (set, get) => ({
    focusedId: null,
    focusCursorPos: null,

    setFocus: (id, cursorPos = null) => set({ focusedId: id, focusCursorPos: cursorPos }),

    moveFocus: (direction, select = false) => {
        const state = get();
        if (!state.focusedId && !state.rootNodeId) return;

        const flattenVisibleNodes = (nodeId: NodeId, list: NodeId[]) => {
            const node = state.nodes[nodeId];
            if (nodeId !== state.rootNodeId) list.push(nodeId);

            if (!node.isCollapsed && node.children.length > 0) {
                node.children.forEach(childId => flattenVisibleNodes(childId, list));
            }
        };

        const flatList: NodeId[] = [];
        const effectiveRootId = state.hoistedNodeId || state.rootNodeId;
        const effectiveRoot = state.nodes[effectiveRootId];

        if (effectiveRoot) {
            effectiveRoot.children.forEach(childId => flattenVisibleNodes(childId, flatList));
        }

        let currentIndex = -1;
        if (state.focusedId) {
            currentIndex = flatList.indexOf(state.focusedId);
        }

        if (currentIndex === -1 && flatList.length > 0) {
            set({ focusedId: flatList[0] });
            return;
        }

        let nextIndex = currentIndex;
        if (direction === 'up') {
            nextIndex = currentIndex - 1;
        } else {
            nextIndex = currentIndex + 1;
        }

        if (nextIndex >= 0 && nextIndex < flatList.length) {
            const nextId = flatList[nextIndex];

            if (select) {
                const updates: Partial<OutlinerState> = { focusedId: nextId };
                if (!state.selectionAnchorId) {
                    updates.selectionAnchorId = state.focusedId;
                }

                const anchorId = state.selectionAnchorId || state.focusedId;
                if (anchorId) {
                    const startIndex = flatList.indexOf(anchorId);
                    const endIndex = nextIndex;
                    const start = Math.min(startIndex, endIndex);
                    const end = Math.max(startIndex, endIndex);
                    updates.selectedIds = flatList.slice(start, end + 1);
                }

                set(updates);
            } else {
                set({ focusedId: nextId, selectedIds: [], selectionAnchorId: null });
            }
        }
    },
});
