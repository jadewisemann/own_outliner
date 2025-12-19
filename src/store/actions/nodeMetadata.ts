import * as Y from 'yjs';
import type { NodeId, OutlinerState, NodeMetadata } from '@/types/outliner';

export const updateType = (
    get: () => OutlinerState,
    id: NodeId,
    type: string,
    attributes?: NodeMetadata
) => {
    const { doc } = get();
    if (!doc) return;

    doc.transact(() => {
        const yNodes = doc.getMap('nodes');
        const node = yNodes.get(id) as Y.Map<any>;
        if (node) {
            node.set('type', type);
            if (attributes) {
                node.set('meta', attributes);
            }
            node.set('updatedAt', Date.now());
        }
    });
};

export const toggleComplete = (
    get: () => OutlinerState,
    id: NodeId
) => {
    const { doc } = get();
    if (!doc) return;

    doc.transact(() => {
        const yNodes = doc.getMap('nodes');
        const node = yNodes.get(id) as Y.Map<any>;
        if (node) {
            const current = node.get('completed');
            node.set('completed', !current);
            node.set('updatedAt', Date.now());
        }
    });
};
