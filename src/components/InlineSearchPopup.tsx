import React, { useState, useEffect, useMemo } from 'react';
import { useOutlinerStore } from '@/store/useOutlinerStore';
import type { NodeId } from '@/types/outliner';

interface InlineSearchPopupProps {
    query: string;
    position: { top: number; left: number };
    onSelect: (nodeId: NodeId, content: string) => void;
    onClose: () => void;
}

export const InlineSearchPopup: React.FC<InlineSearchPopupProps> = ({ query, position, onSelect, onClose }) => {
    const nodes = useOutlinerStore(state => state.nodes);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const results = useMemo(() => {
        if (!query) return [];
        const lowerQuery = query.toLowerCase();
        return Object.values(nodes)
            .filter(node => node.content.toLowerCase().includes(lowerQuery) && node.content.trim().length > 0)
            .slice(0, 10); // Limit to 10
    }, [nodes, query]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < results.length) {
                    onSelect(results[selectedIndex].id, results[selectedIndex].content);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true); // Capture phase to override other handlers?
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [results, selectedIndex, onSelect, onClose]);

    if (results.length === 0) return null;

    return (
        <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-64 max-h-48 overflow-y-auto"
            style={{ top: position.top + 20, left: position.left }}
        >
            {results.map((node, index) => (
                <div
                    key={node.id}
                    className={`px-3 py-2 text-sm cursor-pointer truncate ${index === selectedIndex ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                    onClick={() => onSelect(node.id, node.content)}
                    onMouseEnter={() => setSelectedIndex(index)}
                >
                    <div className="font-medium text-gray-800 truncate">{node.content || 'Empty Node'}</div>
                </div>
            ))}
        </div>
    );
};
