export type NodeId = string;

export interface NodeData {
    id: NodeId;
    content: string;
    parentId: NodeId | null;
    children: NodeId[];
    isCollapsed: boolean;
    createdAt?: number; // Unix timestamp
    updatedAt?: number; // Unix timestamp
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
    | 'deleteNode' // General delete (e.g. Backspace on empty)
    | 'deleteLine' // Explicit delete line (e.g. Cmd+Shift+K)
    | 'copyNode'
    | 'cutNode'
    | 'pasteNode'
    | 'selectAll' // Ctrl+A behavior
    | 'selectLine' // Ctrl+L behavior
    | 'toggleCollapse'
    | 'zoomIn'
    | 'zoomOut'
    | 'formatBold'
    | 'formatItalic'
    | 'formatStrike'
    | 'undo'
    | 'redo'
    | 'search';

export interface OutlinerSettings {
    theme: 'light' | 'dark';
    splitBehavior: 'sibling' | 'child' | 'auto';
    linkClickBehavior: 'edit' | 'select' | 'navigate'; // 'edit' = focus input, 'select' = regular selection, 'navigate' = follow link
    keybindings: Record<KeyAction, Keybinding>;
}

export interface OutlinerState {
    nodes: Record<NodeId, NodeData>;
    rootNodeId: NodeId;
    focusedId: NodeId | null;
    hoistedNodeId: NodeId | null;
    focusCursorPos: number | null;
    flashId: NodeId | null;
    backlinks: Record<NodeId, NodeId[]>; // TargetID -> SourceIDs

    // Actions
    addNode: (parentId: NodeId | null, index?: number) => void;
    deleteNode: (id: NodeId) => void;
    updateContent: (id: NodeId, content: string) => void;
    setFocus: (id: NodeId | null, cursorPos?: number | null) => void;
    navigateToNode: (id: NodeId) => void; // Added
    setFlashId: (id: NodeId | null) => void;
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
    // Yjs / CRDT properties
    doc?: any; // typed as Y.Doc in implementation, but interface might need generic or loose type to avoid strict coupling in types file if Yjs not imported here. Better to import Y from yjs.
    provider?: any;
    initializeSync: () => Promise<void>;
    // Auth
    user: any | null; // Placeholder, better if imported from AuthSlice
    session: any | null;
    isAuthLoading: boolean;
    initializeAuth: () => Promise<void>;
    signOut: () => Promise<void>;

    // Sync
    isSyncing: boolean;
    lastSyncedAt: Date | null;
    pullFromCloud: () => Promise<void>;
    pushToCloud: () => Promise<void>;

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
