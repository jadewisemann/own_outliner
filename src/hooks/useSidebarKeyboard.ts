import React, { useMemo } from 'react';
import { useSidebarContext } from '@/components/layout/sidebar/SidebarContext';
import { useOutlinerStore } from '@/store/useOutlinerStore';
import type { Document } from '@/types/outliner';

export const useSidebarKeyboard = () => {
    const {
        documents,
        expandedFolders,
        getSortedChildren,
        setExpandedFolders,
        focusedId,
        setFocusedId,
        setActiveDocument,
        editingId,
        setEditingId,
        setEditName,
        activeDocumentId,
        handleCreate,
        sortOrder
    } = useSidebarContext();

    const {
        moveDocument,
        cloneDocument,
        clipboardDocument,
        setClipboardDocument
    } = useOutlinerStore();

    // Flattened list for keyboard navigation
    const visibleItems = useMemo(() => {
        const list: Document[] = [];
        const traverse = (parentId: string | null) => {
            const children = getSortedChildren(parentId);
            for (const child of children) {
                list.push(child);
                if (child.isFolder && expandedFolders[child.id]) {
                    traverse(child.id);
                }
            }
        };
        traverse(null);
        return list;
    }, [documents, expandedFolders, sortOrder, getSortedChildren]);

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (editingId) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const idx = visibleItems.findIndex(i => i.id === focusedId);
            const next = visibleItems[idx + 1] || visibleItems[0];
            if (next) setFocusedId(next.id);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const idx = visibleItems.findIndex(i => i.id === focusedId);
            const prev = visibleItems[idx - 1] || visibleItems[visibleItems.length - 1];
            if (prev) setFocusedId(prev.id);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (focusedId) {
                const item = documents.find(d => d.id === focusedId);
                if (item?.isFolder && !expandedFolders[item.id]) {
                    setExpandedFolders(prev => ({ ...prev, [item.id]: true }));
                }
            }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (focusedId) {
                const item = documents.find(d => d.id === focusedId);
                if (item?.isFolder && expandedFolders[item.id]) {
                    setExpandedFolders(prev => ({ ...prev, [item.id]: false }));
                } else if (item?.parentId) {
                    setFocusedId(item.parentId);
                }
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (focusedId) {
                if (e.ctrlKey || e.metaKey) {
                    await setActiveDocument(focusedId);
                    document.dispatchEvent(new Event('outliner:focus-header'));
                } else {
                    // Rename
                    const item = documents.find(d => d.id === focusedId);
                    if (item) {
                        setEditingId(item.id);
                        setEditName(item.title);
                    }
                }
            }
        } else if ((e.ctrlKey || e.metaKey)) {
            if (e.key === 'n') {
                e.preventDefault();
                const isFolder = e.shiftKey;
                let targetParentId = null;
                if (focusedId) {
                    const focused = documents.find(d => d.id === focusedId);
                    if (focused) {
                        if (focused.isFolder && expandedFolders[focused.id]) {
                            targetParentId = focused.id;
                        } else {
                            targetParentId = focused.parentId;
                        }
                    }
                }
                await handleCreate(isFolder, targetParentId);
            } else if (e.key === 'c') {
                if (focusedId) {
                    setClipboardDocument({ id: focusedId, op: 'copy' });
                    console.log('Copied', focusedId);
                }
            } else if (e.key === 'x') {
                if (focusedId) {
                    setClipboardDocument({ id: focusedId, op: 'cut' });
                    console.log('Cut', focusedId);
                }
            } else if (e.key === 'v') {
                if (!clipboardDocument) return;

                let targetParentId = null;
                if (focusedId) {
                    const focused = documents.find(d => d.id === focusedId);
                    if (focused?.isFolder) {
                        targetParentId = focused.id;
                    } else {
                        targetParentId = focused?.parentId || null;
                    }
                }

                if (clipboardDocument.op === 'cut') {
                    if (clipboardDocument.id === targetParentId) return;
                    await moveDocument(clipboardDocument.id, targetParentId);
                    setClipboardDocument(null);
                } else {
                    await cloneDocument(clipboardDocument.id);
                }
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            if (activeDocumentId) {
                document.dispatchEvent(new Event('outliner:focus-header'));
            }
        }
    };

    return { handleKeyDown, visibleItems };
};
