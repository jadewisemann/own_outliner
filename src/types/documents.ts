export interface Document {
    id: string;
    ownerId: string;
    parentId: string | null;
    title: string;
    isFolder: boolean;
    content?: Uint8Array; // Yjs binary
    createdAt: string;
    updatedAt: string;
    rank?: string; // For manual sorting (lexorank or simple float)
}

export interface ConflictState {
    isOpen: boolean;
    draggedId: string;
    targetId: string | null;
    initialName: string;
}

export interface BacklinkItem {
    id: string;
    sourceDocId: string;
    sourceDocTitle: string;
    sourceNodeId: string;
    excerpt: string;
}
