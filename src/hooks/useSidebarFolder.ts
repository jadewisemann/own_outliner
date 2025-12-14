import { useState, useCallback } from 'react';

export function useSidebarFolder() {
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

    const toggleFolder = useCallback((id: string) => {
        setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const expandFolder = useCallback((id: string) => {
        setExpandedFolders(prev => ({ ...prev, [id]: true }));
    }, []);

    return {
        expandedFolders,
        setExpandedFolders,
        toggleFolder,
        expandFolder
    };
}
