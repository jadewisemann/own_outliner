import React, { forwardRef, useState } from 'react';
import type { NodeId } from '@/types/outliner';
import { useNodeLogic } from '@/hooks/node/useNodeLogic';
import { InlineSearchPopup } from '@/components/InlineSearchPopup';

interface NodeInputProps {
    id: NodeId;
    content: string;
    isSelected: boolean;
    onPaste: (e: React.ClipboardEvent) => void;
}

export const NodeInput = forwardRef<HTMLInputElement, NodeInputProps>(
    ({ id, content, isSelected, onPaste }, ref) => {
        const { updateContent, selectNode } = useNodeLogic(id);

        // Popup State
        const [showPopup, setShowPopup] = useState(false);
        const [popupQuery, setPopupQuery] = useState('');
        const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
        const [triggerIndex, setTriggerIndex] = useState(-1);

        const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            const selectionStart = e.target.selectionStart || 0;

            if (isSelected) selectNode(id, false);
            updateContent(id, val);

            // Trigger Logic: Check for last '[[` before cursor
            // Optimization: Only check if last char typed was '[' or we are in popup mode
            // Simple approach: Check text before cursor
            const textBeforeCursor = val.slice(0, selectionStart);
            const match = textBeforeCursor.match(/\[\[([^\]]*)$/); // Match [[ followed by anything not ]

            if (match) {
                const query = match[1];
                const rect = e.target.getBoundingClientRect();
                // Rudimentary positioning: rect.left + approx char width * valid length
                // Better: usage of a mirror div or generic approximation
                // For MVP: Just stick it near the input start + offset
                setShowPopup(true);
                setPopupQuery(query);
                setTriggerIndex(match.index!); // Start of [[
                setPopupPos({
                    top: rect.bottom,
                    left: rect.left + (match.index! * 8) // Approx 8px per char
                });
            } else {
                setShowPopup(false);
            }
        };

        const handleSelectLink = (targetId: NodeId) => {
            // Replace [[Query with ((ID))
            if (triggerIndex === -1) return;

            // Re-read content

            // simplified:
            const match = content.slice(0).match(/\[\[([^\]]*)$/);
            if (match && match.index !== undefined) {
                const prefix = content.slice(0, match.index);
                const suffix = content.slice(match.index + match[0].length);

                const newText = `${prefix}((${targetId}))${suffix} `; // Add space for flow
                updateContent(id, newText);
                setShowPopup(false);
            }
        };

        return (
            <>
                <input
                    ref={ref}
                    className={`w-full bg-transparent outline-none ${isSelected ? 'cursor-default caret-transparent' : ''}`}
                    value={content}
                    readOnly={isSelected}
                    onChange={handleInput}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    onPaste={onPaste}
                />
                {showPopup && (
                    <InlineSearchPopup
                        query={popupQuery}
                        position={popupPos}
                        onSelect={handleSelectLink}
                        onClose={() => setShowPopup(false)}
                    />
                )}
            </>
        );
    }
);

NodeInput.displayName = 'NodeInput';
