import React from 'react';
import {
    Trash2, Edit2, FolderPlus, Plus
} from 'lucide-react';
import { useSidebarContext } from './SidebarContext';

export const SidebarContextMenu: React.FC = () => {
    const {
        contextMenu, setContextMenu,
        documents,
        setEditingId, setEditName,
        handleCreate,
        deleteDocument
    } = useSidebarContext();

    if (!contextMenu) return null;

    const handleClose = () => setContextMenu(null);

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={handleClose} />
            <div
                className="fixed z-50 bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700 rounded-lg py-1 w-32"
                style={{ top: contextMenu.y, left: contextMenu.x }}
            >
                <button
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                    onClick={() => {
                        const doc = documents.find(d => d.id === contextMenu.id);
                        if (doc) {
                            setEditingId(doc.id);
                            setEditName(doc.title);
                        }
                        handleClose();
                    }}
                >
                    <Edit2 size={13} /> 이름 변경
                </button>

                {documents.find(d => d.id === contextMenu.id)?.isFolder && (
                    <>
                        <button
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                            onClick={() => {
                                handleCreate(false, contextMenu.id);
                                handleClose();
                            }}
                        >
                            <Plus size={13} /> 문서 추가
                        </button>
                        <button
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                            onClick={() => {
                                handleCreate(true, contextMenu.id);
                                handleClose();
                            }}
                        >
                            <FolderPlus size={13} /> 폴더 추가
                        </button>
                    </>
                )}

                <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
                <button
                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                    onClick={() => {
                        deleteDocument(contextMenu.id);
                        handleClose();
                    }}
                >
                    <Trash2 size={13} /> 삭제
                </button>
            </div>
        </>
    );
};
