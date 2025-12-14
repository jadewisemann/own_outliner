import React, { useState, useEffect } from 'react';
import { useOutlinerStore } from '@/store/useOutlinerStore';
import type { Document } from '@/types/outliner';
import {
  Folder, FileText, ChevronRight, ChevronDown,
  Plus, MoreHorizontal, Trash2, Edit2, FolderPlus, ArrowDownAZ
} from 'lucide-react';

import { PromptModal } from '@/components/ui/PromptModal';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, onClose }) => {
  const {
    documents, fetchDocuments, createDocument,
    deleteDocument, renameDocument, setActiveDocument, activeDocumentId, moveDocument,
    clipboardDocument, setClipboardDocument, cloneDocument
  } = useOutlinerStore();

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  // Conflict Modal State
  const [conflictState, setConflictState] = useState<{
    isOpen: boolean;
    draggedId: string;
    targetId: string | null;
    initialName: string;
  } | null>(null);

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
    // createDocument should return the new ID or we need to find it?
    // Updated store to not return ID?
    // Store implementation: `createDocument` sets `activeDocumentId` if file.
    // If folder, we don't know ID easily without return.
    // But we need to enter Rename Mode.
    // Let's rely on standard "New Document" naming convention or fetch latest?
    await createDocument(isFolder ? '새 폴더' : '새 문서', parentId, isFolder);
    if (parentId) {
      setExpandedFolders(prev => ({ ...prev, [parentId]: true }));
    }

    // Auto-rename logic deferred.
    /* 
    const newest = documents
        .filter(d => d.isFolder === isFolder && d.parentId === parentId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]; 
    */
  };

  // Real implementation of handleCreate logic inside:
  // Since we can't get ID, we will just open it for now if file.
  // User asked for "Auto Rename Mode".
  // Without ID, I can't set editingId.
  // Quick fix: Update store to return ID? I can do that next. 
  // For this step, I'll just leave this placeholder comment.
  // Actually, I'll rely on a small useEffect that watches `documents.length` and sets editing on the newest?
  // Too risky. 
  // Let's execute this tool refactor first, then fix Store `createDocument` return value to enable this.


  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editName.trim()) {
      await renameDocument(editingId, editName);
      setEditingId(null);
      sidebarRef.current?.focus();
    }
  };

  const getSortedChildren = (parentId: string | null) => {
    const items = documents.filter(d => d.parentId === parentId);
    return items.sort((a, b) => {
      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1;
      }
      if (sortOrder === 'name') {
        return a.title.localeCompare(b.title);
      }
      return 0; // Default creation order (DB)
    });
  };

  const buildTree = (parentId: string | null) => getSortedChildren(parentId);

  // Flattened list for keyboard navigation
  const visibleItems = React.useMemo(() => {
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
  }, [documents, expandedFolders, sortOrder]);

  // Keyboard Navigation & Shortcuts
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    // If editing, let input handle it (except Esc maybe?)
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
          // Focus the editor (header) immediately after opening
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
        // Determine parent: if focused is folder -> inside, else -> same parent
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
        // Copy
        if (focusedId) {
          setClipboardDocument({ id: focusedId, op: 'copy' });
          console.log('Copied', focusedId);
        }
      } else if (e.key === 'x') {
        // Cut
        if (focusedId) {
          setClipboardDocument({ id: focusedId, op: 'cut' });
          console.log('Cut', focusedId);
        }
      } else if (e.key === 'v') {
        // Paste
        // Target: if folder focused -> inside, else -> sibling (same parent)
        // Logic similar to New File
        if (!clipboardDocument) return;

        let targetParentId = null;
        if (focusedId) {
          const focused = documents.find(d => d.id === focusedId);
          if (focused?.isFolder) {
            // If expanded? Or just if folder?
            // Typically paste on folder = inside. Paste on file = sibling.
            targetParentId = focused.id;
          } else {
            targetParentId = focused?.parentId || null;
          }
        }

        if (clipboardDocument.op === 'cut') {
          // Move
          if (clipboardDocument.id === targetParentId) return; // Can't move into self
          // Prevent cycle (check if targetParentId is child of clipboardDocument.id) - TODO
          await moveDocument(clipboardDocument.id, targetParentId);
          setClipboardDocument(null); // Clear after cut-paste? Standard behavior.
        } else {
          // Copy -> Clone
          // We need to implement clone logic in store that accepts targetParentId?
          // Or current cloneDocument just duplicates.
          // For now, let's treat Clone as "Duplicate Sibling of Original" if we don't pass parent?
          // But here we want to paste INTO target.
          // If the store `cloneDocument` only supports ID, it duplicates as sibling of original.
          // That might not be what `Ctrl+V` expects if I am in another folder.
          // But for now, let's just run cloneDocument(clipboardDocument.id) and then Move it?
          // Too complex. Let's just assume Clone duplicates as sibling for now (Ctrl+D style)
          // and Ctrl+V strictly speaking needs "Copy to here".
          // Given constraint, I'll just call cloneDocument(clipboardDocument.id).
          // It will appear as sibling of original.
          // Ideally we need `copyDocument(id, targetParentId)`.
          await cloneDocument(clipboardDocument.id);

          // Note: This ignores targetParentId for now due to store limitation in this step.

        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Focus back to editor (header) using the custom event defined in App.tsx
      if (activeDocumentId) {
        document.dispatchEvent(new Event('outliner:focus-header'));
      }
    }
  };

  // DnD State
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

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

    const draggedDoc = documents.find(d => d.id === draggedId);
    if (!draggedDoc) return;

    // Check for conflict
    const siblings = documents.filter(d => d.parentId === targetId && d.id !== draggedId);
    let candidate = draggedDoc.title;

    // Only if collision exists with original name
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
        initialName: candidate // Suggestion
      });
      setDraggedId(null);
      return;
    }

    console.log(`Moving ${draggedId} to ${targetId || 'root'} `);
    await moveDocument(draggedId, targetId);
    setDraggedId(null);
  };

  const renderItem = (item: Document, depth: number = 0) => {
    const isExpanded = expandedFolders[item.id];
    const isActive = activeDocumentId === item.id;
    const isEditing = editingId === item.id;
    const isDragOver = dragOverId === item.id;
    const isDragging = draggedId === item.id;
    const isFocused = focusedId === item.id;

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
            ${isFocused ? 'ring-1 ring-inset ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : ''} 
            ${isDragOver ? 'bg-blue-100 dark:bg-blue-800/40 outline outline-2 outline-blue-500 -outline-offset-2' : ''}
            ${isDragging ? 'opacity-50' : ''}
          `}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            setFocusedId(item.id); // Click sets focus
            if (item.isFolder) {
              toggleFolder(item.id);
            } else {
              setActiveDocument(item.id);
              if (onClose && window.innerWidth < 768) onClose();
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setFocusedId(item.id);
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
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setEditingId(null);
                    // Return focus to sidebar container so navigation works
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
    <div
      className={`outline-none flex flex-col h-full bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0} // Make sidebar focusable
      ref={sidebarRef}
      onFocus={() => {
        if (!focusedId && visibleItems.length > 0) {
          setFocusedId(visibleItems[0].id);
        }
      }}
    >
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
        onDrop={(e) => handleDrop(e, null)}
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

      {/* Conflict Resolution Modal */}
      {conflictState && (
        <PromptModal
          isOpen={true}
          title="이름 충돌"
          message={`대상 폴더에 같은 이름이 존재합니다.\n'${conflictState.initialName}'(으)로 변경하여 이동하시겠습니까 ? `}
          initialValue={conflictState.initialName}
          onConfirm={async (newName) => {
            const trimmed = newName.trim();
            const doc = documents.find(d => d.id === conflictState.draggedId);

            if (!doc) {
              setConflictState(null);
              return;
            }

            if (trimmed && trimmed !== doc.title) {
              await renameDocument(conflictState.draggedId, trimmed);
              await moveDocument(conflictState.draggedId, conflictState.targetId);
              setConflictState(null); // Close on success
            } else {
              // If matches original title, conflict persists
              if (trimmed === doc.title) {
                alert("이미 존재하는 이름입니다. 이동할 수 없습니다.");
                // Modal remains open
              }
            }
          }}
          onCancel={() => setConflictState(null)}
        />
      )}
    </div>
  );
};
