import type { StateCreator } from 'zustand';
import type { OutlinerState, NodeId } from '@/types/outliner';

export interface NavigationSlice {
    navigateToNode: (id: NodeId) => void;
    setFlashId: (id: NodeId | null) => void;
}

export const createNavigationSlice: StateCreator<OutlinerState, [], [], NavigationSlice> = (set, get) => ({
    setFlashId: (id) => set({ flashId: id }),
    navigateToNode: (id: NodeId) => {
        const state = get();
        const targetNode = state.nodes[id];

        if (!targetNode) return;

        // 1. Find all parents to expand
        let parentId = targetNode.parentId;
        const parentsToExpand: NodeId[] = [];

        while (parentId && parentId !== state.rootNodeId) {
            const parent = state.nodes[parentId];
            if (!parent) break;
            if (parent.isCollapsed) {
                parentsToExpand.push(parentId);
            }
            parentId = parent.parentId;
        }

        // 2. Expand them (batch update if possible, or iterative)
        // Zustand updates are synchronous, so we can just update state once with a map
        if (parentsToExpand.length > 0) {
            set((prev) => {
                const newNodes = { ...prev.nodes };
                parentsToExpand.forEach(pid => {
                    if (newNodes[pid]) {
                        newNodes[pid] = { ...newNodes[pid], isCollapsed: false };
                    }
                });
                return { nodes: newNodes };
            });
        }

        // 3. If target is outside hoisted view, unhoist or hoist safe parent
        // For simplicity, just unhoist if target is not visible?
        // Or check if target is descendant of hoisted node.
        const currentHoisted = state.hoistedNodeId;
        if (currentHoisted) {
            let isDescendant = false;
            let curr = targetNode.parentId;
            while (curr) {
                if (curr === currentHoisted) {
                    isDescendant = true;
                    break;
                }
                curr = state.nodes[curr]?.parentId;
            }

            if (!isDescendant && id !== currentHoisted) {
                // Target is outside current view. Reset hoist.
                // Or try to hoist to a common ancestor? Resetting is safer for now.
                set({ hoistedNodeId: null });
            }
        }

        // 4. Focus or Select based on settings
        const behavior = state.settings.linkClickBehavior || 'edit';

        if (behavior === 'select') {
            get().selectNode(id);
        } else {
            get().setFocus(id, 0);
        }

        // 5. Trigger Flash
        get().setFlashId(id);
        setTimeout(() => {
            // Check if still same (avoid clearing new flash)
            if (get().flashId === id) {
                get().setFlashId(null);
            }
        }, 2000);
    }
});
