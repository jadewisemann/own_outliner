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

        // 1. Build flat list of currently visible nodes
        const activeRootId = hoistedNodeId || rootNodeId;
        const fullList: Array<{ id: string; parentId: string; depth: number }> = [];

        const traverse = (nodeId: string, depth: number) => {
            const n = nodes[nodeId];
            if (!n) return;
            if (nodeId !== activeRootId) {
                fullList.push({ id: nodeId, parentId: n.parentId!, depth });
            }
            if (!n.isCollapsed && n.children.length > 0) {
                n.children.forEach((childId: string) => traverse(childId, depth + 1));
            }
        };
        traverse(activeRootId, -1);

        const startIndex = fullList.findIndex(item => item.id === id);
        if (startIndex === -1) return;

        // 2. Identify the range of the moving subtree
        let endIndex = startIndex;
        const startDepth = fullList[startIndex].depth;
        for (let i = startIndex + 1; i < fullList.length; i++) {
            if (fullList[i].depth > startDepth) endIndex = i;
            else break;
        }

        const oldParentId = fullList[startIndex].parentId;
        const oldParentY = yNodes.get(oldParentId) as Y.Map<any>;
        const oldChildren = oldParentY.get('children') as Y.Array<string>;
        const oldIndex = oldChildren.toArray().indexOf(id);

        let targetParentId: string | null = null;
        let targetIndex: number = 0;

        if (direction === 'up') {
            if (startIndex === 0) return; // Already at top

            const neighbor = fullList[startIndex - 1];
            // If the neighbor is our parent, move us to be a sibling of the parent (above it)
            if (neighbor.id === oldParentId) {
                const grandparentId = neighbor.parentId;
                const grandparentY = yNodes.get(grandparentId) as Y.Map<any>;
                if (!grandparentY) return;
                const grandChildren = grandparentY.get('children') as Y.Array<string>;
                targetParentId = grandparentId;
                targetIndex = grandChildren.toArray().indexOf(neighbor.id);
            } else {
                // Otherwise, move us to be a sibling of the neighbor (at its position)
                targetParentId = neighbor.parentId;
                const parentY = yNodes.get(targetParentId) as Y.Map<any>;
                const parentChildren = parentY.get('children') as Y.Array<string>;
                targetIndex = parentChildren.toArray().indexOf(neighbor.id);
            }
        } else {
            if (endIndex === fullList.length - 1) return; // Already at bottom

            const neighbor = fullList[endIndex + 1];
            const neighborData = nodes[neighbor.id];

            // If neighbor is expanded and has children, move us to be its first child
            if (neighborData && !neighborData.isCollapsed && neighborData.children.length > 0) {
                targetParentId = neighbor.id;
                targetIndex = 0;
            } else {
                // Otherwise, move us to be a sibling of the neighbor (after it)
                targetParentId = neighbor.parentId;
                const parentY = yNodes.get(targetParentId) as Y.Map<any>;
                const parentChildren = parentY.get('children') as Y.Array<string>;
                targetIndex = parentChildren.toArray().indexOf(neighbor.id) + 1;
            }
        }

        if (targetParentId) {
            oldChildren.delete(oldIndex, 1);
            const targetY = yNodes.get(targetParentId) as Y.Map<any>;
            const targetChildren = targetY.get('children') as Y.Array<string>;

            if (targetIndex >= targetChildren.length || targetIndex === -1) {
                targetChildren.push([id]);
            } else {
                targetChildren.insert(targetIndex, [id]);
            }
            node.set('parentId', targetParentId);
        }
    });
};
