import type { NodeId, NodeData, NodeTransferData, NodeMetadata } from './nodes';
import type { Keybinding, KeyAction, OutlinerSettings } from './settings';
import type { Document, BacklinkItem } from './documents';

export interface ClipboardDocument {
    id: string;
    op: 'cut' | 'copy';
}

export interface BaseActionProps {
    get: () => OutlinerState;
}

export interface CoreActionProps extends BaseActionProps {
    set: (state: Partial<OutlinerState>) => void;
}

export interface SingleNodeActionProps extends BaseActionProps {
    id: NodeId;
}

export interface MultiNodeActionProps extends BaseActionProps {
    ids: NodeId[];
}

export interface CoreNodeActionProps extends CoreActionProps {
    id: NodeId;
}

export interface SlashMenuState {
    isOpen: boolean;
    position: { x: number; y: number } | null;
    targetNodeId: NodeId | null;
    filterText: string;
}

export interface NodeSlice {
    nodes: Record<NodeId, NodeData>;
    rootNodeId: NodeId;
    hoistedNodeId: NodeId | null;

    addNode: (parentId: NodeId | null, index?: number, shouldFocus?: boolean) => void;
    deleteNode: (id: NodeId) => void;
    deleteNodes: (ids: NodeId[]) => void;
    updateContent: (id: NodeId, content: string) => void;
    toggleCollapse: (id: NodeId) => void;
    indentNode: (id: NodeId) => void;
    outdentNode: (id: NodeId) => void;
    indentNodes: (ids: NodeId[]) => void;
    outdentNodes: (ids: NodeId[]) => void;
    moveNode: (id: NodeId, direction: 'up' | 'down') => void;
    setHoistedNode: (id: NodeId | null) => void;
    pasteNodes: (parentId: NodeId, index: number, nodes: NodeTransferData[]) => void;
    splitNode: (id: NodeId, cursorPosition: number) => void;
    mergeNode: (id: NodeId) => void;
    updateType: (id: NodeId, type: string, attributes?: NodeMetadata) => void;
    toggleComplete: (id: NodeId) => void;
    addNodeBefore: (siblingId: NodeId) => void;
}

export interface SettingsSlice {
    settings: OutlinerSettings;
    setSetting: <K extends keyof OutlinerSettings>(key: K, value: OutlinerSettings[K]) => void;
    setKeybinding: (action: KeyAction, binding: Keybinding) => void;
    resetKeybindings: () => void;
}

export interface FocusSlice {
    focusedId: NodeId | null;
    focusCursorPos: number | null;
    setFocus: (id: NodeId | null, cursorPos?: number | null) => void;
    moveFocus: (direction: 'up' | 'down', select?: boolean) => boolean;
}

export interface SelectionSlice {
    selectedIds: NodeId[];
    selectionAnchorId: NodeId | null;
    selectNode: (id: NodeId, multi?: boolean) => void;
    deselectAll: () => void;
    selectRange: (targetId: NodeId) => void;
    expandSelection: (currentId: NodeId) => void;
}

export interface OutlinerState extends NodeSlice, SettingsSlice, FocusSlice, SelectionSlice {
    backlinks: BacklinkItem[];
    flashId: NodeId | null;

    // Multi-document State
    documents: Document[];
    activeDocumentId: string | null;

    // Document Actions
    createDocument: (title: string, parentId?: string | null, isFolder?: boolean) => Promise<void>;
    deleteDocument: (id: string) => Promise<void>;
    renameDocument: (id: string, title: string) => Promise<void>;
    moveDocument: (id: string, newParentId: string | null) => Promise<void>;
    cloneDocument: (id: string) => Promise<void>;
    updateDocumentRank: (id: string, rank: string) => Promise<void>;
    setActiveDocument: (id: string | null) => Promise<void>;
    fetchDocuments: () => Promise<void>;

    // Clipboard State
    clipboardDocument: ClipboardDocument | null;
    setClipboardDocument: (clipboard: ClipboardDocument | null) => void;

    // Slash Menu State
    slashMenu: SlashMenuState;
    setSlashMenu: (state: Partial<SlashMenuState>) => void;

    // Global Actions
    navigateToNode: (id: NodeId) => void;
    setFlashId: (id: NodeId | null) => void;

    // Yjs / CRDT properties
    doc?: any; // Y.Doc
    provider?: any;
    undoManager?: any;
    undo: () => void;
    redo: () => void;
    forceSync: () => Promise<void>;
    initializeSync: () => Promise<void>;

    // Auth
    user: any | null;
    session: any | null;
    isAuthLoading: boolean;
    initializeAuth: () => Promise<void>;
    signOut: () => Promise<void>;

    fetchBacklinks: (docId: string) => Promise<void>;

    // Sync
    isSyncing: boolean;
    lastSyncedAt: Date | null;
    pullFromCloud: () => Promise<void>;
    pushToCloud: () => Promise<void>;
}
