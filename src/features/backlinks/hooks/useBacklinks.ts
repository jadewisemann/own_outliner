import { useOutlinerStore } from '@/store/outlinerStore';
import type { BacklinkItem } from '@/types/outliner';


export const useBacklinks = () => {
    const backlinks = useOutlinerStore((state) => state.backlinks);
    const setActiveDocument = useOutlinerStore((state) => state.setActiveDocument);
    const setFlashId = useOutlinerStore((state) => state.setFlashId);

    // Derived state or memo could go here if extraction needed logic
    // Currently, excerpt is already prepared by DB/Store.

    const handleNavigate = (link: BacklinkItem) => {
        // 1. Move to Document
        setActiveDocument(link.sourceDocId);

        // 2. Flash/Focus Node
        // We need to wait for doc to load? 
        // setActiveDocument is async but we are not waiting here.
        // However, setActiveDocument clears nodes then loads. 
        // setFlashId sets a store property. 
        // App.tsx reacts to flashId ONLY if node exists in flatNodes.
        // If we switch doc, nodes load, then App re-renders.
        // We might need to ensure flashId persists across the switch or is set after load.
        // Current implementation of setActiveDocument resets nodes.
        // Store holds flashId. 
        // Let's see if setActiveDocument clears flashId. 
        // Looking at store: setActiveDocument does NOT clear flashId explicitly (only nodes, doc, provider).
        // Wait, onRehydrateStorage? No.

        // We should set flashId.
        setFlashId(link.sourceNodeId);
    };

    return {
        backlinks,
        handleNavigate
    };
};
