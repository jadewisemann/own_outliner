import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOutlinerStore } from '@/store/outliner';
// NodeId import removed

interface InlineSearchPopupProps {
    mode: 'node' | 'document';
    query: string;
    position: { top: number; left: number };
    onSelect: (id: string, label: string) => void;
    onClose: () => void;
}

export const InlineSearchPopup: React.FC<InlineSearchPopupProps> = ({ mode, query, position, onSelect, onClose }) => {
    const nodes = useOutlinerStore(state => state.nodes);
    const documents = useOutlinerStore(state => state.documents);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    const getPath = (docId: string) => {
        const path: string[] = [];
        let current = documents.find(d => d.id === docId);
        // Start from parent
        let parentId = current?.parentId;

        while (parentId) {
            const parent = documents.find(d => d.id === parentId);
            if (parent) {
                path.unshift(parent.title);
                parentId = parent.parentId;
            } else {
                break;
            }
        }
        return path.join(' / ');
    };

    const results = useMemo(() => {
        const lowerQuery = query.toLowerCase();

        if (mode === 'document') {
            if (!query) {
                // Hierarchical Browsing Mode
                return documents
                    .filter(doc => doc.parentId === currentFolderId)
                    .sort((a, b) => {
                        if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
                        return a.title.localeCompare(b.title);
                    })
                    .map(doc => ({
                        id: doc.id,
                        content: doc.title,
                        type: 'document',
                        path: getPath(doc.id),
                        isFolder: doc.isFolder // Pass isFolder for navigation check
                    }));
            }

            // Flat Search Mode
            return documents
                .filter(doc => doc.title.toLowerCase().includes(lowerQuery))
                .slice(0, 10)
                .map(doc => ({
                    id: doc.id,
                    content: doc.title,
                    type: 'document',
                    path: getPath(doc.id),
                    isFolder: doc.isFolder
                }));
        } else {
            // Node Mode (Flat)
            return Object.values(nodes)
                .filter(node => node.content.toLowerCase().includes(lowerQuery) && node.content.trim().length > 0)
                .slice(0, 10)
                .map(node => ({ ...node, type: 'node', path: '', isFolder: false }));
        }
    }, [nodes, documents, query, mode, currentFolderId]);

    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query, mode]);

    useEffect(() => {
        if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex]?.scrollIntoView({
                block: 'nearest',
            });
        }
    }, [selectedIndex]);

    const handleSelect = (id: string, title: string) => {
        if (mode === 'document') {
            const pathStr = getPath(id).replace(/ \/ /g, '/');
            if (pathStr) {
                // Nested document: Use qualified path with alias
                // [[Folder/Doc|Doc]]
                onSelect(id, `${pathStr}/${title}|${title}`);
                return;
            }
        }
        onSelect(id, title);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'ArrowRight') {
                // Drill down if folder
                if (mode === 'document' && !query) {
                    const item = results[selectedIndex];
                    // item type definition in results map has isFolder
                    // We need to check if we can access it.
                    // The mapped object isn't typed explicitly but JS allows access.
                    if (item && (item as any).isFolder) {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentFolderId(item.id);
                        setSelectedIndex(0);
                    }
                }
            } else if (e.key === 'ArrowLeft') {
                // Go Up
                if (mode === 'document' && !query && currentFolderId) {
                    e.preventDefault();
                    e.stopPropagation();
                    const curr = documents.find(d => d.id === currentFolderId);
                    setCurrentFolderId(curr?.parentId || null);
                    setSelectedIndex(0);
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                if (selectedIndex >= 0 && selectedIndex < results.length) {
                    const item = results[selectedIndex];
                    // If folder selected in browse mode, Enter also drills down? Or selects?
                    // User said "Right arrow enters... Left arrow up.. Enter selects."
                    // But if I select a folder link `[[Folder]]`? That's valid.
                    // But usually we link to Docs.
                    // If I hit Enter on a Folder, does it drill down or insert link?
                    // User: "Enter is select".
                    // However, linking to a Folder is possible.
                    // If I want to drill down with Enter, I'd say so.
                    // For now, strict: Right Arrow drills down, Enter selects (inserts link).
                    handleSelect(item.id, item.content);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [results, selectedIndex, onSelect, onClose]);

    if (results.length === 0 && query) return null; // Hide if no results in Search Mode. Show empty in Browse mode?
    // If browse mode and empty folder, show nothing or "Empty"?
    // Logic: if results.length === 0, return null hides it.
    // If I am browsing an empty folder, popup disappears. That's confusing.
    // Should show "No items" or keep open?
    // Let's allow empty render if browsing.
    if (results.length === 0 && query) return null;

    return (
        <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-72 max-h-56 overflow-y-auto font-sans"
            style={{ top: position.top + 5, left: position.left }}
        >
            {results.map((item, index) => (
                <div
                    key={item.id}
                    ref={(el) => { itemRefs.current[index] = el; }}
                    className={`px-3 py-2 text-sm cursor-pointer flex flex-col justify-center ${index === selectedIndex ? 'bg-blue-100' : 'hover:bg-gray-50'
                        }`}
                    onClick={() => handleSelect(item.id, item.content)}
                    onMouseEnter={() => setSelectedIndex(index)}
                >
                    {item.path && (
                        <div className={`text-xs truncate mb-0.5 ${index === selectedIndex ? 'text-blue-600' : 'text-gray-400'}`}>
                            {item.path}
                        </div>
                    )}
                    <div className="flex items-center justify-between w-full">
                        <span className={`font-medium truncate ${index === selectedIndex ? 'text-blue-900' : 'text-gray-800'}`}>
                            {item.content || 'Untitled'}
                        </span>
                        {mode === 'document' && <span className="text-xs text-gray-400 ml-2 shrink-0">Doc</span>}
                    </div>
                </div>
            ))}
        </div>
    );
};
