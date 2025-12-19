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

// --- Move Node Logic (Visual Block Swap + Passive Depth Adjustment) ---

export const moveNode = ({
    get,
    id,
    direction
}: MoveNodeActionProps) => {
    const { doc, nodes, rootNodeId, hoistedNodeId } = get();
    if (!doc) return;

    doc.transact(() => {
        const yNodes = doc.getMap('nodes');
        const activeRootId = hoistedNodeId || rootNodeId;

        // 1. Build flat list of visible nodes
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

        // Identify subtree range
        const originalDepth = fullList[startIndex].depth;
        let endIndex = startIndex;
        for (let i = startIndex + 1; i < fullList.length; i++) {
            if (fullList[i].depth > originalDepth) endIndex = i;
            else break;
        }

        let newPrevNodeIdx = -1;
        let referenceNodeIdx = -1; // Node to use for positioning (insert before or after)

        if (direction === 'up') {
            if (startIndex === 0) return; // Visual top

            // To move up meaningfully, we must jump before the "head" of the block above us.
            // If the node at startIndex-1 is a descendant of a sibling, we skip the whole sibling block.
            let refIdx = startIndex - 1;
            while (refIdx > 0 && fullList[refIdx].depth > originalDepth) {
                refIdx--;
            }
            referenceNodeIdx = refIdx;
            newPrevNodeIdx = refIdx - 1;
        } else {
            if (endIndex === fullList.length - 1) return; // Visual bottom

            // Jump AFTER the block starting at endIndex + 1
            const neighborIdx = endIndex + 1;
            const neighborDepth = fullList[neighborIdx].depth;
            let neighborEndIdx = neighborIdx;
            for (let i = neighborIdx + 1; i < fullList.length; i++) {
                if (fullList[i].depth > neighborDepth) neighborEndIdx = i;
                else break;
            }
            referenceNodeIdx = neighborEndIdx;
            newPrevNodeIdx = neighborEndIdx;
        }

        const newPrev = newPrevNodeIdx >= 0 ? fullList[newPrevNodeIdx] : null;
        const refNode = fullList[referenceNodeIdx];

        // 2. Passive Depth Adjustment
        const maxAllowedDepth = newPrev ? newPrev.depth + 1 : 0;
        const targetDepth = Math.min(originalDepth, maxAllowedDepth);

        // 3. Resolve Target Parent & Index
        let targetParentId: string = activeRootId;
        let targetIndex: number = 0;

        if (targetDepth === 0) {
            targetParentId = activeRootId;
            // Find which level-0 node we are near
            let refAtLevel0 = refNode;
            while (refAtLevel0.depth > 0 && refAtLevel0.parentId !== activeRootId) {
                const p = fullList.find(item => item.id === refAtLevel0.parentId);
                if (!p) break;
                refAtLevel0 = p;
            }
            const rootY = yNodes.get(activeRootId) as Y.Map<any>;
            const rootChildren = rootY.get('children') as Y.Array<string>;
            const refIdxInRoot = rootChildren.toArray().indexOf(refAtLevel0.id);
            targetIndex = direction === 'up' ? refIdxInRoot : refIdxInRoot + 1;
        } else {
            // targetDepth > 0, so newPrev must exist
            if (!newPrev) return; // Defensive

            if (targetDepth === newPrev.depth + 1) {
                targetParentId = newPrev.id;
                targetIndex = 0; // Enter as first child
            } else {
                // Sibling of some ancestor of newPrev
                let anc = newPrev;
                while (anc.depth > targetDepth && anc.parentId !== activeRootId) {
                    const p = fullList.find(item => item.id === anc.parentId);
                    if (!p) break;
                    anc = p;
                }
                targetParentId = anc.parentId;
                const pY = yNodes.get(targetParentId) as Y.Map<any>;
                const pChildren = pY.get('children') as Y.Array<string>;
                targetIndex = pChildren.toArray().indexOf(anc.id) + 1;
            }
        }

        // 4. Execution
        const node = yNodes.get(id) as Y.Map<any>;
        const oldParentId = node.get('parentId');
        const oldParentY = yNodes.get(oldParentId) as Y.Map<any>;
        const oldChildren = oldParentY.get('children') as Y.Array<string>;
        const oldIndex = oldChildren.toArray().indexOf(id);

        if (oldParentId === targetParentId && oldIndex < targetIndex) {
            targetIndex--;
        }

        oldChildren.delete(oldIndex, 1);
        const targetP = yNodes.get(targetParentId) as Y.Map<any>;
        const targetC = targetP.get('children') as Y.Array<string>;

        if (targetIndex >= targetC.length || targetIndex === -1) {
            targetC.push([id]);
        } else {
            targetC.insert(Math.max(0, targetIndex), [id]);
        }
        node.set('parentId', targetParentId);
    });
};
