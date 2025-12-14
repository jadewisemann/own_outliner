import React from 'react';
import {
    Plus, FolderPlus, ListFilter
} from 'lucide-react';
import {
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from '@/components/ui/DropdownMenu';
import { useSidebarContext } from './SidebarContext';

interface SidebarHeaderProps {
    // No props needed now!
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = () => {
    const {
        sortOrder, setSortOrder,
        handleCreate
    } = useSidebarContext();

    return (
        <div className="p-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shadow-sm z-10">
            <h2 className="font-semibold text-neutral-700 dark:text-neutral-300 ml-1">내 문서</h2>
            <div className="flex gap-1">
                <Dropdown>
                    <DropdownTrigger className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                        <ListFilter size={16} />
                    </DropdownTrigger>
                    <DropdownMenu align="right">
                        <DropdownItem onClick={() => setSortOrder('none')} active={sortOrder === 'none'}>기본 (생성순)</DropdownItem>
                        <DropdownItem onClick={() => setSortOrder('name')} active={sortOrder === 'name'}>이름순 (가나다)</DropdownItem>
                        <DropdownItem onClick={() => setSortOrder('manual')} active={sortOrder === 'manual'}>사용자 지정 (드래그)</DropdownItem>
                    </DropdownMenu>
                </Dropdown>

                <button
                    onClick={() => handleCreate(true)}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                    title="새 폴더"
                >
                    <FolderPlus size={16} />
                </button>
                <button
                    onClick={() => handleCreate(false)}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                    title="새 문서"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
    );
};
