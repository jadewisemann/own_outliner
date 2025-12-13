import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import * as Y from 'yjs';
import { SupabaseProvider } from '@/lib/yjs-provider';
import { supabase } from '@/lib/supabase';

import type { OutlinerState, NodeData } from '@/types/outliner';
import { createNodeSlice } from '@/store/slices/nodeSlice';
import { createSelectionSlice } from '@/store/slices/selectionSlice';
import { createFocusSlice } from '@/store/slices/focusSlice';
import { createSettingsSlice } from '@/store/slices/settingsSlice';
import { createNavigationSlice } from '@/store/slices/navigationSlice';

import { createAuthSlice } from '@/store/slices/authSlice';
import { createSyncSlice } from '@/store/slices/syncSlice';


export const useOutlinerStore = create<OutlinerState>()(
    temporal(
        persist(
            (...a) => {
                const [set, get] = a;
                return {
                    ...createNodeSlice(...a),
                    ...createSelectionSlice(...a),
                    ...createFocusSlice(...a),
                    ...createSettingsSlice(...a),
                    ...createNavigationSlice(...a),
                    ...createAuthSlice(...a),
                    ...createSyncSlice(...a),
                    flashId: null,
                    backlinks: {},

                    // Slash Menu State
                    slashMenu: {
                        isOpen: false,
                        position: null,
                        targetNodeId: null
                    },
                    setSlashMenu: (payload) => set((prev) => ({
                        ...prev,
                        slashMenu: { ...prev.slashMenu, ...payload }
                    })),

                    // Yjs State
                    doc: new Y.Doc(),
                    provider: undefined,

                    initializeSync: async () => {
                        const state = get();
                        if (!state.user) return;
                        if (state.provider) return; // already valid

                        const doc = state.doc as Y.Doc;
                        const yNodes = doc.getMap<any>('nodes');

                        // Hydrate YDoc from local state if YDoc is empty but local nodes exist
                        // This handles the case where we reload page but YDoc is in-memory only
                        if (state.nodes && Object.keys(state.nodes).length > 0 && Array.from(yNodes.keys()).length === 0) {
                            console.log('Hydrating YDoc from local state...');
                            doc.transact(() => {
                                Object.values(state.nodes).forEach(node => {
                                    const nodeMap = new Y.Map();
                                    nodeMap.set('id', node.id);
                                    nodeMap.set('content', node.content);
                                    nodeMap.set('parentId', node.parentId);
                                    nodeMap.set('isCollapsed', node.isCollapsed);
                                    nodeMap.set('updatedAt', node.updatedAt || Date.now());

                                    const childrenArray = new Y.Array();
                                    if (node.children && node.children.length > 0) {
                                        childrenArray.push(node.children);
                                    }
                                    nodeMap.set('children', childrenArray);

                                    yNodes.set(node.id, nodeMap);
                                });
                            });
                        }

                        const provider = new SupabaseProvider(doc, supabase, `room:${state.user.id}`);

                        set({ provider });


                        // Use observeDeep to catch nested changes (content updates, children array changes)
                        yNodes.observeDeep(() => {
                            // console.log('Yjs Deep Update Detected');
                            // When Yjs updates, we update Local State to trigger Re-render
                            const nodesMap: Record<string, NodeData> = {};
                            yNodes.forEach((content: any, id: string) => {
                                // Convert Yjs types (Y.Map, Y.Array) to plain JSON for Zustand
                                nodesMap[id] = (content && typeof content.toJSON === 'function') ? content.toJSON() : content;
                            });

                            // If empty (new doc), we might not want to overwrite if we have local data?
                            // Strategy: Yjs is source of truth.
                            if (Object.keys(nodesMap).length > 0) {
                                set({ nodes: nodesMap });
                            }
                        });
                    }
                };
            },
            {
                name: 'outliner-storage',
                version: 8,
                migrate: (persistedState: unknown, version: number) => {
                    let state = persistedState as OutlinerState;
                    // ... migration logic preserved ...
                    if (version < 8) {
                        // ... legacy migrations ...
                        state.backlinks = {};
                    }
                    return state;
                },
                partialize: (state) => {
                    // Exclude doc and provider from localStorage persistence
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const {
                        doc,
                        provider,
                        selectedIds,
                        selectionAnchorId,
                        focusedId,
                        flashId,
                        user,
                        session,
                        isAuthLoading,
                        isSyncing,
                        ...rest
                    } = state;
                    return rest;
                },
                onRehydrateStorage: () => (state) => {
                    if (state) {
                        state.selectedIds = [];
                        // state.doc = new Y.Doc(); // Recheck if needed
                    }
                },
            }
        ),
        {
            limit: 100,
            // Exclude Yjs stuff from temporal (undo/redo)? 
            // Ideally Yjs handles undo/redo via Y.UndoManager. 
            // But for now keeping zundo is fine if we only watch 'nodes'.
            partialize: (state) => {
                const { doc, provider, ...rest } = state;
                return rest;
            }
        }
    )
);

// Auto-Sync Handling using subscription
// We can Disable the old "Push" logic since Yjs Provider handles sync!
/*
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 3000;

useOutlinerStore.subscribe((state, prevState) => {
    // ... disable old push ...
});
*/
