import { useState, useCallback, useRef } from 'react';
import { useOutlinerStore } from '@/store/outliner';

export function useSidebarEditing() {
    const { createDocument, renameDocument, deleteDocument } = useOutlinerStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const sidebarRef = useRef<HTMLDivElement>(null);

    const handleCreate = useCallback(async (isFolder: boolean, parentId: string | null = null, onCreated?: (parentId: string | null) => void) => {
        await createDocument(isFolder ? '새 폴더' : '새 문서', parentId, isFolder);
        if (onCreated) {
            onCreated(parentId);
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

    return {
        editingId,
        setEditingId,
        editName,
        setEditName,
        handleCreate,
        handleRename,
        deleteDocument,
        sidebarRef
    };
}
