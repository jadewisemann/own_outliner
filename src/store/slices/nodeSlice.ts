
import type { StateCreator } from 'zustand';
import type { OutlinerState, NodeData, NodeId } from '../../types/outliner';
import { generateId, createInitialNode } from '../../utils/storeUtils';

// Define the Node Slice state
export interface NodeSlice {
    nodes: Record<NodeId, NodeData>;
    rootNodeId: NodeId;
    hoistedNodeId: NodeId | null;

    addNode: (parentId: NodeId | null, index?: number) => void;
    deleteNode: (id: NodeId) => void;
    deleteNodes: (ids: NodeId[]) => void;
    updateContent: (id: NodeId, content: string) => void;
    toggleCollapse: (id: NodeId) => void;
    indentNode: (id: NodeId) => void;
    outdentNode: (id: NodeId) => void;
    indentNodes: (ids: NodeId[]) => void;
    outdentNodes: (ids: NodeId[]) => void;
    moveNode: (id: NodeId, direction: 'up' | 'down') => void;
    setHoistedNode: (id: NodeId | null) => void;
    pasteNodes: (parentId: NodeId, index: number, nodes: any[]) => void;
    splitNode: (id: NodeId, cursorPosition: number) => void;
    mergeNode: (id: NodeId) => void;
}

const INITIAL_ROOT_ID = 'root';

