import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useOutlinerStore } from '@/store/useOutlinerStore';
import type { Document } from '@/types/outliner';
import { useSidebarSort } from '@/hooks/useSidebarSort';
import { useSidebarDnD } from '@/hooks/useSidebarDnD';

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
    conflictState: {
        isOpen: boolean;
        draggedId: string;
        targetId: string | null;
        initialName: string;
    } | null;
    setConflictState: (state: any) => void;

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

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        documents, fetchDocuments, createDocument,
        deleteDocument, renameDocument, setActiveDocument, activeDocumentId, moveDocument,
        updateDocumentRank
    } = useOutlinerStore();

    const { sortOrder, setSortOrder, separateFolders, setSeparateFolders, getSortedChildren } = useSidebarSort(documents);
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
    const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [focusedId, setFocusedId] = useState<string | null>(null);

    // Conflict Modal State
    const [conflictState, setConflictState] = useState<{
        isOpen: boolean;
        draggedId: string;
        targetId: string | null;
        initialName: string;
    } | null>(null);

    const sidebarRef = React.useRef<HTMLDivElement>(null);

    const {
        draggedId, dragOverId, dropPos,
        handleDragStart, handleDragOver, handleDragLeave, handleDrop
    } = useSidebarDnD({
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

    const toggleFolder = useCallback((id: string) => {
        setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const handleCreate = useCallback(async (isFolder: boolean, parentId: string | null = null) => {
        await createDocument(isFolder ? '새 폴더' : '새 문서', parentId, isFolder);
        if (parentId) {
            setExpandedFolders(prev => ({ ...prev, [parentId]: true }));
        }
    }, [createDocument]);

    const handleRename = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId && editName.trim()) {
            await renameDocument(editingId, editName);
            setEditingId(null);
            sidebarRef.current?.focus();
        }
    }, [editingId, editName, renameDocument]);

    const value = {
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
        handleCreate, deleteDocument,
        sidebarRef
    };

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
