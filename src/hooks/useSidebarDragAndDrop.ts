import { useState } from 'react';
import type { Document, ConflictState } from '@/types/outliner';
import { calculateDropPosition, calculateNewRank, getUniqueTitle } from '@/utils/sidebarDragAndDrop';

interface UseSidebarDragAndDropProps {
    documents: Document[];
    sortOrder: 'none' | 'name' | 'manual';
    getSortedChildren: (parentId: string | null) => Document[];
    moveDocument: (id: string, parentId: string | null) => Promise<void>;
    updateDocumentRank: (id: string, rank: string) => Promise<void>;
    setConflictState: (state: ConflictState | null) => void;
}

export function useSidebarDragAndDrop({
    documents,
    sortOrder,
    getSortedChildren,
    moveDocument,
    updateDocumentRank,
    setConflictState
}: UseSidebarDragAndDropProps) {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [dropPos, setDropPos] = useState<'before' | 'inside' | 'after' | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.stopPropagation();
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, id: string, isFolder: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedId || draggedId === id) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;

        const pos = calculateDropPosition(y, height, isFolder, sortOrder);

        // Update state only if changed to avoid render thrashing
        if (dragOverId !== id || dropPos !== pos) {
            setDragOverId(id);
            setDropPos(pos);
        }

        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(null);
        setDropPos(null);
    };

    const handleManualReorder = async (draggedDoc: Document, targetDoc: Document, position: 'before' | 'after') => {
        if (draggedDoc.parentId !== targetDoc.parentId) {
            await moveDocument(draggedDoc.id, targetDoc.parentId);
        }

        const siblings = getSortedChildren(targetDoc.parentId).filter(d => d.id !== draggedDoc.id);
        const tIdx = siblings.findIndex(d => d.id === targetDoc.id);

        let prevRankStr = '0';
        let nextRankStr = '1000';

        if (position === 'before') {
            const prev = siblings[tIdx - 1];
            if (prev?.rank) prevRankStr = prev.rank;
            if (targetDoc.rank) nextRankStr = targetDoc.rank;
        } else {
            if (targetDoc.rank) prevRankStr = targetDoc.rank;
            const next = siblings[tIdx + 1];
            if (next?.rank) nextRankStr = next.rank;
            else nextRankStr = (parseFloat(prevRankStr) + 10).toString();
        }

        const newRank = calculateNewRank(prevRankStr, nextRankStr);
        await updateDocumentRank(draggedDoc.id, newRank);
    };

    const handleFolderMove = async (draggedDoc: Document, targetId: string) => {
        const siblings = documents.filter(d => d.parentId === targetId && d.id !== draggedDoc.id);

        const conflictName = getUniqueTitle(siblings, draggedDoc.title);

        if (conflictName) {
            setConflictState({
                isOpen: true,
                draggedId: draggedDoc.id,
                targetId: targetId,
                initialName: conflictName
            });
            return;
        }

        await moveDocument(draggedDoc.id, targetId);
    };

    const handleDrop = async (e: React.DragEvent, targetId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(null);
        setDropPos(null);

        if (!draggedId || draggedId === targetId) return;
        const draggedDoc = documents.find(d => d.id === draggedId);
        if (!draggedDoc) return;

        if (!targetId) {
            await moveDocument(draggedId, null);
            return;
        }

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;
        const targetDoc = documents.find(d => d.id === targetId);

        if (!targetDoc) return;

        const currentDropPos = calculateDropPosition(y, height, targetDoc.isFolder, sortOrder);

        if (sortOrder === 'manual' && currentDropPos && currentDropPos !== 'inside') {
            await handleManualReorder(draggedDoc, targetDoc, currentDropPos);
            return;
        }

        if (targetDoc.isFolder && (currentDropPos === 'inside' || !currentDropPos)) {
            await handleFolderMove(draggedDoc, targetId);
        }
    };

    return {
        draggedId,
        dragOverId,
        dropPos,
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleDrop
    };
}