export const createNodeSlice: StateCreator<OutlinerState, [], [], NodeSlice> = (set, get) => ({
    nodes: {
        [INITIAL_ROOT_ID]: {
            id: INITIAL_ROOT_ID,
            content: 'Root',
            parentId: null,
            children: [],
            isCollapsed: false,
        },
    },
    rootNodeId: INITIAL_ROOT_ID,
    hoistedNodeId: null,

    setHoistedNode: (id) => set({ hoistedNodeId: id }),

    addNode: (parentId, index) => {
        const id = generateId();
        const newNode = createInitialNode(id);

        set((state) => {
            const parent = state.nodes[parentId || state.rootNodeId];
            if (!parent) return state;

            newNode.parentId = parent.id;

            const newChildren = [...parent.children];
            if (typeof index === 'number' && index >= 0) {
                newChildren.splice(index, 0, id);
            } else {
                newChildren.push(id);
            }

            return {
                nodes: {
                    ...state.nodes,
                    [id]: newNode,
                    [parent.id]: {
                        ...parent,
                        children: newChildren,
                    },
                },
                focusedId: id, // Auto focus new node
            };
        });
    },

    deleteNode: (id) => {
        set((state) => {
            const node = state.nodes[id];
            if (!node || !node.parentId) return state;

            const parent = state.nodes[node.parentId];
            const index = parent.children.indexOf(id);

            let nextFocusId: NodeId | null = parent.id;

            if (index > 0) {
                nextFocusId = parent.children[index - 1];
            } else {
                if (node.parentId === state.rootNodeId) {
                    if (parent.children.length > 1) {
                        nextFocusId = parent.children[index + 1];
                    } else {
                        nextFocusId = null;
                    }
                } else {
                    nextFocusId = parent.id;
                }
            }

            const deleteRecursively = (targetId: NodeId, nodesMap: Record<NodeId, NodeData>) => {
                const target = nodesMap[targetId];
                if (target && target.children) {
                    target.children.forEach(childId => deleteRecursively(childId, nodesMap));
                }
                delete nodesMap[targetId];
            };

            const newNodes = { ...state.nodes };
            deleteRecursively(id, newNodes);

            const newParentChildren = parent.children.filter((childId) => childId !== id);
            newNodes[parent.id] = { ...parent, children: newParentChildren };

            let newSelectedIds = state.selectedIds;
            if (state.selectedIds.includes(id)) {
                newSelectedIds = state.selectedIds.filter(sid => sid !== id);
            }

            return {
                nodes: newNodes,
                focusedId: nextFocusId,
                selectedIds: newSelectedIds
            };
        });
    },

    deleteNodes: (ids) => {
        set((state) => {
            if (ids.length === 0) return state;

            const newNodes = { ...state.nodes };
            const parentsToUpdate = new Set<NodeId>();
            let nextFocusId = state.focusedId;

            const firstId = ids[0];
            const firstNode = state.nodes[firstId];
            if (firstNode && firstNode.parentId) {
                const p = state.nodes[firstNode.parentId];
                const idx = p.children.indexOf(firstId);
                if (idx > 0) {
                    nextFocusId = p.children[idx - 1];
                } else {
                    nextFocusId = p.id;
                }
            }

            const deleteRecursively = (targetId: NodeId) => {
                const target = newNodes[targetId];
                if (target && target.children) {
                    target.children.forEach(childId => deleteRecursively(childId));
                }
                delete newNodes[targetId];
            };

            ids.forEach(id => {
                const node = state.nodes[id];
                if (!node || !node.parentId) return;
                parentsToUpdate.add(node.parentId);
                deleteRecursively(id);
            });

            parentsToUpdate.forEach(parentId => {
                if (newNodes[parentId]) {
                    const parent = newNodes[parentId];
                    const newChildren = parent.children.filter(cid => !ids.includes(cid));
                    newNodes[parentId] = { ...parent, children: newChildren };
                }
            });

            return {
                nodes: newNodes,
                selectedIds: [],
                focusedId: (state.focusedId && ids.includes(state.focusedId)) ? nextFocusId : state.focusedId
            };
        });
    },

    updateContent: (id, content) => {
        set((state) => ({
            nodes: {
                ...state.nodes,
                [id]: {
                    ...state.nodes[id],
                    content,
                },
            },
        }));
    },

    toggleCollapse: (id) => {
        set((state) => ({
            nodes: {
                ...state.nodes,
                [id]: {
                    ...state.nodes[id],
                    isCollapsed: !state.nodes[id].isCollapsed,
                },
            },
        }));
    },

    indentNode: (id) => {
        set((state) => {
            const node = state.nodes[id];
            if (!node || !node.parentId) return state;

            const parent = state.nodes[node.parentId];
            const index = parent.children.indexOf(id);

            if (index <= 0) return state;

            const prevSiblingId = parent.children[index - 1];
            const prevSibling = state.nodes[prevSiblingId];

            const newParentChildren = [...parent.children];
            newParentChildren.splice(index, 1);

            const newPrevSiblingChildren = [...prevSibling.children, id];

            return {
                nodes: {
                    ...state.nodes,
                    [id]: { ...node, parentId: prevSiblingId },
                    [parent.id]: { ...parent, children: newParentChildren },
                    [prevSiblingId]: {
                        ...prevSibling,
                        children: newPrevSiblingChildren,
                        isCollapsed: false
                    },
                },
            };
        });
    },

    outdentNode: (id) => {
        set((state) => {
            const node = state.nodes[id];
            if (!node || !node.parentId) return state;

            const parent = state.nodes[node.parentId];
            if (parent.id === state.rootNodeId) return state;

            const grandParentId = parent.parentId!;
            if (!grandParentId) return state;

            const grandParent = state.nodes[grandParentId];

            const newParentChildren = parent.children.filter(c => c !== id);

            const parentIndex = grandParent.children.indexOf(parent.id);
            const newGrandParentChildren = [...grandParent.children];
            newGrandParentChildren.splice(parentIndex + 1, 0, id);

            return {
                nodes: {
                    ...state.nodes,
                    [id]: { ...node, parentId: grandParentId },
                    [parent.id]: { ...parent, children: newParentChildren },
                    [grandParent.id]: { ...grandParent, children: newGrandParentChildren },
                },
            };
        });
    },

    indentNodes: (ids) => {
        const { indentNode } = get();
        const state = get();

        const topLevelIds = ids.filter(id => {
            const node = state.nodes[id];
            return node && node.parentId && !ids.includes(node.parentId);
        });

        topLevelIds.forEach(id => indentNode(id));
    },

    outdentNodes: (ids) => {
        const { outdentNode } = get();
        const state = get();

        const topLevelIds = ids.filter(id => {
            const node = state.nodes[id];
            return node && node.parentId && !ids.includes(node.parentId);
        });

        topLevelIds.forEach(id => outdentNode(id));
    },

    moveNode: (id, direction) => {
        set((state) => {
            const node = state.nodes[id];
            if (!node || !node.parentId) return state;

            const parent = state.nodes[node.parentId];
            const index = parent.children.indexOf(id);
            if (index === -1) return state;

            const newChildren = [...parent.children];

            if (direction === 'up') {
                if (index === 0) return state;
                [newChildren[index - 1], newChildren[index]] = [newChildren[index], newChildren[index - 1]];
            } else {
                if (index === parent.children.length - 1) return state;
                [newChildren[index], newChildren[index + 1]] = [newChildren[index + 1], newChildren[index]];
            }

            return {
                nodes: {
                    ...state.nodes,
                    [parent.id]: {
                        ...parent,
                        children: newChildren,
                    },
                },
            };
        });
    },

    pasteNodes: (parentId: NodeId, index: number, nodes: { content: string, children: any[] }[]) => {
        set((state) => {
            const newNodes: Record<NodeId, NodeData> = {};

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const processNode = (nodeData: { content: string, children: any[] }, pId: string): string => {
                const newId = generateId();
                const newChildrenIds = nodeData.children.map(child => processNode(child, newId));

                newNodes[newId] = {
                    id: newId,
                    content: nodeData.content,
                    parentId: pId,
                    children: newChildrenIds,
                    isCollapsed: false
                };
                return newId;
            };

            const parent = state.nodes[parentId];
            if (!parent) return state;

            const addedIds = nodes.map(node => processNode(node, parentId));

            const newParentChildren = [...parent.children];
            if (typeof index === 'number' && index >= 0) {
                newParentChildren.splice(index, 0, ...addedIds);
            } else {
                newParentChildren.push(...addedIds);
            }

            return {
                nodes: {
                    ...state.nodes,
                    ...newNodes,
                    [parent.id]: {
                        ...parent,
                        children: newParentChildren
                    }
                },
                focusedId: addedIds[addedIds.length - 1]
            };
        });
    },

    splitNode: (id, cursorPosition) => {
        set((state) => {
            const node = state.nodes[id];
            if (!node || !node.parentId) return state;

            const parent = state.nodes[node.parentId];
            const index = parent.children.indexOf(id);

            const isStart = cursorPosition === 0;
            const leftContent = isStart ? node.content : node.content.slice(0, cursorPosition);
            const rightContent = isStart ? '' : node.content.slice(cursorPosition);

            let behavior = state.settings.splitBehavior;
            if (behavior === 'auto') {
                behavior = node.children.length > 0 ? 'child' : 'sibling';
            }

            const newId = generateId();
            const newNode = createInitialNode(newId, rightContent);

            const nodes = { ...state.nodes };

            if (behavior === 'child') {
                newNode.parentId = id;
                const newCurrentChildren = [newId, ...node.children];

                nodes[id] = {
                    ...node,
                    content: leftContent,
                    children: newCurrentChildren,
                    isCollapsed: false
                };
                nodes[newId] = newNode;
            } else {
                newNode.parentId = parent.id;
                const newChildren = [...parent.children];
                newChildren.splice(index + 1, 0, newId);

                nodes[id] = { ...node, content: leftContent };
                nodes[newId] = newNode;
                nodes[parent.id] = { ...parent, children: newChildren };
            }

            return {
                nodes,
                focusedId: newId
            };
        });
    },

    mergeNode: (id) => {
        set((state) => {
            const node = state.nodes[id];
            if (!node || !node.parentId) return state;

            const parent = state.nodes[node.parentId];
            const index = parent.children.indexOf(id);

            if (index === 0) {
                return state;
            }

            const prevSiblingId = parent.children[index - 1];
            const prevSibling = state.nodes[prevSiblingId];

            const newContent = prevSibling.content + node.content;

            const childrenUpdates: Record<NodeId, NodeData> = {};
            node.children.forEach(childId => {
                const child = state.nodes[childId];
                childrenUpdates[childId] = { ...child, parentId: prevSiblingId };
            });

            const newPrevChildren = [...prevSibling.children, ...node.children];

            const { [id]: _deleted, ...remainingNodes } = state.nodes;

            const newParentChildren = parent.children.filter(c => c !== id);

            return {
                nodes: {
                    ...remainingNodes,
                    ...childrenUpdates,
                    [prevSiblingId]: {
                        ...prevSibling,
                        content: newContent,
                        children: newPrevChildren,
                        isCollapsed: false
                    },
                    [parent.id]: { ...parent, children: newParentChildren }
                },
                focusedId: prevSiblingId,
            };
        });
    }
});
