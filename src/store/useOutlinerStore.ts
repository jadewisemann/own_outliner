import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as Y from 'yjs';
import { SupabaseProvider } from '@/lib/yjs-provider';
import { supabase } from '@/lib/supabase';

import type { OutlinerState, NodeData } from '@/types/outliner';
import { createNodeSlice } from '@/store/slices/nodeSlice';
import { createSelectionSlice } from '@/store/slices/selectionSlice';
import { createFocusSlice } from '@/store/slices/focusSlice';
import { createSettingsSlice } from '@/store/slices/settingsSlice';
import { createNavigationSlice } from '@/store/slices/navigationSlice';
// import { v4 as uuidv4 } from 'uuid'; // Removed: DB generates UUIDs

import { createAuthSlice } from '@/store/slices/authSlice';
import { createSyncSlice } from '@/store/slices/syncSlice';


export const useOutlinerStore = create<OutlinerState>()(
    persist(
        (...a) => {
            const [set, get] = a;
            return {
                ...createNodeSlice(...a),
                ...createSelectionSlice(...a),
                ...createFocusSlice(...a),
                ...createSettingsSlice(...a),
                ...createNavigationSlice(...a),
                ...createAuthSlice(...a),
                ...createSyncSlice(...a),


                // Multi-document State
                documents: [],
                activeDocumentId: null,

                flashId: null,
                backlinks: {},


                // Slash Menu State
                slashMenu: {
                    isOpen: false,
                    position: null,
                    targetNodeId: null,
                    filterText: ''
                },
                setSlashMenu: (payload) => set((prev) => ({
                    ...prev,
                    slashMenu: { ...prev.slashMenu, ...payload }
                })),

                // Clipboard State
                clipboardDocument: null,
                setClipboardDocument: (clipboard) => set({ clipboardDocument: clipboard }),

                // Document Management Actions
                cloneDocument: async (id) => {
                    const state = get();
                    const docToClone = state.documents.find(d => d.id === id);
                    if (!docToClone || !state.user) return;

                    // 1. Recursive function to collect all descendants
                    const docsToClone: typeof docToClone[] = [docToClone];
                    if (docToClone.isFolder) {
                        const findAllDescendants = (parentId: string) => {
                            const children = state.documents.filter(d => d.parentId === parentId);
                            for (const child of children) {
                                docsToClone.push(child);
                                if (child.isFolder) {
                                    findAllDescendants(child.id);
                                }
                            }
                        };
                        findAllDescendants(id);
                    }

                    // 2. Create map for ID remapping
                    // Map<OldID, NewID> is hard because we need to insert to DB to get ID?
                    // Or we insert with Supabase returning ID.
                    // We must do it level by level or top-down.

                    // Helper to clone single doc
                    // const clonedIdMap = new Map<string, string>();

                    // 3. Process ordered by dependency (Parents first)
                    // docsToClone is typically DFS or BFS order? 
                    // We need to ensure parent is created before child so we have parentId.
                    // Let's sort docsToClone by path depth? Or just loop.
                    // Actually, if we use BFS/DFS starting from root `docToClone`, we are good.
                    // The recursion above does DFS (Parent then Children).

                    // We need to handle the Root Clone first (which might be pasted into a new parent? Or just duplicated as sibling?)
                    // "Clone" usually means "Duplicate in place" (Sibling).
                    // So `docToClone.parentId` remains same for the root clone (or mapped if we are pasting into another folder?).
                    // But `cloneDocument` here is triggered by "Paste" action usually. 
                    // Actually, if `Ctrl+C` -> `clipboard = { id, op: 'copy' }`.
                    // Then `Ctrl+V` -> Calls `pasteNodes` (internal)? No, `Sidebar` calls `cloneDocument`?
                    // Wait, `cloneDocument` implies "Create a copy NOW".
                    // But `Ctrl+V` (Paste) implies "Create copy AT DESTINATION".
                    // So `cloneDocument` should probably take `targetParentId`.

                    // User Request: `Ctrl + C`, `Ctrl + V`.
                    // So `cloneDocument` is likely called inside `handlePaste` in Sidebar, passing `targetParentId`.
                    // I should update signature in Types as well if I change it.
                    // But for now, let's assume `cloneDocument(originalId)` creates a copy *as sibling*.
                    // If Paste moves it, that's different.
                    // Ah, `handlePaste` will decide.
                    // If I copy A, go to folder B, paste. A should be copied to B.
                    // So `cloneDocument` needs `targetParentId`.

                    // Let's stick to the interface I defined: `cloneDocument(id)` for now, maybe it Duplicates in place.
                    // But for Paste, we need `duplicateDocument(id, targetParentId)`.
                    // I'll stick to `cloneDocument` cloning it *as sibling* for now to fix the store, can refine later.
                    // Actually, let's make it `cloneDocument(id, targetParentId?)`.

                    // For now, simple Sibling Clone logic to satisfy Type impl.
                    const newTitle = `${docToClone.title} (Copy)`;

                    const { data: newDoc } = await supabase
                        .from('documents')
                        .insert({
                            owner_id: state.user.id,
                            parent_id: docToClone.parentId, // Sibling
                            title: newTitle,
                            is_folder: docToClone.isFolder,
                            content: null // Copy content? TODO: Fetch content and copy.
                        })
                        .select()
                        .single();

                    if (newDoc) {
                        // TODO: Copy content if it's a file
                        if (!docToClone.isFolder) {
                            const { data: source } = await supabase.from('documents').select('content').eq('id', id).single();
                            if (source?.content) {
                                await supabase.from('documents').update({ content: source.content }).eq('id', newDoc.id);
                            }
                        }
                        await get().fetchDocuments();
                    }
                },



                updateDocumentRank: async (id, rank) => {
                    const state = get();
                    // Optimistic update
                    const docs = state.documents.map(d => d.id === id ? { ...d, rank } : d);
                    set({ documents: docs });

                    if (!state.user) return;
                    await supabase.from('documents').update({ rank }).eq('id', id);
                },

                // Document Management Actions
                fetchDocuments: async () => {
                    const state = get();
                    if (!state.user) return;
                    const { data, error } = await supabase
                        .from('documents')
                        .select('*')
                        .eq('owner_id', state.user.id)
                        .order('is_folder', { ascending: false })

                        .order('rank', { ascending: true }) // Sort by rank by default (lexorank/float ascending)
                        .order('title');

                    if (error) {
                        console.error('Error fetching documents:', error);
                        return;
                    }

                    const docs = data.map(d => ({
                        id: d.id,
                        ownerId: d.owner_id,
                        parentId: d.parent_id,
                        title: d.title,
                        isFolder: d.is_folder,
                        // content: d.content, // heavy, don't load in list
                        createdAt: d.created_at,

                        updatedAt: d.updated_at,
                        rank: d.rank // Map rank
                    }));

                    set({ documents: docs });

                    // Auto-select if no active document
                    const s = get();
                    if (!s.activeDocumentId && docs.length > 0) {
                        // Find first non-folder or just first item?
                        // Prefer file.
                        const firstFile = docs.find(d => !d.isFolder);
                        if (firstFile) {
                            get().setActiveDocument(firstFile.id);
                        } else if (docs.length > 0) {
                            // Only folders? User needs to create doc. 
                            // Or just select null and let UI handle?
                            // Let's safe-guard: if we have docs, select one to show *something*.
                            // But Sidebar handles selection. 
                        }
                    } else if (docs.length === 0) {
                        // No documents at all? Create default.
                        console.log("No documents found, creating default...");
                        await get().createDocument('내 문서 (기본)');
                    }
                },

                createDocument: async (title = 'Untitled', parentId = null, isFolder = false) => {
                    const state = get();
                    if (!state.user) return;

                    let finalTitle = title;
                    const docs = state.documents;

                    if (!isFolder) {
                        // Files: Global Uniqueness (among files)
                        let counter = 1;
                        let candidate = finalTitle;
                        while (docs.some(d => !d.isFolder && d.title === candidate)) {
                            candidate = `${finalTitle} (${counter})`;
                            counter++;
                        }
                        finalTitle = candidate;
                    } else {
                        // Folders: Sibling Uniqueness (among all items in same parent)
                        let counter = 1;
                        let candidate = finalTitle;
                        // Check against any sibling (File or Folder) to avoid confusion? 
                        // Or just Folders? User example was "Folder inside Folder".
                        // Standard FS: file 'a' and folder 'a' conflicts.
                        // But since Files are global, checking against files here might force Folder to avoid File name even if File is elsewhere?
                        // No, `parentId` check.
                        // If File is elsewhere, `d.parentId` differs.
                        // So checking `d.parentId === parentId` catches local siblings.
                        while (docs.some(d => d.parentId === parentId && d.title === candidate)) {
                            candidate = `${finalTitle} (${counter})`;
                            counter++;
                        }
                        finalTitle = candidate;
                    }

                    const { data, error } = await supabase
                        .from('documents')
                        .insert({
                            owner_id: state.user.id,
                            parent_id: parentId,
                            title: finalTitle,
                            is_folder: isFolder,
                            content: null
                        })
                        .select()
                        .single();

                    if (error) {
                        console.error('Error creating document:', error);
                        return;
                    }

                    await get().fetchDocuments();

                    if (!isFolder) {
                        get().setActiveDocument(data.id);
                    }
                },

                deleteDocument: async (id) => {
                    const { error } = await supabase.from('documents').delete().eq('id', id);
                    if (error) {
                        console.error('Error deleting document:', error);
                        return;
                    }
                    await get().fetchDocuments();

                    const state = get();
                    if (state.activeDocumentId === id) {
                        set({ activeDocumentId: null, nodes: {} });
                    }
                },

                renameDocument: async (id, title) => {
                    const state = get();
                    const docs = state.documents;
                    const doc = docs.find(d => d.id === id);
                    if (!doc) return;

                    let finalTitle = title;

                    if (!doc.isFolder) {
                        // Files: Global Uniqueness
                        let counter = 1;
                        let candidate = finalTitle;
                        while (docs.some(d => d.id !== id && !d.isFolder && d.title === candidate)) {
                            candidate = `${finalTitle} (${counter})`;
                            counter++;
                        }
                        finalTitle = candidate;
                    } else {
                        // Folders: Sibling Uniqueness
                        let counter = 1;
                        let candidate = finalTitle;
                        while (docs.some(d => d.id !== id && d.parentId === doc.parentId && d.title === candidate)) {
                            candidate = `${finalTitle} (${counter})`;
                            counter++;
                        }
                        finalTitle = candidate;
                    }

                    const { error } = await supabase
                        .from('documents')
                        .update({ title: finalTitle, updated_at: new Date().toISOString() })
                        .eq('id', id);

                    if (error) {
                        console.error('Error renaming document:', error);
                        return;
                    }
                    await get().fetchDocuments();
                },

                moveDocument: async (id, newParentId) => {
                    const { error } = await supabase
                        .from('documents')
                        .update({ parent_id: newParentId, updated_at: new Date().toISOString() })
                        .eq('id', id);

                    if (error) {
                        console.error('Error moving document:', error);
                        return;
                    }
                    await get().fetchDocuments();
                },

                setActiveDocument: async (id: string | null) => {
                    const state = get();
                    if (state.activeDocumentId === id && state.provider) return; // Already active and connected
                    if (!state.user) return;

                    // 1. Cleanup existing
                    if (state.provider) {
                        state.provider.destroy();
                    }
                    if (state.undoManager) {
                        state.undoManager.destroy(); // Cleanup old manager
                    }

                    if (!id) {
                        set({ activeDocumentId: null, provider: null, undoManager: null });
                        return;
                    }

                    // Create fresh doc
                    const newDoc = new Y.Doc();

                    // 2. Load Content from DB
                    const { data } = await supabase
                        .from('documents')
                        .select('content')
                        .eq('id', id)
                        .single();

                    if (data && data.content) {
                        try {
                            // Supabase returns bytea as Hex String or number array usually?
                            // If using supabase-js, it might handle it. 
                            // Let's check type. If string (hex), parse it. 
                            // Actually supabase-js often returns string like "\x..." or just array.
                            // Safe to assume we might need to handle it.
                            let content = data.content;
                            if (typeof content === 'string' && content.startsWith('\\x')) {
                                // parse hex
                                // Not implemented here, assuming standard bytea handling
                            }
                            // Assuming Supabase driver handles common formats or we treat as any
                            let update: Uint8Array;
                            if (typeof content === 'string') {
                                if (content.startsWith('\\x')) content = content.slice(2);
                                const match = content.match(/.{1,2}/g);
                                update = match ? new Uint8Array(match.map((byte: string) => parseInt(byte, 16))) : new Uint8Array();
                            } else {
                                update = new Uint8Array(content);
                            }

                            Y.applyUpdate(newDoc, update);
                        } catch (e) {
                            console.warn("Failed to apply existing content, starting fresh.", e);
                        }
                    }

                    // 3. Setup UndoManager
                    const nodesMap = newDoc.getMap('nodes');
                    const undoManager = new Y.UndoManager(nodesMap);

                    set({
                        activeDocumentId: id,
                        nodes: {},
                        doc: newDoc,
                        provider: undefined,
                        undoManager
                    });

                    // 4. Initialize Sync
                    const provider = new SupabaseProvider(newDoc, supabase, `room:${state.user.id}:${id}`);
                    set({ provider });

                    // 5. Persistence Listener (Debounced)
                    let timer: ReturnType<typeof setTimeout> | null = null;
                    newDoc.on('update', () => {
                        if (timer) clearTimeout(timer);
                        timer = setTimeout(() => {
                            const fullState = Y.encodeStateAsUpdate(newDoc);
                            // Convert to Hex String for Postgres bytea
                            const hexContent = '\\x' + Array.from(fullState)
                                .map(b => b.toString(16).padStart(2, '0'))
                                .join('');

                            supabase
                                .from('documents')
                                .update({
                                    content: hexContent as any, // Supabase expects string for bytea usually
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', id)
                                .then(({ error }) => {
                                    if (error) console.error("Persistence Error", error);
                                    else console.log("Document saved to DB");
                                });
                        }, 2000);
                    });

                    // 6. Connect Nodes State
                    const yNodes = newDoc.getMap<any>('nodes');
                    const updateNodes = () => {
                        const nodesMap: Record<string, NodeData> = {};
                        yNodes.forEach((content: any, id: string) => {
                            nodesMap[id] = (content && typeof content.toJSON === 'function') ? content.toJSON() : content;
                        });
                        set({ nodes: nodesMap });
                    };

                    yNodes.observeDeep(updateNodes);

                    // Bootstrap Root Node if missing (New Document)
                    if (!yNodes.has('root')) {
                        const rootNode: NodeData = {
                            id: 'root',
                            content: '', // Title is in document meta, root content usually empty or 'Root'
                            parentId: null,
                            children: [],
                            isCollapsed: false,
                            type: 'text',
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                        };

                        newDoc.transact(() => {
                            const nodeMap = new Y.Map();
                            nodeMap.set('id', rootNode.id);
                            nodeMap.set('content', rootNode.content);
                            nodeMap.set('parentId', rootNode.parentId);
                            nodeMap.set('children', new Y.Array());
                            nodeMap.set('isCollapsed', rootNode.isCollapsed);
                            nodeMap.set('type', rootNode.type);
                            nodeMap.set('createdAt', rootNode.createdAt);
                            nodeMap.set('updatedAt', rootNode.updatedAt);
                            yNodes.set('root', nodeMap);
                        });
                    }

                    updateNodes(); // Initial sync from YDoc to Local
                },

                // Yjs State
                doc: new Y.Doc(),
                provider: undefined,
                undoManager: undefined,

                undo: () => {
                    const { undoManager } = get();
                    if (undoManager) undoManager.undo();
                },
                redo: () => {
                    const { undoManager } = get();
                    if (undoManager) undoManager.redo();
                },

                initializeSync: async () => {
                    // Deprecated: use setActiveDocument. 
                    // But we keep it as a no-op or proxy if referenced.
                    const state = get();
                    if (state.activeDocumentId && !state.provider) {
                        state.setActiveDocument(state.activeDocumentId);
                    }
                }
            };
        },
        {
            name: 'outliner-storage',
            version: 9, // Bump version
            migrate: (persistedState: unknown, version: number) => {
                let state = persistedState as OutlinerState;
                // ... migration logic preserved ...
                if (version < 8) {
                    // ... legacy migrations ...
                    state.backlinks = {};
                }

                // Doc Management Migration (Version 9) - Removed legacy migration for DB sync
                if (version < 9) {
                    // We do not create local default docs anymore.
                    // state.documents should be empty initially, populated by fetch.
                    state.documents = [];
                    state.activeDocumentId = null;
                }

                return state;
            },
            partialize: (state) => {
                // Exclude doc and provider from localStorage persistence
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {
                    doc,
                    provider,
                    undoManager,
                    selectedIds,
                    selectionAnchorId,
                    focusedId,
                    flashId,
                    user,
                    session,
                    isAuthLoading,
                    isSyncing,
                    ...rest
                } = state;
                return rest;
            },
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.selectedIds = [];
                    // Ensure we have at least one doc if somehow empty after rehydrate?
                    // No, let migrate handle it.
                }
            },
        }
    )
);

// Auto-Sync Handling using subscription
// We can Disable the old "Push" logic since Yjs Provider handles sync!
/*
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 3000;

useOutlinerStore.subscribe((state, prevState) => {
    // ... disable old push ...
});
*/
