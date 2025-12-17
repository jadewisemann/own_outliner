import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useOutlinerStore } from '@/store/outlinerStore';
import type { Document, ConflictState } from '@/types/outliner';
import { useSidebarSort } from '@/hooks/useSidebarSort';
import { useSidebarDragAndDrop } from '@/hooks/useSidebarDragAndDrop';

interface SidebarContextType {
    // Data
    documents: Document[];

    // Sorting
    sortOrder: 'none' | 'name' | 'manual';
    setSortOrder: (order: 'none' | 'name' | 'manual') => void;
    separateFolders: boolean;
    setSeparateFolders: (separate: boolean) => void;
    getSortedChildren: (parentId: string | null) => Document[];

    // Folder Expansion
    expandedFolders: Record<string, boolean>;
    toggleFolder: (id: string) => void;
    setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

    // Selection & Focus
    activeDocumentId: string | null;
    setActiveDocument: (id: string | null) => void;
    focusedId: string | null;
    setFocusedId: (id: string | null) => void;

    // Editing
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    editName: string;
    setEditName: (name: string) => void;
    handleRename: (e: React.FormEvent) => Promise<void>;

    // Context Menu
    contextMenu: { id: string, x: number, y: number } | null;
    setContextMenu: (menu: { id: string, x: number, y: number } | null) => void;

    // Conflict state
    conflictState: ConflictState | null;
    setConflictState: (state: ConflictState | null) => void;


    // DnD
    draggedId: string | null;
    dragOverId: string | null;
    dropPos: 'before' | 'inside' | 'after' | null;
    handleDragStart: (e: React.DragEvent, id: string) => void;
    handleDragOver: (e: React.DragEvent, id: string, isFolder: boolean) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent, targetId: string | null) => void;

    // Actions
    handleCreate: (isFolder: boolean, parentId?: string | null) => Promise<void>;
    deleteDocument: (id: string) => Promise<void>;

    // Refs
    sidebarRef: React.RefObject<HTMLDivElement | null>;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

import { useSidebarSelection } from '@/hooks/useSidebarSelection';
import { useSidebarFolder } from '@/hooks/useSidebarFolder';
import { useSidebarEditing } from '@/hooks/useSidebarEditing';

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { documents, fetchDocuments, moveDocument, updateDocumentRank } = useOutlinerStore();

    // 1. Domain Hooks
    const { sortOrder, setSortOrder, separateFolders, setSeparateFolders, getSortedChildren } = useSidebarSort(documents);
    const { expandedFolders, toggleFolder, setExpandedFolders, expandFolder } = useSidebarFolder();
    const { activeDocumentId, setActiveDocument, focusedId, setFocusedId } = useSidebarSelection();

    // Pass expandFolder as callback to handleCreate so new items in folders are visible
    const {
        editingId, setEditingId, editName, setEditName, handleRename,
        handleCreate: baseHandleCreate, deleteDocument, sidebarRef
    } = useSidebarEditing();

    const handleCreateWrapper = useCallback(async (isFolder: boolean, parentId: string | null = null) => {
        await baseHandleCreate(isFolder, parentId, (pid) => {
            if (pid) expandFolder(pid);
        });
    }, [baseHandleCreate, expandFolder]);

    const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);
    const [conflictState, setConflictState] = useState<ConflictState | null>(null);

    const {
        draggedId, dragOverId, dropPos,
        handleDragStart, handleDragOver, handleDragLeave, handleDrop
    } = useSidebarDragAndDrop({
        documents,
        sortOrder,
        getSortedChildren,
        moveDocument,
        updateDocumentRank,
        setConflictState
    });

    useEffect(() => {
        fetchDocuments();
    }, []);

    const value = React.useMemo(() => ({
        documents,
        sortOrder, setSortOrder, separateFolders, setSeparateFolders, getSortedChildren,
        expandedFolders, toggleFolder, setExpandedFolders,
        activeDocumentId, setActiveDocument,
        focusedId, setFocusedId,
        editingId, setEditingId, editName, setEditName, handleRename,
        contextMenu, setContextMenu,
        conflictState, setConflictState,
        draggedId, dragOverId, dropPos,
        handleDragStart, handleDragOver, handleDragLeave, handleDrop,
        handleCreate: handleCreateWrapper, deleteDocument,
        sidebarRef
    }), [
        documents,
        sortOrder, setSortOrder, separateFolders, setSeparateFolders, getSortedChildren,
        expandedFolders, toggleFolder, setExpandedFolders,
        activeDocumentId, setActiveDocument,
        focusedId, setFocusedId,
        editingId, setEditingId, editName, setEditName, handleRename,
        contextMenu,
        conflictState,
        draggedId, dragOverId, dropPos,
        handleDragStart, handleDragOver, handleDragLeave, handleDrop,
        handleCreateWrapper, deleteDocument
    ]);

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebarContext = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebarContext must be used within a SidebarProvider');
    }
    return context;
};
