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
    const moveNode = useOutlinerStore((state) => state.moveNode);
    const setHoistedNode = useOutlinerStore((state) => state.setHoistedNode);
    const pasteNodes = useOutlinerStore((state) => state.pasteNodes);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (focusedId === id && inputRef.current) {
            // Prevent fighting with existing focus to avoid cursor jumping if we are just typing
            if (document.activeElement !== inputRef.current) {
                inputRef.current.focus();
                // Optional: set selection to end if navigating?
                // For now, default focus behavior (usually selects all or start/end depending on browser)
                // Let's safe-guard: if we just moved up/down, maybe we want to preserve X position? 
                // That's hard. Let's just focus.
            }
        }
    }, [focusedId, id]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // ... (rest of logic)
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
            if (e.altKey) {
                moveNode(id, 'up');
            } else {
                moveFocus('up');
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (e.altKey) {
                moveNode(id, 'down');
            } else {
                moveFocus('down');
            }
        } else if (e.key === '.' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            setHoistedNode(id);
        } else if (e.key === ',' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            // Logic to go up one level from CURRENT HOISTED, not current node.
            // But we are in a node item. 
            // Simplified: If we hit Ctrl+, anywhere, we probably want to go up from the current VIEW.
            // So we need to find the parent of the currently hoisted node.
            // This logic is better placed in the store or calculated here.
            // For now, let's just unhoist to root for simplicity or check parent.
            // Ideally: setHoistedNode(nodes[hoistedNodeId].parentId)
            // But we don't have access to all nodes here efficiently without store lookup.
            // Let's implement 'zoomOut' action in store if we want to be strict, but for now:
            // We'll just set to null (Root) as MVP or implement a quick lookup.
            setHoistedNode(null);
        } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
            const input = e.currentTarget as HTMLInputElement;
            if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
                // Text is fully selected, move to node selection
                e.preventDefault();
                // TODO: Implement node selection mode. For now just log or console.
                console.log('Smart Select triggered');
                // Future: setSelection([id])
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData('text');
        if (text.includes('\n')) {
            e.preventDefault();
            // Dynamic import to avoid circular dependency or import issue if not ready?
            // No, just import standard.
            import('../utils/clipboard').then(({ parseIndentedText }) => {
                const parsed = parseIndentedText(text);
                if (parsed.length > 0) {
                    // Insert after current node
                    // We need index.
                    // The store action pasteNodes takes parentId and index.
                    // We don't have index easily here without lookup.
                    // Let's modify pasteNodes to accept reference sibling ID instead of index?
                    // Or just do lookup in store action? Store action 'pasteNodesAfter(siblingId, nodes)'?
                    // Let's use the store to find index.
                    // Wait, `addNode` finds index. 
                    // Let's assume for MVP we insert as children of parent, at end?
                    // No, that's bad UX.
                    // Let's rely on finding index in store.
                    // For now, let's just append to parent logic.
                    // Or better: `pasteNodes` should handle finding index if we pass 'afterNodeId'.
                    // Let's try to get parent and index if possible.
                    // Actually index logic is complex here.
                    // Implementing 'pasteNodesAfter(siblingId, nodes)' in store is better.
                    // But I already implemented `pasteNodes(parentId, index, nodes)`.
                    // I can get parentId from node.parentId.
                    // I can get index from store.nodes[parentId].children.indexOf(id).
                    // But I need access to store state here?
                    // `useOutlinerStore.getState().nodes`...
                    const state = useOutlinerStore.getState();
                    const parent = state.nodes[node.parentId || '']; // Handle root case
                    if (!parent) return; // Should allow pasting at root if parent null?
                    // If parent is null, it's root (which we handle as 'root' ID)

                    const index = parent.children.indexOf(id) + 1; // Insert AFTER current
                    pasteNodes(parent.id, index, parsed);
                }
            });
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
                    ref={inputRef}
                    className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-300 font-medium"
                    value={node.content}
                    onChange={(e) => updateContent(id, e.target.value)}
                    onFocus={() => setFocus(id)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
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
