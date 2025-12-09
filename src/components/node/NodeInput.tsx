import React, { forwardRef } from 'react';
import type { NodeId } from '@/types/outliner';
import { useNodeLogic } from '@/hooks/node/useNodeLogic';

interface NodeInputProps {
    id: NodeId;
    content: string;
    isSelected: boolean;
    onPaste: (e: React.ClipboardEvent) => void;
}

export const NodeInput = forwardRef<HTMLInputElement, NodeInputProps>(
    ({ id, content, isSelected, onPaste }, ref) => {
        const { updateContent, selectNode } = useNodeLogic(id);

        return (
            <input
                ref={ref}
                className={`w-full bg-transparent outline-none ${isSelected ? 'cursor-default caret-transparent' : ''}`}
                value={content}
                readOnly={isSelected}
                onChange={(e) => {
                    if (isSelected) selectNode(id, false);
                    updateContent(id, e.target.value);
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    // Already focused likely, but ensure selection reset if needed
                }}
                onFocus={() => {
                    // Handled by effect usually, but strict here
                }}
                onPaste={onPaste}
            // Auto-focus logic is handled by parent effect
            />
        );
    }
);

NodeInput.displayName = 'NodeInput';
