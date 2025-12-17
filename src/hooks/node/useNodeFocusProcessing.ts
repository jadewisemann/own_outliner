
import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { NodeId } from '@/types/outliner';

export const useNodeFocusProcessing = (
  _id: NodeId,
  isSelected: boolean,
  isFocused: boolean,
  focusCursorPos: number | null,
  inputRef: RefObject<HTMLInputElement | null>,
  containerRef: RefObject<HTMLDivElement | null>
) => {
  useEffect(() => {
    if (isFocused) {
      if (isSelected) {
        // Selection mode (container focus)
        if (document.activeElement !== containerRef.current && containerRef.current) {
          containerRef.current.focus();
        }
      } else {
        // Edit mode (input focus)
        if (inputRef.current) {
          if (document.activeElement !== inputRef.current) {
            inputRef.current.focus();
          }

          if (focusCursorPos !== null) {
            const len = inputRef.current.value.length;
            let newPos = focusCursorPos;

            if (newPos < 0) newPos = 0;
            if (newPos > len) newPos = len;

            try {
              inputRef.current.setSelectionRange(newPos, newPos);
            } catch (e) {
              // ignore
            }
          }
        }
      }
    }
  }, [isFocused, isSelected, focusCursorPos, inputRef, containerRef]);
};
