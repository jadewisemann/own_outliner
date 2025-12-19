import * as Y from 'yjs';
import type { NodeMetadata, SingleNodeActionProps } from '@/types/outliner';

export interface UpdateTypeProps extends SingleNodeActionProps {
    type: string;
    attributes?: NodeMetadata;
}

export const updateType = ({
    get,
    id,
    type,
    attributes
}: UpdateTypeProps) => {
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

export const toggleComplete = ({
    get,
    id
}: SingleNodeActionProps) => {
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
