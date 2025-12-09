import { useOutlinerStore } from '@/store/useOutlinerStore';
import type { NodeId } from '@/types/outliner';
import { useCallback } from 'react';

export const useNodeLogic = (id: NodeId) => {
    const node = useOutlinerStore((state) => state.nodes[id]);
    const focusedId = useOutlinerStore((state) => state.focusedId);
    const selectedIds = useOutlinerStore((state) => state.selectedIds);
    const focusCursorPos = useOutlinerStore((state) => state.focusCursorPos);

    const isSelected = selectedIds.includes(id);
    const isFocused = focusedId === id;

    // Actions
    const updateContent = useOutlinerStore((state) => state.updateContent);
    const toggleCollapse = useOutlinerStore((state) => state.toggleCollapse);
    const setFocus = useOutlinerStore((state) => state.setFocus);
    const deleteNode = useOutlinerStore((state) => state.deleteNode);
    const moveFocus = useOutlinerStore((state) => state.moveFocus);
    const moveNode = useOutlinerStore((state) => state.moveNode);
    const pasteNodes = useOutlinerStore((state) => state.pasteNodes);
    const splitNode = useOutlinerStore((state) => state.splitNode);
    const mergeNode = useOutlinerStore((state) => state.mergeNode);
    const selectNode = useOutlinerStore((state) => state.selectNode);
    const deselectAll = useOutlinerStore((state) => state.deselectAll);
    const expandSelection = useOutlinerStore((state) => state.expandSelection);
    const setHoistedNode = useOutlinerStore((state) => state.setHoistedNode);

    // Convenience wrapper for setFocus to handle event stopping if needed, though usually done in UI
    const handleFocus = useCallback((e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        deselectAll();
        setFocus(id);
    }, [id, deselectAll, setFocus]);

    return {
        node,
        isSelected,
        isFocused,
        focusCursorPos,
        // Actions
        updateContent,
        toggleCollapse,
        setFocus,
        handleFocus,
        deleteNode,
        moveFocus,
        moveNode,
        pasteNodes,
        splitNode,
        mergeNode,
        selectNode,
        deselectAll,
        expandSelection,
        setHoistedNode
    };
};
