import { useMemo } from 'react';
import { useOutlinerStore } from '../store/useOutlinerStore';
import type { NodeId } from '../types/outliner';

export interface FlatNode {
    id: NodeId;
    level: number;
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
