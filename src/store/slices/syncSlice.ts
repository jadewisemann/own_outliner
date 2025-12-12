import type { StateCreator } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { OutlinerState, NodeData } from '@/types/outliner';

export interface SyncSlice {
    isSyncing: boolean;
    lastSyncedAt: Date | null;
    pullFromCloud: () => Promise<void>;
    pushToCloud: () => Promise<void>;
}

export const createSyncSlice: StateCreator<OutlinerState, [], [], SyncSlice> = (set, get) => ({
    isSyncing: false,
    lastSyncedAt: null,

    pullFromCloud: async () => {
        const { user } = get();
        if (!user) return;

        set({ isSyncing: true });

        try {
            const { data, error } = await supabase
                .from('nodes')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            if (data && data.length > 0) {
                const nodesMap: Record<string, NodeData> = {};
                let rootId = 'root'; // Fallback

                data.forEach((row: any) => {
                    nodesMap[row.id] = {
                        id: row.id,
                        content: row.content,
                        parentId: row.parent_id,
                        children: row.children || [], // jsonb array
                        isCollapsed: row.is_collapsed,
                        createdAt: row.created_at ? new Date(row.created_at).getTime() : undefined,
                        updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
                    };
                    if (!row.parent_id) rootId = row.id;
                });

                set({ nodes: nodesMap, rootNodeId: rootId, lastSyncedAt: new Date() });
            }
        } catch (e) {
            console.error('Pull failed:', e);
        } finally {
            set({ isSyncing: false });
        }
    },

    pushToCloud: async () => {
        const { user, nodes } = get();
        if (!user) return;

        // Basic full push strategy (optimizable later)
        set({ isSyncing: true });
        try {
            const rows = Object.values(nodes).map(node => ({
                id: node.id,
                user_id: user.id,
                content: node.content,
                parent_id: node.parentId,
                children: node.children,
                is_collapsed: node.isCollapsed,
                updated_at: new Date().toISOString(),
            }));

            const { error } = await supabase
                .from('nodes')
                .upsert(rows, { onConflict: 'id' });

            if (error) throw error;

            set({ lastSyncedAt: new Date() });
        } catch (e) {
            console.error('Push failed:', e);
        } finally {
            set({ isSyncing: false });
        }
    }
});
