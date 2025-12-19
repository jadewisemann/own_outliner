import * as Y from 'yjs';
import { generateId } from '@/utils/storeUtils';
import type { NodeId, NodeTransferData, BaseActionProps, CoreNodeActionProps } from '@/types/outliner';

export interface PasteNodesProps extends BaseActionProps {
    parentId: NodeId;
    index: number;
    nodesData: NodeTransferData[];
}

export const pasteNodes = ({
    get,
    parentId,
    index,
    nodesData
}: PasteNodesProps) => {
    const { doc } = get();
    if (!doc) return;

    doc.transact(() => {
        const yNodes = doc.getMap('nodes');
        const parent = yNodes.get(parentId) as Y.Map<any>;
        if (!parent) return;

        const processNode = (data: NodeTransferData, pId: string): string => {
            const newId = generateId();
            const nodeMap = new Y.Map();
            nodeMap.set('id', newId);
            nodeMap.set('content', data.content);
            nodeMap.set('parentId', pId);
            nodeMap.set('isCollapsed', false);
            nodeMap.set('type', data.type || 'text');
            nodeMap.set('completed', data.completed || false);
            nodeMap.set('meta', data.meta || {});
            nodeMap.set('updatedAt', Date.now());

            const childrenArray = new Y.Array();
            if (data.children && data.children.length > 0) {
                const childIds = data.children.map(child => processNode(child, newId));
                childrenArray.push(childIds);
            }
            nodeMap.set('children', childrenArray);

            yNodes.set(newId, nodeMap);
            return newId;
        };

        const addedIds = nodesData.map(n => processNode(n, parentId));

        const children = parent.get('children') as Y.Array<string>;
        if (typeof index === 'number' && index >= 0) {
            children.insert(index, addedIds);
        } else {
            children.push(addedIds);
        }
    });
};

export interface SplitNodeProps extends CoreNodeActionProps {
    cursorPosition: number;
}

export const splitNode = ({
    get,
    set,
    id,
    cursorPosition
}: SplitNodeProps) => {
    const { doc, settings } = get();
    if (!doc) return;

    const newId = generateId();

    doc.transact(() => {
        const yNodes = doc.getMap('nodes');
        const node = yNodes.get(id) as Y.Map<any>;
        if (!node) return;

        const content = node.get('content') as string;
        const isStart = cursorPosition === 0;
        const leftContent = isStart ? content : content.slice(0, cursorPosition);
        const rightContent = isStart ? '' : content.slice(cursorPosition);

        const children = node.get('children') as Y.Array<string>;
        const childCount = children.length;

        let behavior = settings.splitBehavior;
        if (behavior === 'auto') {
            behavior = childCount > 0 ? 'child' : 'sibling';
        }

        const newNode = new Y.Map();
        newNode.set('id', newId);
        newNode.set('content', rightContent);
        newNode.set('children', new Y.Array());
        newNode.set('isCollapsed', false);
        newNode.set('type', 'text');
        newNode.set('completed', false);
        newNode.set('meta', {});
        newNode.set('updatedAt', Date.now());

        node.set('content', leftContent);

        if (behavior === 'child') {
            newNode.set('parentId', id);
            children.insert(0, [newId]);
            yNodes.set(newId, newNode);
        } else {
            const parentId = node.get('parentId');
            const parent = yNodes.get(parentId) as Y.Map<any>;
            newNode.set('parentId', parentId);

            const pChildren = parent.get('children') as Y.Array<string>;
            const idx = pChildren.toArray().indexOf(id);
            pChildren.insert(idx + 1, [newId]);

            yNodes.set(newId, newNode);
        }
    });

    set({ focusedId: newId, focusCursorPos: 0 });
};

export const mergeNode = ({
    get,
    set,
    id
}: CoreNodeActionProps) => {
    const { doc } = get();
    if (!doc) return;

    let targetFocusId: string | null = null;
    let targetCursorPos: number | null = null;

    doc.transact(() => {
        const yNodes = doc.getMap('nodes');
        const node = yNodes.get(id) as Y.Map<any>;
        if (!node) return;

        const parentId = node.get('parentId');
        const parent = yNodes.get(parentId) as Y.Map<any>;
        const children = parent.get('children') as Y.Array<string>;
        const idx = children.toArray().indexOf(id);

        if (idx <= 0) return;

        const prevSiblingId = children.get(idx - 1);
        const prevSibling = yNodes.get(prevSiblingId) as Y.Map<any>;

        const prevContent = prevSibling.get('content') as string;
        const myContent = node.get('content') as string;

        targetFocusId = prevSiblingId;
        targetCursorPos = prevContent.length;

        prevSibling.set('content', prevContent + myContent);

        const myChildren = node.get('children') as Y.Array<string>;
        const myChildrenArr = myChildren.toArray();
        const prevChildren = prevSibling.get('children') as Y.Array<string>;

        myChildrenArr.forEach((childId: string) => {
            const child = yNodes.get(childId) as Y.Map<any>;
            if (child) child.set('parentId', prevSiblingId);
        });

        prevChildren.push(myChildrenArr);

        children.delete(idx, 1);
        yNodes.delete(id);
    });

    if (targetFocusId) {
        set({ focusedId: targetFocusId, focusCursorPos: targetCursorPos });
    }
};
