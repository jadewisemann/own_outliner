import { useState, useCallback, useMemo } from 'react';
import type { Document } from '@/types/outliner';

type SortOrder = 'none' | 'name' | 'manual';

export function useSidebarSort(documents: Document[]) {
    const [sortOrder, setSortOrder] = useState<SortOrder>('none');
    const [separateFolders, setSeparateFolders] = useState(true);

    const sortedChildrenMap = useMemo(() => {
        const map = new Map<string | null, Document[]>();

        // 1. Group by parent
        const groups = new Map<string | null, Document[]>();

        documents.forEach(doc => {
            const pid = doc.parentId || null; // Normalize null
            if (!groups.has(pid)) {
                groups.set(pid, []);
            }
            groups.get(pid)!.push(doc);
        });

        // 2. Sort each group
        groups.forEach((items, pid) => {
            const sorted = items.sort((a, b) => {
                if (separateFolders && a.isFolder !== b.isFolder) {
                    return a.isFolder ? -1 : 1;
                }
                if (sortOrder === 'name') {
                    return a.title.localeCompare(b.title);
                }

                if (sortOrder === 'manual') {
                    const rA = a.rank || '';
                    const rB = b.rank || '';
                    if (rA && rB) return rA.localeCompare(rB, undefined, { numeric: true });
                    if (rA) return -1;
                    if (rB) return 1;
                }

                return 0;
            });
            map.set(pid, sorted);
        });

        return map;
    }, [documents, sortOrder, separateFolders]);

    const getSortedChildren = useCallback((parentId: string | null) => {
        return sortedChildrenMap.get(parentId || null) || [];
    }, [sortedChildrenMap]);

    return {
        sortOrder,
        setSortOrder,
        separateFolders,
        setSeparateFolders,
        getSortedChildren
    };
}
