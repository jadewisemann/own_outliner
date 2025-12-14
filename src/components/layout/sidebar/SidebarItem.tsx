import React from 'react';
import type { Document } from '@/types/outliner';
import {
    Folder, FileText, ChevronRight, ChevronDown,
    MoreHorizontal, Edit2
} from 'lucide-react';
import { useSidebarContext } from './SidebarContext';

interface SidebarItemProps {
    item: Document;
    depth: number;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ item, depth }) => {
    const {
        expandedFolders, toggleFolder,
        activeDocumentId, setActiveDocument,
        editingId, setEditingId, editName, setEditName, handleRename,
        focusedId, setFocusedId,
        draggedId, dragOverId, dropPos,
        handleDragStart, handleDragOver, handleDragLeave, handleDrop,
        setContextMenu,
        sidebarRef
    } = useSidebarContext();

    const isExpanded = !!expandedFolders[item.id];
    const isActive = activeDocumentId === item.id;
    const isEditing = editingId === item.id;
    const isFocused = focusedId === item.id;
    const isDragOver = dragOverId === item.id;
    const isDragging = draggedId === item.id;

    // Helper to close sidebar on mobile (if we want to keep that logic generic?)
    // Or we keep it simple here.
    const handleItemClick = (i: Document) => {
        setFocusedId(i.id);
        if (i.isFolder) {
            toggleFolder(i.id);
        } else {
            setActiveDocument(i.id);
            if (window.innerWidth < 768) {
                // We'd need an onClose in context if we want to support this sidebar prop
                // Let's assume for now it's okay or add it to context later if critical.
            }
        }
    };

    return (
        <div
            draggable={!isEditing}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id, item.isFolder)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item.id)}
            className={`flex items-center group px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer relative
          ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}
          ${isFocused ? 'ring-1 ring-inset ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : ''} 
          ${isDragOver && dropPos === 'inside' ? 'bg-blue-100 dark:bg-blue-800/40 outline outline-2 outline-blue-500 -outline-offset-2' : ''}
          ${isDragging ? 'opacity-50' : ''}
        `}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => handleItemClick(item)}
            onContextMenu={(e) => {
                e.preventDefault();
                setFocusedId(item.id);
                setContextMenu({ id: item.id, x: e.clientX, y: e.clientY });
            }}
        >
            <span className="mr-1 text-neutral-400" onClick={(e) => {
                if (item.isFolder) {
                    e.stopPropagation();
                    toggleFolder(item.id);
                }
            }}>
                {item.isFolder ? (
                    isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                ) : <span className="w-3.5" />}
            </span>

            <span className="mr-2 text-neutral-500">
                {item.isFolder ? <Folder size={14} /> : <FileText size={14} />}
            </span>

            {isEditing ? (
                <form onSubmit={handleRename} className="flex-1">
                    <input
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => setEditingId(null)}
                        className="w-full bg-white dark:bg-neutral-800 border border-blue-500 rounded px-1 text-sm"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                e.stopPropagation();
                                setEditingId(null);
                                sidebarRef.current?.focus();
                            }
                        }}
                    />
                </form>
            ) : (
                <span className="text-sm truncate flex-1">{item.title}</span>
            )}

            <button
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded mr-1"
                title={item.isFolder ? "폴더 문서 열기" : "설정"}
                onClick={(e) => {
                    e.stopPropagation();
                    setFocusedId(item.id);
                    setContextMenu({ id: item.id, x: e.clientX, y: e.clientY });
                }}
            >
                <MoreHorizontal size={14} />
            </button>

            {item.isFolder && (
                <button
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                    title="폴더 문서 편집"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveDocument(item.id);
                    }}
                >
                    <Edit2 size={14} />
                </button>
            )}

            {isDragOver && dropPos === 'before' && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 pointer-events-none" />
            )}
            {isDragOver && dropPos === 'after' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 pointer-events-none" />
            )}

        </div>
    );
};
