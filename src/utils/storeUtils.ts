
import type { NodeData } from '../types/outliner';

export const generateId = (): string => Math.random().toString(36).substring(2, 9);

export const createInitialNode = (id: string, content: string = ''): NodeData => ({
    id,
    content,
    parentId: null,
    children: [],
    isCollapsed: false,
    updatedAt: Date.now(),
});
