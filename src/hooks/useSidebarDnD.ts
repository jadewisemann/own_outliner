import { useState } from 'react';
import type { Document } from '@/types/outliner';

interface UseSidebarDnDProps {
    documents: Document[];
    sortOrder: 'none' | 'name' | 'manual';
    getSortedChildren: (parentId: string | null) => Document[];
    moveDocument: (id: string, parentId: string | null) => Promise<void>;
    updateDocumentRank: (id: string, rank: string) => Promise<void>;
    setConflictState: (state: any) => void; // Using any for simplicity here, or define type
}

export function useSidebarDnD({
    documents,
    sortOrder,
    getSortedChildren,
    moveDocument,
    updateDocumentRank,
    setConflictState
}: UseSidebarDnDProps) {
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

        if (sortOrder === 'manual') {
            if (isFolder) {
                if (y < height * 0.25) {
                    setDropPos('before');
                    setDragOverId(id);
                } else if (y > height * 0.75) {
                    setDropPos('after');
                    setDragOverId(id);
                } else {
                    setDropPos('inside');
                    setDragOverId(id);
                }
            } else {
                if (y < height * 0.5) {
                    setDropPos('before');
                    setDragOverId(id);
                } else {
                    setDropPos('after');
                    setDragOverId(id);
                }
            }
        } else {
            if (isFolder) {
                setDragOverId(id);
                setDropPos('inside');
            }
        }

        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(null);
        setDropPos(null);
    };

    const handleDrop = async (e: React.DragEvent, targetId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(null);
        setDropPos(null);

        if (!draggedId || draggedId === targetId) return;

        const draggedDoc = documents.find(d => d.id === draggedId);
        if (!draggedDoc) return;

        let currentDropPos: 'before' | 'inside' | 'after' | null = null;

        if (targetId) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const y = e.clientY - rect.top;
            const height = rect.height;
            const targetDoc = documents.find(d => d.id === targetId);

            if (targetDoc) {
                if (sortOrder === 'manual') {
                    if (targetDoc.isFolder) {
                        if (y < height * 0.25) currentDropPos = 'before';
                        else if (y > height * 0.75) currentDropPos = 'after';
                        else currentDropPos = 'inside';
                    } else {
                        if (y < height * 0.5) currentDropPos = 'before';
                        else currentDropPos = 'after';
                    }
                } else {
                    if (targetDoc.isFolder) currentDropPos = 'inside';
                }
            }
        }

        if (sortOrder === 'manual' && targetId && currentDropPos && currentDropPos !== 'inside') {
            const targetDoc = documents.find(d => d.id === targetId);
            if (targetDoc) {
                if (draggedDoc.parentId !== targetDoc.parentId) {
                    await moveDocument(draggedId, targetDoc.parentId);
                }

                const siblings = getSortedChildren(targetDoc.parentId).filter(d => d.id !== draggedId);
                const tIdx = siblings.findIndex(d => d.id === targetId);

                let prevRankStr = '0';
                let nextRankStr = '1000';

                if (currentDropPos === 'before') {
                    const prev = siblings[tIdx - 1];
                    if (prev?.rank) prevRankStr = prev.rank;
                    if (targetDoc.rank) nextRankStr = targetDoc.rank;
                } else {
                    if (targetDoc.rank) prevRankStr = targetDoc.rank;
                    const next = siblings[tIdx + 1];
                    if (next?.rank) nextRankStr = next.rank;
                    else {
                        nextRankStr = (parseFloat(prevRankStr) + 10).toString();
                    }
                }

                const pVal = parseFloat(prevRankStr);
                const nVal = parseFloat(nextRankStr);
                const newRank = ((pVal + nVal) / 2).toFixed(4);

                await updateDocumentRank(draggedId, newRank);
                return;
            }
        }

        if (targetId) {
            const targetDoc = documents.find(d => d.id === targetId);
            if (targetDoc && targetDoc.isFolder && (currentDropPos === 'inside' || !currentDropPos)) {
                const siblings = documents.filter(d => d.parentId === targetId && d.id !== draggedId);
                let candidate = draggedDoc.title;

                if (siblings.some(s => s.title === candidate)) {
                    let counter = 1;
                    while (siblings.some(s => s.title === candidate)) {
                        candidate = `${draggedDoc.title} (${counter})`;
                        counter++;
                    }

                    setConflictState({
                        isOpen: true,
                        draggedId: draggedId,
                        targetId: targetId,
                        initialName: candidate
                    });
                    return;
                }

                await moveDocument(draggedId, targetId);
                return;
            }
        } else {
            await moveDocument(draggedId, null);
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
