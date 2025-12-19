
import type { StateCreator } from 'zustand';

import type { OutlinerState, NodeSlice } from '@/types/outliner';
import {
    addNode,
    addNodeBefore,
    deleteNode,
    updateContent,
    toggleCollapse,
    indentNode,
    outdentNode,
    indentNodes,
    outdentNodes,
    moveNode,
    pasteNodes,
    splitNode,
    mergeNode,
    updateType,
    toggleComplete
} from '@/store/actions';

import { createInitialNode } from '@/utils/storeUtils';

const INITIAL_ROOT_ID = 'root';

export const createNodeSlice: StateCreator<OutlinerState, [], [], NodeSlice> = (set, get) => ({
    nodes: {
        [INITIAL_ROOT_ID]: createInitialNode(INITIAL_ROOT_ID, 'Root'),
    },
    rootNodeId: INITIAL_ROOT_ID,
    hoistedNodeId: null,

    setHoistedNode: (id) => set({ hoistedNodeId: id }),

    addNode: (parentId, index, shouldFocus) => addNode({ get, set, parentId, index, shouldFocus }),
    addNodeBefore: (siblingId) => addNodeBefore({ get, set, siblingId }),

    deleteNode: (id) => deleteNode({ get, set, id }),
    updateContent: (id, content) => updateContent({ get, id, content }),
    toggleCollapse: (id) => toggleCollapse({ get, id }),

    deleteNodes: (ids) => {
        const { deleteNode } = get();
        ids.forEach(id => deleteNode(id));
    },

    indentNode: (id) => indentNode({ get, id }),
    outdentNode: (id) => outdentNode({ get, id }),

    indentNodes: (ids) => indentNodes({ get, ids }),
    outdentNodes: (ids) => outdentNodes({ get, ids }),

    moveNode: (id, direction) => moveNode({ get, id, direction }),

    pasteNodes: (parentId, index, nodesData) =>
        pasteNodes({ get, parentId, index, nodesData }),

    splitNode: (id, cursorPosition) =>
        splitNode({ get, set, id, cursorPosition }),

    mergeNode: (id) =>
        mergeNode({ get, set, id }),

    updateType: (id, type, attributes) =>
        updateType({ get, id, type, attributes }),

    toggleComplete: (id) =>
        toggleComplete({ get, id }),
});
