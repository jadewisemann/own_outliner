import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OutlinerState, NodeData, NodeId } from '../types/outliner';

const generateId = (): string => Math.random().toString(36).substring(2, 9);

const INITIAL_ROOT_ID = 'root';

const createInitialNode = (id: string, content: string = ''): NodeData => ({
    id,
    content,
    parentId: null,
    children: [],
    isCollapsed: false,
});

export const useOutlinerStore = create<OutlinerState>()(
    persist(
        (set, get) => ({
            nodes: {
                [INITIAL_ROOT_ID]: {
                    id: INITIAL_ROOT_ID,
                    content: 'Root',
                    parentId: null,
                    children: [], // Start empty
                    isCollapsed: false,
                },
            },
            rootNodeId: INITIAL_ROOT_ID,
            focusedId: null,
            hoistedNodeId: null,

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
                    if (!node || !node.parentId) return state; // Can't delete root or orphan

                    const parent = state.nodes[node.parentId];

                    // Remove from parent's children
                    const newParentChildren = parent.children.filter((childId) => childId !== id);

                    // Create new nodes object without the deleted node
                    // Note: In a real app, we should also delete all descendants recursively.
                    // For now, let's just remove the link. Garbage collection or recursive delete later.
                    const { [id]: deleted, ...remainingNodes } = state.nodes;

                    return {
                        nodes: {
                            ...remainingNodes,
                            [parent.id]: {
                                ...parent,
                                children: newParentChildren,
                            },
                        },
                        focusedId: parent.id, // Move focus to parent (or prev sibling ideally)
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

            setFocus: (id) => set({ focusedId: id }),

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

                    // Can't indent if it's the first child
                    if (index <= 0) return state;

                    const prevSiblingId = parent.children[index - 1];
                    const prevSibling = state.nodes[prevSiblingId];

                    // Remove from current parent
                    const newParentChildren = [...parent.children];
                    newParentChildren.splice(index, 1);

                    // Add to new parent (prev sibling)
                    const newPrevSiblingChildren = [...prevSibling.children, id];

                    return {
                        nodes: {
                            ...state.nodes,
                            [id]: { ...node, parentId: prevSiblingId },
                            [parent.id]: { ...parent, children: newParentChildren },
                            [prevSiblingId]: {
                                ...prevSibling,
                                children: newPrevSiblingChildren,
                                isCollapsed: false // Expand new parent
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
                    // Can't outdent if parent is root
                    if (parent.id === state.rootNodeId) return state;

                    const grandParentId = parent.parentId!;
                    if (!grandParentId) return state; // Should not happen if parent is not root

                    const grandParent = state.nodes[grandParentId];

                    // Remove from parent
                    const newParentChildren = parent.children.filter(c => c !== id);

                    // Insert into grandparent after parent
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

            moveFocus: (direction) => {
                const state = get();
                const currentId = state.focusedId;
                if (!currentId) return;

                // Flatten logic could be optimized, but here is a simple traversal
                const flattenVisibleNodes = (nodeId: NodeId, list: NodeId[]) => {
                    list.push(nodeId);
                    const node = state.nodes[nodeId];
                    if (!node.isCollapsed && node.children.length > 0) {
                        node.children.forEach(childId => flattenVisibleNodes(childId, list));
                    }
                };

                const flatList: NodeId[] = [];
                // We start from root's children because root is invisible container
                const root = state.nodes[state.rootNodeId];
                root.children.forEach(childId => flattenVisibleNodes(childId, flatList));

                const currentIndex = flatList.indexOf(currentId);
                if (currentIndex === -1) return;

                let nextIndex = currentIndex;
                if (direction === 'up') nextIndex = currentIndex - 1;
                if (direction === 'down') nextIndex = currentIndex + 1;

                if (nextIndex >= 0 && nextIndex < flatList.length) {
                    set({ focusedId: flatList[nextIndex] });
                }
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
                        if (index === 0) return state; // Already at top
                        // Swap with previous
                        [newChildren[index - 1], newChildren[index]] = [newChildren[index], newChildren[index - 1]];
                    } else {
                        if (index === parent.children.length - 1) return state; // Already at bottom
                        // Swap with next
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

            setHoistedNode: (id) => set({ hoistedNodeId: id }),

            pasteNodes: (parentId, index, nodes) => {
                set((state) => {
                    const newNodes: Record<NodeId, NodeData> = {};

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
                        // Focus the last pasted item? Or the first?
                        focusedId: addedIds[addedIds.length - 1]
                    };
                });
            }
        }),
        {
            name: 'outliner-storage',
        }
    )
);
