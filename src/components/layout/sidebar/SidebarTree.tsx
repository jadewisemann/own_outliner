import React from 'react';
import { SidebarItem } from '@/components/layout/sidebar/SidebarItem';
import { useSidebarContext } from '@/components/layout/sidebar/SidebarContext';

interface SidebarTreeProps {
    parentId: string | null;
    depth?: number;
}

export const SidebarTree: React.FC<SidebarTreeProps> = ({
    parentId,
    depth = 0
}) => {
    const { getSortedChildren, expandedFolders } = useSidebarContext();
    const children = getSortedChildren(parentId);

    return (
        <>
            {children.map(item => (
                <div key={item.id} className="select-none">
                    <SidebarItem
                        item={item}
                        depth={depth}
                    />

                    {item.isFolder && expandedFolders[item.id] && (
                        <div>
                            <SidebarTree
                                parentId={item.id}
                                depth={depth + 1}
                            />
                            {getSortedChildren(item.id).length === 0 && (
                                <div className="text-xs text-neutral-400 py-1 pl-[32px]" style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }}>
                                    (비어 있음)
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </>
    );
};
