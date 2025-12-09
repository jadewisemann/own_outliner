
import type { StateCreator } from 'zustand';
import type { OutlinerState, NodeId } from '../../types/outliner';

export interface SelectionSlice {
    selectedIds: NodeId[];
    selectionAnchorId: NodeId | null;

    selectNode: (id: NodeId, multi?: boolean) => void;
    deselectAll: () => void;
    selectRange: (targetId: NodeId) => void;
    expandSelection: (currentId: NodeId) => void;
}

export const createSelectionSlice: StateCreator<OutlinerState, [], [], SelectionSlice> = (set, get) => ({
    selectedIds: [],
    selectionAnchorId: null,

    selectNode: (id, multi = false) => set((state) => {
        const newSelected = multi
            ? (state.selectedIds.includes(id)
                ? state.selectedIds.filter(i => i !== id)
                : [...state.selectedIds, id])
            : [id];
        return {
            selectedIds: newSelected,
            selectionAnchorId: multi ? (state.selectionAnchorId || id) : id
        };
    }),

    deselectAll: () => set({ selectedIds: [], selectionAnchorId: null }),

    selectRange: (targetId) => {
        const state = get();
        const anchorId = state.selectionAnchorId || state.focusedId;
        if (!anchorId) return;

        const flattenVisibleNodes = (nodeId: NodeId, list: NodeId[]) => {
            list.push(nodeId);
            const node = state.nodes[nodeId];
            if (!node.isCollapsed && node.children.length > 0) {
                node.children.forEach(childId => flattenVisibleNodes(childId, list));
            }
        };
        const flatList: NodeId[] = [];
        const root = state.nodes[state.rootNodeId];
        root.children.forEach(childId => flattenVisibleNodes(childId, flatList));

        const startIndex = flatList.indexOf(anchorId);
        const endIndex = flatList.indexOf(targetId);

        if (startIndex === -1 || endIndex === -1) return;

        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);

        const range = flatList.slice(start, end + 1);
        set({ selectedIds: range });
    },

    expandSelection: (currentId) => {
        const state = get();
        const node = state.nodes[currentId];
        if (!node || !node.parentId) return;

        const getSubtreeIds = (rootId: NodeId): NodeId[] => {
            const result = [rootId];
            const n = state.nodes[rootId];
            if (n && n.children.length > 0) {
                n.children.forEach(c => {
                    result.push(...getSubtreeIds(c));
                });
            }
            return result;
        };

        const selectedSet = new Set(state.selectedIds);

        const subtreeIds = getSubtreeIds(currentId);
        const isSubtreeSelected = subtreeIds.every(id => selectedSet.has(id));

        if (!isSubtreeSelected) {
            set({ selectedIds: subtreeIds, selectionAnchorId: currentId });
            return;
        }

        const parent = state.nodes[node.parentId];
        if (!parent) return;

        const siblings = parent.children;
        let allSiblingsSelected = true;
        const allSiblingIds: NodeId[] = [];

        siblings.forEach(sibId => {
            const sibSubtree = getSubtreeIds(sibId);
            allSiblingIds.push(...sibSubtree);
            if (!sibSubtree.every(id => selectedSet.has(id))) {
                allSiblingsSelected = false;
            }
        });

        if (!allSiblingsSelected) {
            set({ selectedIds: allSiblingIds });
            return;
        }

        if (!selectedSet.has(parent.id)) {
            const parentSubtree = getSubtreeIds(parent.id);
            set({ selectedIds: parentSubtree, selectionAnchorId: parent.id });
        } else {
            get().expandSelection(parent.id);
        }
    },
});
