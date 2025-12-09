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

// We need to access the input DOM node locally to insert text.
// Since ref is forwarded, it might be a function or object.
// Standard pattern: useImperativeHandle or just a local ref if we didn't need to forward?
// Actually NodeInput MUST forward ref for parent focus management.
// Let's rely on the parent passing a RefObject, OR create an inner ref and sync it?
// Simpler: Just cast ref to RefObject since we control the parent usage in NodeItem/NodeContent
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
            const textBeforeCursor = val.slice(0, selectionStart);
            const match = textBeforeCursor.match(/\[\[([^\]]*)$/); // Match [[ followed by anything not ]

            if (match) {
                const query = match[1];
                const rect = e.target.getBoundingClientRect();
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
                        onSelect={(selectedId, selectedContent) => {
                            const internalRef = ref as React.RefObject<HTMLInputElement>;
                            if (!internalRef.current) return;

                            const value = internalRef.current.value;
                            const before = value.substring(0, triggerIndex); // Use triggerIndex for start
                            // Standard markdown link format: [Content](((UUID)))
                            const linkText = `[${selectedContent}](((${selectedId})))`;
                            // Calculate the length of the matched query part to correctly slice 'after'
                            const matchedQueryLength = popupQuery.length;
                            const after = value.substring(triggerIndex + 2 + matchedQueryLength); // +2 for '[['

                            const newValue = before + linkText + after;
                            updateContent(id, newValue);

                            setShowPopup(false); // Close popup

                            // Restore focus and cursor
                            requestAnimationFrame(() => {
                                if (internalRef.current) {
                                    internalRef.current.focus();
                                    const newCursorPos = before.length + linkText.length;
                                    internalRef.current.setSelectionRange(newCursorPos, newCursorPos);
                                }
                            });
                        }}
                        onClose={() => setShowPopup(false)}
                    />
                )}
            </>
        );
    }
);

NodeInput.displayName = 'NodeInput';
