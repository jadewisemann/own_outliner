export type NodeId = string;

export interface NodeData {
    id: NodeId;
    content: string;
    parentId: NodeId | null;
    children: NodeId[];
    isCollapsed: boolean;
}

export interface OutlinerState {
    nodes: Record<NodeId, NodeData>;
    rootNodeId: NodeId;
    focusedId: NodeId | null;

    // Actions
    addNode: (parentId: NodeId | null, index?: number) => void;
    deleteNode: (id: NodeId) => void;
    updateContent: (id: NodeId, content: string) => void;
    setFocus: (id: NodeId | null) => void;
    toggleCollapse: (id: NodeId) => void;
    indentNode: (id: NodeId) => void; // Placeholder for Phase 3
    outdentNode: (id: NodeId) => void; // Placeholder for Phase 3
    moveFocus: (direction: 'up' | 'down') => void;
}
