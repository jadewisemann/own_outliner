export type NodeId = string;

export type NodeType = 'text' | 'h1' | 'h2' | 'h3' | 'todo' | 'code' | 'quote' | 'link';

export type NodeMetadata = Record<string, any>;

export interface NodeTransferData {
    content: string;
    children: NodeTransferData[];
    type?: NodeType;
    completed?: boolean;
    meta?: NodeMetadata;
}

export interface NodeData {
    id: NodeId;
    content: string;
    parentId: NodeId | null;
    children: NodeId[];
    isCollapsed: boolean;
    type?: NodeType;
    completed?: boolean;
    meta?: NodeMetadata;
    createdAt?: number;
    updatedAt?: number;
}

export interface LinkPopupState {
    isOpen: boolean;
    type: 'node' | 'document';
    targetDocTitle?: string | null;
    position: { top: number; left: number };
    query: string;
    triggerIndex: number;
    triggerLength: number;
}
