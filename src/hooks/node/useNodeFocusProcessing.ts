import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { NodeId } from '@/types/outliner';

export interface NodeFocusProcessingProps {
  id: NodeId;
  isSelected: boolean;
  isFocused: boolean;
  focusCursorPos: number | null;
  inputRef: RefObject<HTMLInputElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
}

export const useNodeFocusProcessing = ({
  isSelected,
  isFocused,
  focusCursorPos,
  inputRef,
  containerRef
}: NodeFocusProcessingProps) => {
  useEffect(() => {
    if (!isFocused) return;

    if (isSelected) {
      if (containerRef.current) {
        containerRef.current.focus();
      }
      return;
    }

    const input = inputRef.current;
    if (!input) return;

    if (document.activeElement !== input) {
      input.focus();
    }

    if (focusCursorPos !== null) {
      const len = input.value.length;
      const newPos = Math.max(0, Math.min(focusCursorPos, len));

      try {
        input.setSelectionRange(newPos, newPos);
      } catch (e) {
        // ignore
      }
    }
  }, [isFocused, isSelected, focusCursorPos, inputRef, containerRef]);
};
