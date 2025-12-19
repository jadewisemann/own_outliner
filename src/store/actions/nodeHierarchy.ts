import * as Y from 'yjs';
import type { SingleNodeActionProps, MultiNodeActionProps } from '@/types/outliner';

export interface MoveNodeActionProps extends SingleNodeActionProps {
    direction: 'up' | 'down';
}

export const indentNode = ({
    get,
    id
}: SingleNodeActionProps) => {
    const { doc } = get();
    // ... (omitting body for now, will use multi_replace for precise edits)
    if (!doc) return;

    doc.transact(() => {
        const yNodes = doc.getMap('nodes');
        const node = yNodes.get(id) as Y.Map<any>;
        if (!node) return;

        const parentId = node.get('parentId');
        const parent = yNodes.get(parentId) as Y.Map<any>;
        if (!parent) return;

        const children = parent.get('children') as Y.Array<string>;
        const arr = children.toArray();
        const index = arr.indexOf(id);

        if (index <= 0) return;

        const prevSiblingId = arr[index - 1];
        const prevSibling = yNodes.get(prevSiblingId) as Y.Map<any>;
        if (!prevSibling) return;

        children.delete(index, 1);
        const prevChildren = prevSibling.get('children') as Y.Array<string>;
        prevChildren.push([id]);

        node.set('parentId', prevSiblingId);
        prevSibling.set('isCollapsed', false);
    });
};

export const outdentNode = ({
    get,
    id
}: SingleNodeActionProps) => {
    const { doc, rootNodeId, settings } = get();
    if (!doc) return;

    doc.transact(() => {
        const yNodes = doc.getMap('nodes');
        const node = yNodes.get(id) as Y.Map<any>;
        if (!node) return;

        const parentId = node.get('parentId');
        if (parentId === rootNodeId) return;

        const parent = yNodes.get(parentId) as Y.Map<any>;
        if (!parent) return;

        const grandParentId = parent.get('parentId');
        if (!grandParentId) return;

        const grandParent = yNodes.get(grandParentId) as Y.Map<any>;
        if (!grandParent) return;

        const children = parent.get('children') as Y.Array<string>;
        const arr = children.toArray();
        const index = arr.indexOf(id);
        if (index === -1) return;

        if (!settings.logicalOutdent) {
            const followingSiblings = arr.slice(index + 1);
            if (followingSiblings.length > 0) {
                children.delete(index + 1, followingSiblings.length);
                const nodeChildren = node.get('children') as Y.Array<string>;
                nodeChildren.push(followingSiblings);
                followingSiblings.forEach(sibId => {
                    const sib = yNodes.get(sibId) as Y.Map<any>;
                    if (sib) sib.set('parentId', id);
                });
            }
        }

        children.delete(index, 1);
        const grandChildren = grandParent.get('children') as Y.Array<string>;
        const pIndex = grandChildren.toArray().indexOf(parentId);
        grandChildren.insert(pIndex + 1, [id]);
        node.set('parentId', grandParentId);
    });
};

export const indentNodes = ({
    get,
    ids
}: MultiNodeActionProps) => {
    ids.forEach(id => indentNode({ get, id }));
};

export const outdentNodes = ({
    get,
    ids
}: MultiNodeActionProps) => {
    ids.forEach(id => outdentNode({ get, id }));
};

