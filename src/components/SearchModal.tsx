import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOutlinerStore } from '../store/outlinerStore';
import type { NodeId } from '../types/outliner';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const nodes = useOutlinerStore(state => state.nodes);
    const setFocus = useOutlinerStore(state => state.setFocus);
    const setHoistedNode = useOutlinerStore(state => state.setHoistedNode);

    const inputRef = useRef<HTMLInputElement>(null);

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    // Filter nodes
    const results = useMemo(() => {
        if (!query.trim()) return [];

        // Simple substring match for now. Usually ignore case.
        // Convert nodes object to array
        const allNodes = Object.values(nodes);
        const q = query.toLowerCase();

        return allNodes
            .filter(node => node.content && node.content.toLowerCase().includes(q))
            .slice(0, 50); // Limit to 50 results
    }, [nodes, query]);

    // Handle keys
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (results.length > 0 && results[selectedIndex]) {
                const target = results[selectedIndex];
                selectResult(target.id);
            }
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
            return;
        }
    };

    const selectResult = (id: NodeId) => {
        setHoistedNode(null);

        expandParents(id);

        setTimeout(() => {
            setFocus(id, 0); // Focus at start
        }, 0);

        onClose();
    };

    const expandParents = (targetId: NodeId) => {
        let current = nodes[targetId];
        const parentsToExpand: NodeId[] = [];

        while (current && current.parentId) {
            const parent = nodes[current.parentId];
            if (parent && parent.isCollapsed) {
                parentsToExpand.push(parent.id);
            }
            current = parent;
        }

        const store = useOutlinerStore.getState();
        parentsToExpand.forEach(pid => {
            if (store.nodes[pid].isCollapsed) {
                store.toggleCollapse(pid);
            }
        });
    };

    if (!isOpen) return null;

    return (
        // Overlay
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-[20vh] backdrop-blur-sm"
            onMouseDown={onClose}>
            {/* Modal */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden ring-1 ring-gray-900/5 filter"
                onMouseDown={e => e.stopPropagation()}>

                {/* Search Input */}
                <div className="border-b px-4 py-3 flex items-center gap-2">
                    <span className="text-gray-400">🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Search notes..."
                        className="flex-1 outline-none text-lg text-gray-800 placeholder:text-gray-400"
                        autoFocus
                    />
                    <div className="text-xs text-gray-400 px-1.5 py-0.5 border rounded bg-gray-50">Esc</div>
                </div>

                {/* Results */}
                {results.length > 0 ? (
                    <div className="max-h-[50vh] overflow-y-auto py-2">
                        {results.map((node, index) => (
                            <div
                                key={node.id}
                                onClick={() => selectResult(node.id)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`px-4 py-2 cursor-pointer flex items-center justify-between group ${index === selectedIndex ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <div className="truncate text-sm font-medium">
                                    {node.content || <span className="italic opacity-50">Empty</span>}
                                </div>
                                {/* Breadcrumb hint? (Parent name) */}
                                {node.parentId && nodes[node.parentId] && (
                                    <div className={`text-xs ml-4 max-w-[30%] truncate ${index === selectedIndex ? 'text-blue-200' : 'text-gray-400'
                                        }`}>
                                        {nodes[node.parentId].content || 'Attributes...'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    query && (
                        <div className="p-8 text-center text-gray-500">
                            No results found for "{query}"
                        </div>
                    )
                )}

                {!query && (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        Type to search...
                    </div>
                )}

            </div>
        </div>
    );
};
