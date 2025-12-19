import type { RefObject } from 'react';
import type { NodeId } from '@/types/outliner';

export interface NodeFormattingProps {
    inputRef: RefObject<HTMLInputElement | null>;
    updateContent: (id: NodeId, content: string) => void;
}

export interface ApplyFormatProps {
    id: NodeId;
    marker: string;
}

export const useNodeFormatting = ({
    inputRef,
    updateContent
}: NodeFormattingProps) => {
    const applyFormat = ({
        id,
        marker
    }: ApplyFormatProps) => {
        if (!inputRef.current) return;

        const input = inputRef.current;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const value = input.value;

        let textToWrap = value.slice(start, end);
        let before = value.slice(0, start);
        let after = value.slice(end);

        const isWrapped = before.endsWith(marker) && after.startsWith(marker);
        let newContent = '';
        let newStart = 0;
        let newEnd = 0;

        if (isWrapped) {
            newContent = before.slice(0, -marker.length) + textToWrap + after.slice(marker.length);
            newStart = start - marker.length;
            newEnd = end - marker.length;
        } else {
            newContent = before + marker + textToWrap + marker + after;
            newStart = start + marker.length;
            newEnd = end + marker.length;
        }

        updateContent(id, newContent);
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.setSelectionRange(newStart, newEnd);
            }
        }, 0);
    };

    return { applyFormat };
};