export const moveNode = ({
    get,
    id,
    direction
}: MoveNodeActionProps) => {
    const { doc, nodes, rootNodeId, hoistedNodeId } = get();
    if (!doc) return;

    doc.transact(() => {
        const yNodes = doc.getMap('nodes');
        const node = yNodes.get(id) as Y.Map<any>;
        if (!node) return;

        interface FlatItem {
            id: string;
            depth: number;
            parentId: string;
        }
        const flatList: FlatItem[] = [];
        const activeRootId = hoistedNodeId || rootNodeId;

        const traverse = (nodeId: string, depth: number) => {
            const n = nodes[nodeId];
            if (!n) return;

            if (nodeId !== activeRootId) {
                flatList.push({ id: nodeId, depth, parentId: n.parentId! });
            }

            if (!n.isCollapsed && n.children.length > 0) {
                n.children.forEach(childId => traverse(childId, depth + 1));
            }
        };

        const root = nodes[activeRootId];
        if (root) {
            root.children.forEach(childId => traverse(childId, 0));
        }

        const currentIndex = flatList.findIndex(item => item.id === id);
        if (currentIndex === -1) return;

        if (direction === 'up') {
            if (currentIndex === 0) return;

            const current = flatList[currentIndex];
            const prev = flatList[currentIndex - 1];
            const newPrev = currentIndex > 1 ? flatList[currentIndex - 2] : null;

            let targetParentId: string;
            let targetIndex: number;
            let targetDepth: number;

            if (current.depth > prev.depth) {
                targetParentId = prev.parentId;
                const parentY = yNodes.get(targetParentId) as Y.Map<any>;
                const parentChildren = parentY.get('children') as Y.Array<string>;
                targetIndex = parentChildren.toArray().indexOf(prev.id);
                targetDepth = prev.depth;
            } else {
                targetDepth = newPrev ? Math.min(current.depth, newPrev.depth + 1) : 0;

                if (!newPrev || targetDepth === 0) {
                    targetParentId = activeRootId;
                    const parentY = yNodes.get(targetParentId) as Y.Map<any>;
                    const parentChildren = parentY.get('children') as Y.Array<string>;
                    const prevIdx = parentChildren.toArray().indexOf(prev.id);
                    targetIndex = prevIdx;
                } else {
                    if (targetDepth > newPrev.depth) {
                        targetParentId = newPrev.id;
                        targetIndex = -1;
                    } else {
                        targetParentId = newPrev.parentId;
                        const parentY = yNodes.get(targetParentId) as Y.Map<any>;
                        const parentChildren = parentY.get('children') as Y.Array<string>;
                        targetIndex = parentChildren.toArray().indexOf(newPrev.id) + 1;
                    }
                }
            }

            const oldParentY = yNodes.get(current.parentId) as Y.Map<any>;
            const oldChildren = oldParentY.get('children') as Y.Array<string>;
            const oldIndex = oldChildren.toArray().indexOf(id);
            oldChildren.delete(oldIndex, 1);

            const newParentY = yNodes.get(targetParentId) as Y.Map<any>;
            const newChildren = newParentY.get('children') as Y.Array<string>;
            if (targetIndex === -1 || targetIndex >= newChildren.length) {
                newChildren.push([id]);
            } else {
                newChildren.insert(targetIndex, [id]);
            }
            node.set('parentId', targetParentId);

        } else {
            if (currentIndex === flatList.length - 1) return;

            const current = flatList[currentIndex];
            const next = flatList[currentIndex + 1];
            const newNext = currentIndex < flatList.length - 2 ? flatList[currentIndex + 2] : null;

            let targetParentId: string;
            let targetIndex: number;

            if (current.depth > next.depth) {
                targetParentId = next.parentId;
                const parentY = yNodes.get(targetParentId) as Y.Map<any>;
                const parentChildren = parentY.get('children') as Y.Array<string>;
                targetIndex = parentChildren.toArray().indexOf(next.id) + 1;
            } else if (current.depth < next.depth) {
                targetParentId = next.id;
                targetIndex = 0;
            } else {
                if (!newNext || newNext.depth <= current.depth) {
                    targetParentId = next.parentId;
                    const parentY = yNodes.get(targetParentId) as Y.Map<any>;
                    const parentChildren = parentY.get('children') as Y.Array<string>;
                    targetIndex = parentChildren.toArray().indexOf(next.id) + 1;
                } else {
                    targetParentId = next.id;
                    targetIndex = 0;
                }
            }

            const oldParentY = yNodes.get(current.parentId) as Y.Map<any>;
            const oldChildren = oldParentY.get('children') as Y.Array<string>;
            const oldIndex = oldChildren.toArray().indexOf(id);
            oldChildren.delete(oldIndex, 1);

            const newParentY = yNodes.get(targetParentId) as Y.Map<any>;
            const newChildren = newParentY.get('children') as Y.Array<string>;
            if (targetIndex === -1 || targetIndex >= newChildren.length) {
                newChildren.push([id]);
            } else {
                newChildren.insert(targetIndex, [id]);
            }
            node.set('parentId', targetParentId);
        }
    });
};
