import React from 'react';
import type { NodeId } from '@/types/outliner';
import { useNodeLogic } from '@/hooks/node/useNodeLogic';
import { NodeInput } from './NodeInput';
import { NodeMarkdown } from './NodeMarkdown';

interface NodeContentProps {
    id: NodeId;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onPaste: (e: React.ClipboardEvent) => void;
}

export const NodeContent: React.FC<NodeContentProps> = ({ id, inputRef, onPaste }) => {
    const { node, isFocused, isSelected, setFocus, deselectAll } = useNodeLogic(id);

    if (!node) return null;

    return (
        <div className="oo-node-content flex-1 min-w-0" onClick={(e) => {
            // Click on container handles focus if not input
            e.stopPropagation();
            deselectAll();
            setFocus(id);
        }}>
            {isFocused ? (
                <NodeInput
                    id={id}
                    ref={inputRef}
                    content={node.content}
                    isSelected={isSelected}
                    onPaste={onPaste}
                />
            ) : (
                <div className={`prose prose-sm max-w-none leading-normal text-gray-800 pointer-events-none ${node.content.trim() === '' ? 'h-6' : ''}`}>
                    <NodeMarkdown content={node.content} />
                </div>
            )}
        </div>
    );
};
