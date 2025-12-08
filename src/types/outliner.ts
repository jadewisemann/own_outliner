export type NodeId = string;

export interface NodeData {
    id: NodeId;
    content: string;
    parentId: NodeId | null;
    children: NodeId[];
    isCollapsed: boolean;
}

// Keybindings definitions
export interface Keybinding {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
}

export type KeyAction =
    | 'splitNode'
    | 'mergeNode'
    | 'indentNode'
    | 'outdentNode'
    | 'moveUp'
    | 'moveDown'
    | 'deleteNode'
    | 'copyNode'
    | 'cutNode'
    | 'pasteNode'
    | 'selectAll'
    | 'toggleCollapse';

export interface OutlinerSettings {
    splitBehavior: 'sibling' | 'child' | 'auto';
    keybindings: Record<KeyAction, Keybinding>;
}

export interface OutlinerState {
    nodes: Record<NodeId, NodeData>;
    rootNodeId: NodeId;
    focusedId: NodeId | null;
    hoistedNodeId: NodeId | null;
    focusCursorPos: number | null;

    // Actions
    addNode: (parentId: NodeId | null, index?: number) => void;
    deleteNode: (id: NodeId) => void;
    updateContent: (id: NodeId, content: string) => void;
    setFocus: (id: NodeId | null, cursorPos?: number | null) => void;
    toggleCollapse: (id: NodeId) => void;
    indentNode: (id: NodeId) => void;
    outdentNode: (id: NodeId) => void;
    indentNodes: (ids: NodeId[]) => void;
    outdentNodes: (ids: NodeId[]) => void;
    moveFocus: (direction: 'up' | 'down', select?: boolean) => void;
    moveNode: (id: NodeId, direction: 'up' | 'down') => void;
    setHoistedNode: (id: NodeId | null) => void;

    // Complex action
    pasteNodes: (parentId: NodeId, index: number, nodes: { content: string, children: any[] }[]) => void;
    splitNode: (id: NodeId, cursorPosition: number) => void;
    mergeNode: (id: NodeId) => void;

    // Settings
    settings: OutlinerSettings;
    setSetting: <K extends keyof OutlinerSettings>(key: K, value: OutlinerSettings[K]) => void;
    setKeybinding: (action: KeyAction, binding: Keybinding) => void;
    resetKeybindings: () => void;

    // Selection
    selectedIds: NodeId[];
    selectionAnchorId: NodeId | null;

    selectNode: (id: NodeId, multi?: boolean) => void;
    deselectAll: () => void;
    selectRange: (targetId: NodeId) => void;
    expandSelection: (currentId: NodeId) => void;
    deleteNodes: (ids: NodeId[]) => void;
}
