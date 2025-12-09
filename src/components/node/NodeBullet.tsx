import React from 'react';
import { ChevronRight, ChevronDown, ZoomIn } from 'lucide-react';
import type { NodeId, NodeData } from '@/types/outliner';
import { useNodeLogic } from '@/hooks/node/useNodeLogic';

interface NodeBulletProps {
    id: NodeId;
}

export const NodeBullet: React.FC<NodeBulletProps> = ({ id }) => {
    const { node, toggleCollapse, setHoistedNode } = useNodeLogic(id);

    if (!node) return null;

    return (
        <div className="oo-node-bullet w-6 h-6 flex items-center justify-center mr-1 cursor-pointer text-gray-400 hover:text-gray-600 relative group/bullet">
            {/* Zoom Button (only visible on hover) */}
            <div
                className="absolute right-full mr-1 opacity-0 group-hover/bullet:opacity-100 transition-opacity p-0.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                title="Zoom In"
                onClick={(e) => {
                    e.stopPropagation();
                    setHoistedNode(id);
                }}
            >
                <ZoomIn size={14} />
            </div>

            <span onClick={(e) => { e.stopPropagation(); toggleCollapse(id); }}>
                {node.children.length > 0 && (
                    !node.isCollapsed ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                )}
                {node.children.length === 0 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
            </span>
        </div>
    );
};
