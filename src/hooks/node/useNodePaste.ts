import React from 'react';
import type { NodeId } from '@/types/outliner';
import { useOutlinerStore } from '@/store/outlinerStore';

export const useNodePaste = (id: NodeId) => {
  const handlePaste = async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text.includes('\n')) return;

    e.preventDefault();

    // Dynamic import to avoid circular dependencies or heavy initial load if needed
    const { parseIndentedText } = await import('@/utils/clipboard');
    const parsed = parseIndentedText(text);

    if (parsed.length === 0) return;

    const state = useOutlinerStore.getState();
    const node = state.nodes[id];

    if (!node) return;

    const parentId = node.parentId;
    if (!parentId) return;

    const parent = state.nodes[parentId];
    if (parent) {
      const index = parent.children.indexOf(id) + 1;
      state.pasteNodes(parent.id, index, parsed);
    }
  };

  return { handlePaste };
};
