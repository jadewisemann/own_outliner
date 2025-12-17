import React from 'react';
import { useOutlinerStore } from '@/store/outlinerStore';
import type { NodeId } from '@/types/outliner';

interface NodeReferenceProps {
    nodeId: NodeId;
    children?: React.ReactNode;
}

export const NodeReference: React.FC<NodeReferenceProps> = ({ nodeId, children }) => {
    // Select specific node content to avoid re-rendering entire tree
    // We use a selector. 
    // Is zustand selector stable? Yes.
    const nodeContent = useOutlinerStore(state => state.nodes[nodeId]?.content);

    const state = useOutlinerStore.getState();

    const handleClick = (e: React.MouseEvent) => {
        // Critical: Stop propagation to prevent NodeItem selection
        e.preventDefault();
        e.stopPropagation();

        console.log('Link clicked:', nodeId);

        if (state.navigateToNode) {
            state.navigateToNode(nodeId);
        } else {
            console.warn('navigateToNode action not available');
            state.setFocus(nodeId, 0); // Fallback
        }
    };

    if (nodeContent === undefined) {
        return <span className="text-red-400 bg-red-900/20 px-1 rounded text-xs select-none">Link Broken</span>;
    }

    // If specific label (children) is provided, use it. Otherwise use dynamic node content.
    const displayContent = children || (nodeContent && nodeContent.length > 30 ? nodeContent.slice(0, 30) + '...' : nodeContent);
    const finalContent = displayContent || "Empty Node";

    return (
        <span
            onClick={handleClick}
            className="
                text-blue-600 hover:text-blue-800 underline decoration-blue-300/50 hover:decoration-blue-800
                cursor-pointer hover:bg-blue-50 rounded px-0.5 -mx-0.5 transition-colors
                pointer-events-auto
            "
            title={`Link to: ${nodeContent}`}
        >
            <span className="opacity-50 text-[10px] mr-1">@</span>
            {finalContent}
        </span>
    );
};
