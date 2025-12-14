import type { NodeId, NodeData } from '@/types/outliner';
import { executeIfMatch, isMatch } from '@/utils/keybindings';
import { useNodeClipboard } from './useNodeClipboard';
import { useOutlinerStore } from '@/store/outliner';

export const useSelectionKeys = (
    id: NodeId,
    node: NodeData,
    keys: any
) => {
    const { copyNodes, cutNodes, handleClipboardPaste } = useNodeClipboard();

    const handleSelectionMode = (e: React.KeyboardEvent) => {
        const state = useOutlinerStore.getState();

        if (executeIfMatch(e, keys.indentNode, () => {
            const ids = state.selectedIds.length > 0 ? state.selectedIds : [id];
            state.indentNodes(ids);
        })) return;

        if (executeIfMatch(e, keys.outdentNode, () => {
            const ids = state.selectedIds.length > 0 ? state.selectedIds : [id];
            state.outdentNodes(ids);
        })) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            state.selectNode(id, false); // Switch to Edit Mode
            return;
        }

        if (isMatch(e, keys.deleteNode) || e.key === 'Backspace') {
            e.preventDefault();
            if (state.selectedIds.length > 1) {
                state.deleteNodes(state.selectedIds);
            } else {
                state.deleteNode(id);
            }
            return;
        }

        if (executeIfMatch(e, keys.deleteLine, () => {
            if (state.selectedIds.length > 1) {
                state.deleteNodes(state.selectedIds);
            } else {
                state.deleteNodes([id]);
            }
        })) return;

        if (executeIfMatch(e, keys.selectLine, () => state.selectNode(id, false))) return;

        if (executeIfMatch(e, keys.selectAll, () => state.expandSelection(id))) return;

        if (executeIfMatch(e, keys.toggleCollapse, () => state.toggleCollapse(id))) return;

        if (executeIfMatch(e, keys.zoomIn, () => state.setHoistedNode(id))) return;

        if (executeIfMatch(e, keys.zoomOut, () => {
            const currentHoistedId = state.hoistedNodeId;
            if (currentHoistedId) {
                const currentHoistedNode = state.nodes[currentHoistedId];
                if (currentHoistedNode && currentHoistedNode.parentId && currentHoistedNode.parentId !== state.rootNodeId) {
                    state.setHoistedNode(currentHoistedNode.parentId);
                } else {
                    state.setHoistedNode(null); // Go to Root
                }
            }
        })) return;

        // Clipboard
        if (executeIfMatch(e, keys.copyNode, () => {
            const targets = state.selectedIds.length > 0 ? state.selectedIds : [id];
            copyNodes(targets, state.nodes);
        })) return;

        if (executeIfMatch(e, keys.cutNode, () => {
            const targets = state.selectedIds.length > 0 ? state.selectedIds : [id];
            cutNodes(targets, state);
        })) return;

        if (executeIfMatch(e, keys.pasteNode, () => handleClipboardPaste(id, state))) return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            state.deselectAll();
            state.setFocus(id, 0);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            state.deselectAll();
            state.setFocus(id, node.content.length);
        }
    };

    return { handleSelectionMode };
};
