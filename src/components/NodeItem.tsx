import React from 'react';
import type { NodeId } from '@/types/outliner';
import { NodeShell } from './node/NodeShell';
import { NodeContent } from './node/NodeContent';

interface NodeItemProps {
    id: NodeId;
    level?: number;
}

export const NodeItem: React.FC<NodeItemProps> = ({ id, level = 0 }) => {
    return (
        <NodeShell id={id} level={level}>
            <NodeContent id={id} />
        </NodeShell>
    );
};
