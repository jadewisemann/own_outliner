import { useState, useCallback } from 'react';
import type { Document } from '@/types/outliner';

type SortOrder = 'none' | 'name' | 'manual';

export function useSidebarSort(documents: Document[]) {
    const [sortOrder, setSortOrder] = useState<SortOrder>('none');
    const [separateFolders, setSeparateFolders] = useState(true);

    const getSortedChildren = useCallback((parentId: string | null) => {
        // 1. Filter by parent
        const items = documents.filter(d => d.parentId === parentId);

        // 2. Sort
        return items.sort((a, b) => {
            // Priority 1: Folder Separation
            if (separateFolders && a.isFolder !== b.isFolder) {
                return a.isFolder ? -1 : 1;
            }

            // Priority 2: Selected Sort Order
            if (sortOrder === 'name') {
                return a.title.localeCompare(b.title);
            }

            if (sortOrder === 'manual') {
                const rA = a.rank || '';
                const rB = b.rank || '';
                if (rA && rB) return rA.localeCompare(rB, undefined, { numeric: true });
                if (rA) return -1; // Ranked items first
                if (rB) return 1;
            }

            // Default: Creation Order (implicit by DB order usually, but here we rely on array order from store which is sorted by DB)
            // If store is already sorted by DB query, we just preserve it.
            // But Array.sort is in-place? No, we shouldn't mutate props.
            // However, filter returns a new array, so sort is safe.
            return 0;
        });
    }, [documents, sortOrder, separateFolders]);

    return {
        sortOrder,
        setSortOrder,
        separateFolders,
        setSeparateFolders,
        getSortedChildren
    };
}
