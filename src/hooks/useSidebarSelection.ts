import { useState } from 'react';
import { useOutlinerStore } from '@/store/outliner';

export function useSidebarSelection() {
    const { activeDocumentId, setActiveDocument: storeSetActiveDocument } = useOutlinerStore();
    const [focusedId, setFocusedId] = useState<string | null>(null);

    return {
        activeDocumentId,
        setActiveDocument: storeSetActiveDocument,
        focusedId,
        setFocusedId
    };
}
