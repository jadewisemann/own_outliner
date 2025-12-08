import { useMemo } from 'react';
import { useOutlinerStore } from '../store/useOutlinerStore';
import type { NodeId } from '../types/outliner';

export interface FlatNode {
    id: NodeId;
    level: number;
    // We can include other data if needed, but components pull from store by ID usually
}

export const useVisibleNodes = () => {
    const nodes = useOutlinerStore((state) => state.nodes);
    const rootNodeId = useOutlinerStore((state) => state.rootNodeId);
    const hoistedNodeId = useOutlinerStore((state) => state.hoistedNodeId);

    const activeRootId = hoistedNodeId || rootNodeId;

    return useMemo(() => {
        const flatList: FlatNode[] = [];

        const traverse = (nodeId: NodeId, level: number) => {
            const node = nodes[nodeId];
            if (!node) return;

            // Don't modify the object directly, just read
            if (node.children && node.children.length > 0) {
                node.children.forEach(childId => {
                    flatList.push({ id: childId, level });
                    const childNode = nodes[childId];
                    if (childNode && !childNode.isCollapsed) {
                        traverse(childId, level + 1);
                    }
                });
            }
        };

        const root = nodes[activeRootId];
        if (root) {
            // We start traversing children of root at level 0
            // If we hoised a node, that node is effective root, its children are level 0
            // Wait, if I hoist a node, I am seeing INSIDE it.
            // So its children are at level 0 (visually)? 
            // Previous code: `activeRoot.children.map(child => <NodeItem level={0} ...)`
            // Yes, children of hoisted node start at 0.

            // Standard flatten
            if (root.children) {
                root.children.forEach(childId => {
                    flatList.push({ id: childId, level: 0 });
                    const childNode = nodes[childId];
                    if (childNode && !childNode.isCollapsed) {
                        traverse(childId, 1);
                    }
                });
            }
        }

        return flatList;
    }, [nodes, activeRootId]);
};
