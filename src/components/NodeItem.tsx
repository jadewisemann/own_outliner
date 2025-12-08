import React from 'react';
import { useOutlinerStore } from '../store/useOutlinerStore';
import type { NodeId } from '../types/outliner';
import { ChevronRight, ChevronDown, Circle } from 'lucide-react';
import { clsx } from 'clsx';

interface NodeItemProps {
    id: NodeId;
    level?: number;
}

export const NodeItem: React.FC<NodeItemProps> = ({ id, level = 0 }) => {
    const node = useOutlinerStore((state) => state.nodes[id]);
    const updateContent = useOutlinerStore((state) => state.updateContent);
    const toggleCollapse = useOutlinerStore((state) => state.toggleCollapse);
    const setFocus = useOutlinerStore((state) => state.setFocus);
    const focusedId = useOutlinerStore((state) => state.focusedId);
    const addNode = useOutlinerStore((state) => state.addNode);
    const indentNode = useOutlinerStore((state) => state.indentNode);
    const outdentNode = useOutlinerStore((state) => state.outdentNode);
    const moveFocus = useOutlinerStore((state) => state.moveFocus);

    if (!node) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Add 'null' as index to just append for now, or use logic to find current index
            addNode(node.parentId);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                outdentNode(id);
            } else {
                indentNode(id);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            moveFocus('up');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            moveFocus('down');
        }
    };

    return (
        <div className="flex flex-col select-none">
            {/* Node Row */}
            <div
                className={clsx(
                    "flex items-center group py-1",
                    focusedId === id && "bg-gray-50"
                )}
                style={{ paddingLeft: `${level * 20}px` }}
            >
                {/* Bullet / Toggle */}
                <div className="w-6 h-6 flex items-center justify-center mr-1 cursor-pointer text-gray-400 hover:text-gray-600">
                    {node.children.length > 0 ? (
                        <button onClick={() => toggleCollapse(id)} className="p-0.5 hover:bg-gray-200 rounded">
                            {node.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        </button>
                    ) : (
                        <Circle size={6} fill="currentColor" className="text-gray-300 group-hover:text-gray-400" />
                    )}
                </div>

                {/* Content */}
                <input
                    className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-300 font-medium"
                    value={node.content}
                    onChange={(e) => updateContent(id, e.target.value)}
                    onFocus={() => setFocus(id)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type something..."
                    autoFocus={focusedId === id}
                />
            </div>

            {/* Children */}
            {!node.isCollapsed && node.children.length > 0 && (
                <div className="flex flex-col">
                    {node.children.map((childId) => (
                        <NodeItem key={childId} id={childId} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};
