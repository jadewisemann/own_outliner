
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
        if (document.activeElement !== inputRef.current && inputRef.current) {
          inputRef.current.focus();

          const len = inputRef.current.value.length;
          let newPos = len;

          if (focusCursorPos !== null) {
            newPos = focusCursorPos;
          }

          if (newPos < 0) newPos = 0;
          if (newPos > len) newPos = len;

          // Defer selection set slightly to ensure focus has taken effect
          // requestAnimationFrame could be better, but direct call usually works if focused.
          try {
            inputRef.current.setSelectionRange(newPos, newPos);
          } catch (e) {
            // ignore error if input not ready
          }
        }
      }
    }
  }, [isFocused, isSelected, focusCursorPos, inputRef, containerRef]);
};
