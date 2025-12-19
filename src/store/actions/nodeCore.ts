import * as Y from 'yjs';
import { generateId, createInitialNode } from '@/utils/storeUtils';
import type { NodeId, SingleNodeActionProps, CoreActionProps, CoreNodeActionProps } from '@/types/outliner';

const INITIAL_ROOT_ID = 'root';

export interface AddNodeProps extends CoreActionProps {
    parentId: NodeId | null;
    index?: number;
    shouldFocus?: boolean;
}

export const addNode = ({
    get,
    set,
    parentId,
    index,
    shouldFocus = true
}: AddNodeProps) => {
    const { doc, rootNodeId } = get();
    if (!doc) return;

    const newId = generateId();

    doc.transact(() => {
        const yNodes = doc.getMap('nodes');
        const targetParentId = parentId || rootNodeId;

        const parentYNode = yNodes.get(targetParentId) as Y.Map<any>;
        if (!parentYNode) {
            if (targetParentId === INITIAL_ROOT_ID && !yNodes.has(INITIAL_ROOT_ID)) {
                const root = new Y.Map();
                root.set('id', INITIAL_ROOT_ID);
                root.set('content', 'Root');
                root.set('parentId', null);
                root.set('children', new Y.Array());
                root.set('isCollapsed', false);
                root.set('type', 'text');
                root.set('completed', false);
                root.set('meta', {});
                root.set('updatedAt', Date.now());
                yNodes.set(INITIAL_ROOT_ID, root);
            } else {
                return;
            }
        }
        const safeParent = yNodes.get(targetParentId) as Y.Map<any>;

        const newNodeData = createInitialNode(newId);
        newNodeData.parentId = targetParentId;

        const newNodeMap = new Y.Map();
        newNodeMap.set('id', newNodeData.id);
        newNodeMap.set('content', newNodeData.content);
        newNodeMap.set('parentId', newNodeData.parentId);
        newNodeMap.set('children', new Y.Array());
        newNodeMap.set('isCollapsed', newNodeData.isCollapsed);
        newNodeMap.set('type', newNodeData.type);
        newNodeMap.set('completed', newNodeData.completed);
        newNodeMap.set('meta', newNodeData.meta || {});
        newNodeMap.set('updatedAt', Date.now());

        yNodes.set(newId, newNodeMap);

        const parentChildren = safeParent.get('children') as Y.Array<string>;
        if (typeof index === 'number' && index >= 0) {
            parentChildren.insert(index, [newId]);
        } else {
            parentChildren.push([newId]);
        }

        safeParent.set('updatedAt', Date.now());
    });

    if (shouldFocus) {
        set({ focusedId: newId, focusCursorPos: 0 });
    }

    return newId;
};

export interface AddNodeBeforeProps extends CoreActionProps {
    siblingId: NodeId;
}

export const addNodeBefore = ({
    get,
    set,
    siblingId
}: AddNodeBeforeProps) => {
    const { doc } = get();
    if (!doc) return;

    const yNodes = doc.getMap('nodes');
    const node = yNodes.get(siblingId) as Y.Map<any>;
    if (!node) return;

    const parentId = node.get('parentId');
    const parent = yNodes.get(parentId) as Y.Map<any>;
    if (!parent) return;

    const children = parent.get('children') as Y.Array<string>;
    const arr = children.toArray();
    const index = arr.indexOf(siblingId);

    if (index !== -1) {
        addNode({ get, set, parentId, index, shouldFocus: false });
        set({ focusedId: siblingId, focusCursorPos: 0 });
    }
};

export const deleteNode = ({
    get,
    set,
    id
}: CoreNodeActionProps) => {
    const { doc } = get();
    if (!doc) return;

    let nextFocusId: string | null = null;
    let nextCursorPos: number | null = null;

    doc.transact(() => {
        const yNodes = doc.getMap('nodes');
        const node = yNodes.get(id) as Y.Map<any>;
        if (!node) return;

        const parentId = node.get('parentId');
        const parent = yNodes.get(parentId) as Y.Map<any>;

        if (parent) {
            const children = parent.get('children') as Y.Array<string>;
            const arr = children.toArray();
            const index = arr.indexOf(id);

            if (index > 0) {
                let targetId = arr[index - 1];
                let targetNode = yNodes.get(targetId) as Y.Map<any>;

                while (targetNode) {
                    const isCollapsed = targetNode.get('isCollapsed');
                    const tChildren = targetNode.get('children') as Y.Array<string>;

                    if (!isCollapsed && tChildren.length > 0) {
                        const tArr = tChildren.toArray();
                        targetId = tArr[tArr.length - 1];
                        targetNode = yNodes.get(targetId) as Y.Map<any>;
                    } else {
                        break;
                    }
                }

                if (targetId) {
                    nextFocusId = targetId;
                    const content = (targetNode?.get('content') as string) || '';
                    nextCursorPos = content.length;
                }
            } else {
                const { hoistedNodeId } = get();
                const isVisualRoot = parentId === 'root' || parentId === hoistedNodeId;

                if (!isVisualRoot) {
                    nextFocusId = parentId;
                    const pNode = yNodes.get(parentId) as Y.Map<any>;
                    const content = (pNode?.get('content') as string) || '';
                    nextCursorPos = content.length;
                } else {
                    if (index < arr.length - 1) {
                        nextFocusId = arr[index + 1];
                        nextCursorPos = 0;
                    } else if (parentId === hoistedNodeId) {
                        nextFocusId = hoistedNodeId;
                        const hNode = yNodes.get(hoistedNodeId) as Y.Map<any>;
                        const hContent = (hNode?.get('content') as string) || '';
                        nextCursorPos = hContent.length;
                    }
                }
            }

            children.delete(index, 1);
        }

        const deleteRecursively = (targetId: string) => {
            const target = yNodes.get(targetId) as Y.Map<any>;
            if (!target) return;
            const children = target.get('children') as Y.Array<string>;
            if (children) {
                children.forEach((childId: string) => deleteRecursively(childId));
            }
            yNodes.delete(targetId);
        };

        deleteRecursively(id);
    });

    if (nextFocusId) {
        set({ focusedId: nextFocusId, focusCursorPos: nextCursorPos });
    }
};

export interface UpdateContentProps extends SingleNodeActionProps {
    content: string;
}

export const updateContent = ({
    get,
    id,
    content
}: UpdateContentProps) => {
    const { doc } = get();
    if (!doc) return;

    doc.transact(() => {
        const yNodes = doc.getMap('nodes');
        const node = yNodes.get(id) as Y.Map<any>;
        if (node) {
            node.set('content', content);
            node.set('updatedAt', Date.now());
        }
    });
};

export const toggleCollapse = ({
    get,
    id
}: SingleNodeActionProps) => {
    const { doc } = get();
    if (!doc) return;
    doc.transact(() => {
        const yNodes = doc.getMap('nodes');
        const node = yNodes.get(id) as Y.Map<any>;
        if (node) {
            node.set('isCollapsed', !node.get('isCollapsed'));
        }
    });
};
