import React, { useRef, useEffect } from 'react';
import type { NodeId } from '@/types/outliner';
import { useNodeLogic } from '@/hooks/node/useNodeLogic';
import { useNodeKeys } from '@/hooks/node/useNodeKeys';
import { NodeBullet } from './node/NodeBullet';
import { NodeContent } from './node/NodeContent';

interface NodeItemProps {
    id: NodeId;
    level?: number;
}

export const NodeItem: React.FC<NodeItemProps> = ({ id, level = 0 }) => {
    const {
        node,
        isSelected,
        isFocused,
        focusCursorPos,
        updateContent
    } = useNodeLogic(id);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { handleKeyDown } = useNodeKeys(id, node, isSelected, inputRef, updateContent);

    // Focus Management Effect
    useEffect(() => {
        if (isFocused) {
            if (isSelected) {
                if (document.activeElement !== containerRef.current && containerRef.current) {
                    containerRef.current.focus();
                }
            } else {
                if (document.activeElement !== inputRef.current && inputRef.current) {
                    inputRef.current.focus();

                    const len = inputRef.current.value.length;
                    let newPos = len;

                    if (focusCursorPos !== null) {
                        newPos = focusCursorPos;
                    }

                    if (newPos < 0) newPos = 0;
                    if (newPos > len) newPos = len;

                    inputRef.current.setSelectionRange(newPos, newPos);
                }
            }
        }
    }, [isFocused, isSelected, focusCursorPos]);

    const handlePaste = (e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData('text');
        if (text.includes('\n')) {
            e.preventDefault();
            import('@/utils/clipboard').then(({ parseIndentedText }) => {
                const parsed = parseIndentedText(text);
                if (parsed.length > 0) {
                    import('@/store/useOutlinerStore').then(({ useOutlinerStore }) => {
                        const state = useOutlinerStore.getState();
                        const parent = state.nodes[node.parentId || ''];
                        if (parent) {
                            const index = parent.children.indexOf(id) + 1;
                            state.pasteNodes(parent.id, index, parsed);
                        }
                    });
                }
            });
        }
    };

    if (!node) return null;

    return (
        <div className={`oo-node-item flex flex-col select-none ${isSelected ? 'oo-node-selected bg-blue-100 rounded' : ''} ${isFocused ? 'oo-node-focused' : ''}`}>
            <div
                ref={containerRef}
                tabIndex={-1}
                className="flex items-center group py-1 relative outline-none"
                style={{ paddingLeft: `${level * 20}px` }}
                onKeyDown={handleKeyDown}
            >
                <NodeBullet id={id} />
                <NodeContent
                    id={id}
                    inputRef={inputRef}
                    onPaste={handlePaste}
                />
            </div>
        </div>
    );
};
