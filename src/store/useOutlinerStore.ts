import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OutlinerState, NodeData, NodeId } from '../types/outliner';
import { defaultKeybindings } from '../utils/keybindings';

const generateId = (): string => Math.random().toString(36).substring(2, 9);

const INITIAL_ROOT_ID = 'root';

const createInitialNode = (id: string, content: string = ''): NodeData => ({
    id,
    content,
    parentId: null,
    children: [],
    isCollapsed: false,
});

const defaultSettings = {
    splitBehavior: 'auto' as const,
    keybindings: defaultKeybindings,
};

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
            focusCursorPos: null,
            hoistedNodeId: null,

            settings: defaultSettings,

            selectedIds: [],
            selectionAnchorId: null,

            setSetting: (key, value) => set((state) => ({
                settings: { ...state.settings, [key]: value }
            })),

            setKeybinding: (action, binding) => set((state) => ({
                settings: {
                    ...state.settings,
                    keybindings: {
                        ...state.settings.keybindings,
                        [action]: binding
                    }
                }
            })),

            resetKeybindings: () => set((state) => ({
                settings: {
                    ...state.settings,
                    keybindings: defaultKeybindings
                }
            })),

            selectNode: (id, multi = false) => set((state) => {
                const newSelected = multi
                    ? (state.selectedIds.includes(id)
                        ? state.selectedIds.filter(i => i !== id)
                        : [...state.selectedIds, id])
                    : [id];
                return {
                    selectedIds: newSelected,
                    selectionAnchorId: multi ? (state.selectionAnchorId || id) : id
                };
            }),

            deselectAll: () => set({ selectedIds: [], selectionAnchorId: null }),

            selectRange: (targetId) => {
                const state = get();
                const anchorId = state.selectionAnchorId || state.focusedId; // Fallback to focus if no anchor
                if (!anchorId) return;

                // Flatten visible nodes
                const flattenVisibleNodes = (nodeId: NodeId, list: NodeId[]) => {
                    list.push(nodeId);
                    const node = state.nodes[nodeId];
                    if (!node.isCollapsed && node.children.length > 0) {
                        node.children.forEach(childId => flattenVisibleNodes(childId, list));
                    }
                };
                const flatList: NodeId[] = [];
                const root = state.nodes[state.rootNodeId];
                root.children.forEach(childId => flattenVisibleNodes(childId, flatList));

                const startIndex = flatList.indexOf(anchorId);
                const endIndex = flatList.indexOf(targetId);

                if (startIndex === -1 || endIndex === -1) return;

                const start = Math.min(startIndex, endIndex);
                const end = Math.max(startIndex, endIndex);

                const range = flatList.slice(start, end + 1);
                set({ selectedIds: range });
            },



            moveFocus: (direction, select = false) => {
                const state = get();
                // ... logic to find next node
                // We need to flatten visible nodes to find next/prev
                if (!state.focusedId && !state.rootNodeId) return;

                const flattenVisibleNodes = (nodeId: NodeId, list: NodeId[]) => {
                    const node = state.nodes[nodeId];
                    // We include root? No, typical traversal is children.
                    // But we need to traverse from root.
                    if (nodeId !== state.rootNodeId) list.push(nodeId);

                    if (!node.isCollapsed && node.children.length > 0) {
                        node.children.forEach(childId => flattenVisibleNodes(childId, list));
                    }
                };

                const flatList: NodeId[] = [];
                // const root = state.nodes[state.rootNodeId]; // activeRootId handled by caller? 
                // Store uses `hoistedNodeId`?
                // `moveFocus` should respect hoisting.
                const effectiveRootId = state.hoistedNodeId || state.rootNodeId;
                const effectiveRoot = state.nodes[effectiveRootId];

                if (effectiveRoot) {
                    effectiveRoot.children.forEach(childId => flattenVisibleNodes(childId, flatList));
                }

                // If focusedId is null, focus first?
                let currentIndex = -1;
                if (state.focusedId) {
                    currentIndex = flatList.indexOf(state.focusedId);
                }

                if (currentIndex === -1 && flatList.length > 0) {
                    set({ focusedId: flatList[0] });
                    return;
                }

                let nextIndex = currentIndex;
                if (direction === 'up') {
                    nextIndex = currentIndex - 1;
                } else {
                    nextIndex = currentIndex + 1;
                }

                if (nextIndex >= 0 && nextIndex < flatList.length) {
                    const nextId = flatList[nextIndex];

                    // Selection Logic
                    if (select) {
                        // const anchor = state.selectionAnchorId || state.focusedId; // Anchor at OLD focus if null

                        // We set focus first? No, we need state update.
                        // But we want to call selectRange(nextId) with anchor anchored at old.
                        // If anchor was null, Set anchor to OLD focus.

                        const updates: Partial<OutlinerState> = { focusedId: nextId };
                        if (!state.selectionAnchorId) {
                            updates.selectionAnchorId = state.focusedId;
                        }

                        // We need to trigger selectRange logic.
                        // Can't call get().selectRange inside set?
                        // We can calculate range here.

                        const anchorId = state.selectionAnchorId || state.focusedId;
                        if (anchorId) {
                            const startIndex = flatList.indexOf(anchorId);
                            const endIndex = nextIndex;
                            const start = Math.min(startIndex, endIndex);
                            const end = Math.max(startIndex, endIndex);
                            updates.selectedIds = flatList.slice(start, end + 1);
                        }

                        set(updates);
                    } else {
                        // Clear selection if moving without shift
                        set({ focusedId: nextId, selectedIds: [], selectionAnchorId: null });
                    }
                }
            },

            expandSelection: (currentId) => {
                const state = get();
                const node = state.nodes[currentId];
                if (!node || !node.parentId) return;

                // Helper: Get all descendants recursively
                const getSubtreeIds = (rootId: NodeId): NodeId[] => {
                    const result = [rootId];
                    const n = state.nodes[rootId];
                    if (n && n.children.length > 0) {
                        n.children.forEach(c => {
                            result.push(...getSubtreeIds(c));
                        });
                    }
                    return result;
                };

                const selectedSet = new Set(state.selectedIds);

                // Case 1: Select Node + Subtree (if not fully selected yet)
                const subtreeIds = getSubtreeIds(currentId);
                const isSubtreeSelected = subtreeIds.every(id => selectedSet.has(id));

                if (!isSubtreeSelected) {
                    set({ selectedIds: subtreeIds, selectionAnchorId: currentId });
                    return;
                }

                // Case 2: Select Siblings (and their subtrees)
                // Identify the "scope" of the current selection.
                // If we selected a child, our scope is that child.
                // If we selected siblings, our scope is the siblings list.
                // We need to find the parent of the currently selected "block".
                // If selection contains currentId, we look at currentId's parent.

                const parent = state.nodes[node.parentId];
                if (!parent) return;

                const siblings = parent.children;
                // Check if all siblings (and their subtrees) are selected
                let allSiblingsSelected = true;
                const allSiblingIds: NodeId[] = [];

                siblings.forEach(sibId => {
                    const sibSubtree = getSubtreeIds(sibId);
                    allSiblingIds.push(...sibSubtree);
                    if (!sibSubtree.every(id => selectedSet.has(id))) {
                        allSiblingsSelected = false;
                    }
                });

                if (!allSiblingsSelected) {
                    set({ selectedIds: allSiblingIds });
                    return;
                }

                // Case 3: Select Parent (and thus the whole block up to parent)
                // If siblings are selected, next step is to select the Parent Node itself.
                if (!selectedSet.has(parent.id)) {
                    // Select Parent + All Sibling Subtrees (which are effectively Parent's subtree)
                    // So we just add Parent ID to the list?
                    // Or strictly set to [Parent, ...descendants]?
                    // Usually selection order matters for range, but for "Select Parent", 
                    // we essentially select the Parent Row + Children Rows.
                    const parentSubtree = getSubtreeIds(parent.id);
                    set({ selectedIds: parentSubtree, selectionAnchorId: parent.id });

                    // Optimization: If we just selected Parent Subtree, 
                    // Next Ctrl+A should effectively be called on Parent.
                    // But the user focus is still on `currentId` (input).
                    // So subsequent Ctrl+A will come here again with `currentId`.
                    // We need to detect "Parent is already selected".
                } else {
                    // Parent is selected. 
                    // Now replicate "Siblings" logic but for Parent.
                    // Recursive step?
                    // We can call expandSelection(parent.id)? 
                    // But we can't easily call actions from within actions efficiently without loop.
                    // Let's explicitly go up.
                    get().expandSelection(parent.id);
                }
            },

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

                    // Determine next focus target
                    let nextFocusId: NodeId | null = parent.id;

                    if (index > 0) {
                        // Focus previous sibling
                        nextFocusId = parent.children[index - 1];
                    } else {
                        // We are deleting the first child
                        if (node.parentId === state.rootNodeId) {
                            // If it's a root item, we don't want to focus the invisible root parent.
                            // We should focus the NEXT sibling if available.
                            if (parent.children.length > 1) {
                                nextFocusId = parent.children[index + 1];
                            } else {
                                // No nodes left?
                                nextFocusId = null;
                            }
                        } else {
                            // Standard behavior: focus parent
                            nextFocusId = parent.id;
                        }
                    }

                    // Recursive delete helper
                    const deleteRecursively = (targetId: NodeId, nodesMap: Record<NodeId, NodeData>) => {
                        const target = nodesMap[targetId];
                        if (target && target.children) {
                            target.children.forEach(childId => deleteRecursively(childId, nodesMap));
                        }
                        delete nodesMap[targetId];
                    };

                    const newNodes = { ...state.nodes };
                    deleteRecursively(id, newNodes);

                    // Update parent children
                    const newParentChildren = parent.children.filter((childId) => childId !== id);
                    newNodes[parent.id] = { ...parent, children: newParentChildren };

                    // Cleanup selection
                    let newSelectedIds = state.selectedIds;
                    if (state.selectedIds.includes(id)) {
                        newSelectedIds = state.selectedIds.filter(sid => sid !== id);
                    }

                    return {
                        nodes: newNodes,
                        focusedId: nextFocusId,
                        selectedIds: newSelectedIds // Prevent zombie selection
                    };
                });
            },

            deleteNodes: (ids) => {
                set((state) => {
                    if (ids.length === 0) return state;

                    const newNodes = { ...state.nodes };
                    const parentsToUpdate = new Set<NodeId>();
                    let nextFocusId = state.focusedId;

                    // Simple strategy for focus: 
                    // Find the "first" node in the list (visually) and try to focus its previous sibling.
                    // Or simply focus the parent of the first scheduled deletion if prev sibling not found.
                    // We can reuse deleteNode's logic if we process one by one, but batch is more efficient.

                    // Let's find the "best" focus candidate before deleting.
                    // We pick the first valid node from the list.
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

                    // Recursive delete helper (reused)
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

                        // Mark parent for update
                        parentsToUpdate.add(node.parentId);

                        deleteRecursively(id);
                    });

                    // Update parents
                    parentsToUpdate.forEach(parentId => {
                        // Some parents might have been deleted themselves?
                        // If parent is in newNodes (not deleted), update its children.
                        if (newNodes[parentId]) {
                            const parent = newNodes[parentId];
                            // Filter out all deleted IDs
                            const newChildren = parent.children.filter(cid => !ids.includes(cid));
                            newNodes[parentId] = { ...parent, children: newChildren };
                        }
                    });

                    return {
                        nodes: newNodes,
                        selectedIds: [], // Clear selection after delete
                        // Only update focus if the current focus was deleted
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

            setFocus: (id, cursorPos = null) => set({ focusedId: id, focusCursorPos: cursorPos }),

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

            indentNodes: (ids) => {
                const { indentNode } = get();
                const state = get();

                // Filter top level
                const topLevelIds = ids.filter(id => {
                    const node = state.nodes[id];
                    return node && node.parentId && !ids.includes(node.parentId);
                });

                // Sort by visual order to avoid messing up sibling relationships during move?
                // Actually, if we indent A then B (siblings), they both just move in.
                // We should probably indent them in reverse order? or order?
                // Let's just iterate topLevelIds.
                topLevelIds.forEach(id => indentNode(id));
            },

            outdentNodes: (ids) => {
                const { outdentNode } = get();
                const state = get();

                // Filter: Only process nodes whose parent is NOT in the selected list.
                const topLevelIds = ids.filter(id => {
                    const node = state.nodes[id];
                    return node && node.parentId && !ids.includes(node.parentId);
                });

                // For outdent, order usually matters less, but safe to do reverse or forward.
                // If we outdent a block, they process independently.
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
            },

            splitNode: (id, cursorPosition) => {
                set((state) => {
                    const node = state.nodes[id];
                    if (!node || !node.parentId) return state;

                    const parent = state.nodes[node.parentId];
                    const index = parent.children.indexOf(id);

                    // Logic for Enter at start (cursorPosition === 0):
                    // User Request: Create new line AFTER current node.
                    // Implementation: Treat it identically to Enter at END (Create empty node after).
                    // So, if cursor is 0, we FORCE left behavior to be "All Content" and right to be "Empty".

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
                        // Behavior: Child
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
                        // Behavior: Sibling (Default)
                        newNode.parentId = parent.id;
                        const newChildren = [...parent.children];
                        newChildren.splice(index + 1, 0, newId); // Insert AFTER current

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

                    // If first child, merge to parent?
                    if (index === 0) {
                        // TODO: Logic to merge to parent or previous visual node?
                        // Standard behavior: if no prev sibling, merge to parent usually implies "Outdent" or nothing.
                        // For now, do nothing or just focus parent.
                        return state;
                    }

                    const prevSiblingId = parent.children[index - 1];
                    const prevSibling = state.nodes[prevSiblingId];

                    // Merge to prevSibling
                    // 1. Combine content
                    // const oldContentLength = prevSibling.content.length; // Unused for now
                    const newContent = prevSibling.content + node.content;

                    // 2. Move children
                    // Existing children of prevSibling come first, then children of deleted node?
                    // Or deleted node's children become children of prevSibling?
                    // To keep flat logic: We need to re-parent all children of deleted node.
                    const childrenUpdates: Record<NodeId, NodeData> = {};
                    node.children.forEach(childId => {
                        const child = state.nodes[childId];
                        childrenUpdates[childId] = { ...child, parentId: prevSiblingId };
                    });

                    const newPrevChildren = [...prevSibling.children, ...node.children];

                    // 3. Delete node
                    const { [id]: deleted, ...remainingNodes } = state.nodes;

                    const newParentChildren = parent.children.filter(c => c !== id);

                    return {
                        nodes: {
                            ...remainingNodes,
                            ...childrenUpdates,
                            [prevSiblingId]: {
                                ...prevSibling,
                                content: newContent,
                                children: newPrevChildren,
                                isCollapsed: false // Ensure we see merged children
                            },
                            [parent.id]: { ...parent, children: newParentChildren }
                        },
                        focusedId: prevSiblingId,
                        // We need a way to restore cursor position to 'oldContentLength'
                        // Store doesn't handle cursor pos directly usually, UI does.
                        // We might need a transient state or handle in UI.
                        // For simple MVP: Focus goes to end of prevSibling (which is correct).
                    };
                });
            }
        }),
        {
            name: 'outliner-storage',
            version: 4,
            migrate: (persistedState: any, version: number) => {
                let state = persistedState;
                if (version === 0) {
                    // Migration from version 0 to 1: Add keybindings
                    state = {
                        ...state,
                        settings: {
                            ...defaultSettings, // Start with defaults
                            ...state.settings, // Override with existing
                            keybindings: state.settings?.keybindings || defaultSettings.keybindings // Ensure keybindings exist
                        }
                    };
                }

                if (version < 2) {
                    // Migration v1 -> v2: Add missing new keybindings
                    state = {
                        ...state,
                        settings: {
                            ...state.settings,
                            keybindings: {
                                ...defaultKeybindings,
                                ...(state.settings?.keybindings || {})
                            }
                        }
                    };
                }

                if (version < 3) {
                    // Migration v2 -> v3
                    state = {
                        ...state,
                        settings: {
                            ...state.settings,
                            keybindings: {
                                ...defaultKeybindings,
                                ...(state.settings?.keybindings || {})
                            }
                        }
                    };
                    if (!state.settings.keybindings.zoomIn) state.settings.keybindings.zoomIn = defaultKeybindings.zoomIn;
                    if (!state.settings.keybindings.zoomOut) state.settings.keybindings.zoomOut = defaultKeybindings.zoomOut;
                    const oldToggle = state.settings.keybindings.toggleCollapse;
                    if (oldToggle && oldToggle.key === '.' && !!oldToggle.meta) {
                        state.settings.keybindings.toggleCollapse = defaultKeybindings.toggleCollapse;
                    }
                }

                if (version < 4) {
                    // Migration v3 -> v4: Add formatting keys
                    state = {
                        ...state,
                        settings: {
                            ...state.settings,
                            keybindings: {
                                ...defaultKeybindings,
                                ...(state.settings?.keybindings || {})
                            }
                        }
                    };
                    // Ensure specific keys
                    if (!state.settings.keybindings.formatBold) state.settings.keybindings.formatBold = defaultKeybindings.formatBold;
                    if (!state.settings.keybindings.formatItalic) state.settings.keybindings.formatItalic = defaultKeybindings.formatItalic;
                    if (!state.settings.keybindings.formatStrike) state.settings.keybindings.formatStrike = defaultKeybindings.formatStrike;
                }

                return state;
            },
            partialize: (state) => {
                // Exclude transient UI state like selection and focus
                const { selectedIds, selectionAnchorId, focusedId, ...rest } = state;
                return rest;
            },
            onRehydrateStorage: () => (state) => {
                // Double check to ensure transient state is reset on load
                if (state) {
                    state.selectedIds = [];
                    state.selectionAnchorId = null;
                    state.focusedId = null;

                    // Fallback safety check if migrate didn't run or state is raw
                    if (!state.settings || !state.settings.keybindings) {
                        state.settings = {
                            splitBehavior: state.settings?.splitBehavior || 'auto',
                            keybindings: defaultKeybindings
                        };
                    }
                }
            },
        }
    )
);
