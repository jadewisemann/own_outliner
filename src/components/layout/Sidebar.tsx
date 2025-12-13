import React, { useState, useEffect } from 'react';
import { useOutlinerStore } from '@/store/useOutlinerStore';
import type { Document } from '@/types/outliner';
import {
  Folder, FileText, ChevronRight, ChevronDown,
  Plus, MoreHorizontal, Trash2, Edit2, FolderPlus, ArrowDownAZ
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, onClose }) => {
  const {
    documents, fetchDocuments, createDocument,
    deleteDocument, renameDocument, setActiveDocument, activeDocumentId
  } = useOutlinerStore();

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Sorting State
  const [sortOrder, setSortOrder] = useState<'none' | 'name'>('none');

  // import { ArrowDownAZ, ... } from 'lucide-react'; // Need to update imports

  useEffect(() => {
    fetchDocuments();
  }, []);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreate = async (isFolder: boolean, parentId: string | null = null) => {
    await createDocument(isFolder ? '새 폴더' : '새 문서', parentId, isFolder);
    if (parentId) {
      setExpandedFolders(prev => ({ ...prev, [parentId]: true }));
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editName.trim()) {
      await renameDocument(editingId, editName);
      setEditingId(null);
    }
  };

  const buildTree = (parentId: string | null) => {
    const items = documents.filter(d => d.parentId === parentId);

    // Always sort folders first for better UX, then optionally by name
    return items.sort((a, b) => {
      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1; // Folders always on top
      }

      if (sortOrder === 'name') {
        return a.title.localeCompare(b.title);
      }

      // Default ('none'): maintain DB order (likely creation/update)
      // Or explicit undefined order.
      return 0;
    });
  };

  // DnD State
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const { moveDocument } = useOutlinerStore();

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Set transparent image or rely on default
  };

  const handleDragOver = (e: React.DragEvent, id: string, isFolder: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedId || draggedId === id) return;

    // Prevent dropping into self or children (simple check: if I am your parent... wait, need full tree check for cycle)
    // For now, just simplistic check
    if (isFolder) {
      setDragOverId(id);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    if (!draggedId || draggedId === targetId) return;

    console.log(`Moving ${draggedId} to ${targetId || 'root'}`);
    await moveDocument(draggedId, targetId);
    setDraggedId(null);
  };

  const renderItem = (item: Document, depth: number = 0) => {
    const isExpanded = expandedFolders[item.id];
    const isActive = activeDocumentId === item.id;
    const isEditing = editingId === item.id;
    const isDragOver = dragOverId === item.id;
    const isDragging = draggedId === item.id;

    return (
      <div key={item.id} className="select-none">
        <div
          draggable={!isEditing}
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={(e) => handleDragOver(e, item.id, item.isFolder)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item.id)}
          className={`flex items-center group px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer 
            ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}
            ${isDragOver ? 'bg-blue-100 dark:bg-blue-800/40 outline outline-2 outline-blue-500 -outline-offset-2' : ''}
            ${isDragging ? 'opacity-50' : ''}
          `}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (item.isFolder) {
              toggleFolder(item.id);
            } else {
              setActiveDocument(item.id);
              if (onClose && window.innerWidth < 768) onClose();
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ id: item.id, x: e.clientX, y: e.clientY });
          }}
        >
          <span className="mr-1 text-neutral-400">
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
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => setEditingId(null)}
                className="w-full bg-white dark:bg-neutral-800 border border-blue-500 rounded px-1 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </form>
          ) : (
            <span className="text-sm truncate flex-1">{item.title}</span>
          )}

          <button
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu({ id: item.id, x: e.clientX, y: e.clientY });
            }}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>

        {item.isFolder && isExpanded && (
          <div>
            {buildTree(item.id).map(child => renderItem(child, depth + 1))}
            {/* Empty folder placeholder or add button inside? */}
            {buildTree(item.id).length === 0 && (
              <div className="text-xs text-neutral-400 py-1 pl-[32px]" style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }}>
                (비어 있음)
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 ${className}`}>
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
        <span className="font-semibold text-sm text-neutral-600 dark:text-neutral-300">내 문서</span>
        <div className="flex gap-1">
          <button
            onClick={() => setSortOrder(prev => prev === 'none' ? 'name' : 'none')}
            className={`p-1 rounded text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 ${sortOrder === 'name' ? 'bg-neutral-200 dark:bg-neutral-700 text-blue-500' : ''}`}
            title={sortOrder === 'name' ? '정렬 해제' : '가나다순 정렬'}
          >
            <ArrowDownAZ size={16} />
          </button>
          <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1 self-center" />
          <button
            onClick={() => handleCreate(true)}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500"
            title="새 폴더"
          >
            <FolderPlus size={16} />
          </button>
          <button
            onClick={() => handleCreate(false)}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500"
            title="새 문서"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto py-2"
        onDragOver={(e) => {
          e.preventDefault();
          // Allow dropping on empty space to move to root
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => {
          e.preventDefault();
          // If dropped on root container (not handled by item stopPropagation), move to root
          if (draggedId) {
            moveDocument(draggedId, null);
            setDraggedId(null);
          }
        }}
      >
        {buildTree(null).map(item => renderItem(item))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
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
                setContextMenu(null);
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
                    setContextMenu(null);
                  }}
                >
                  <Plus size={13} /> 문서 추가
                </button>
                <button
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                  onClick={() => {
                    handleCreate(true, contextMenu.id);
                    setContextMenu(null);
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
                setContextMenu(null);
              }}
            >
              <Trash2 size={13} /> 삭제
            </button>
          </div>
        </>
      )}
    </div>
  );
};
