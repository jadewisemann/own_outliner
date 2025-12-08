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
    hoistedNodeId: NodeId | null; // The node currently being viewed as root
    // Actions
    addNode: (parentId: NodeId | null, index?: number) => void;
    deleteNode: (id: NodeId) => void;
    updateContent: (id: NodeId, content: string) => void;
    setFocus: (id: NodeId | null) => void;
    toggleCollapse: (id: NodeId) => void;
    indentNode: (id: NodeId) => void; // Placeholder for Phase 3
    outdentNode: (id: NodeId) => void; // Placeholder for Phase 3
    moveFocus: (direction: 'up' | 'down', select?: boolean) => void;
    moveNode: (id: NodeId, direction: 'up' | 'down') => void;
    setHoistedNode: (id: NodeId | null) => void;
    // Complex action
    pasteNodes: (parentId: NodeId, index: number, nodes: { content: string, children: any[] }[]) => void;
    splitNode: (id: NodeId, cursorPosition: number) => void;
    mergeNode: (id: NodeId) => void;

    // Settings
    settings: {
        splitBehavior: 'sibling' | 'child' | 'auto';
    };
    setSetting: (key: 'splitBehavior', value: 'sibling' | 'child' | 'auto') => void;

    // Selection
    selectedIds: NodeId[]; // Ordered list of selected IDs for easy range logic? Or Set? Array easier for ordering.
    selectionAnchorId: NodeId | null; // The node where Shift-selection started

    selectNode: (id: NodeId, multi?: boolean) => void;
    deselectAll: () => void;
    selectRange: (targetId: NodeId) => void; // Select from anchor to target
    expandSelection: (currentId: NodeId) => void; // Smart Ctrl+A logic
}
