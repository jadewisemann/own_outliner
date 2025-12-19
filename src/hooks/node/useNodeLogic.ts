import { useCallback } from 'react';

import { useOutlinerStore } from '@/store/outlinerStore';
import type { NodeId } from '@/types/outliner';

export const useNodeLogic = (id: NodeId) => {
    const node = useOutlinerStore((state) => state.nodes[id]);
    const focusedId = useOutlinerStore((state) => state.focusedId);
    const selectedIds = useOutlinerStore((state) => state.selectedIds);
    const focusCursorPos = useOutlinerStore((state) => state.focusCursorPos);

    const isSelected = selectedIds.includes(id);
    const isFocused = focusedId === id;

    const updateContent = useOutlinerStore((state) => state.updateContent);
    const updateType = useOutlinerStore((state) => state.updateType);
    const toggleComplete = useOutlinerStore((state) => state.toggleComplete);
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
    const setSlashMenu = useOutlinerStore((state) => state.setSlashMenu);
    const setHoistedNode = useOutlinerStore((state) => state.setHoistedNode);

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

        updateContent,
        updateType,
        toggleComplete,
        setSlashMenu,
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
