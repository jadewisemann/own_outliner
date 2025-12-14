import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { ChevronDown } from 'lucide-react';

/* 
  Headless-style Dropdown Component Construction
  Pattern: Compound Components
*/

interface DropdownContextType {
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

const useDropdown = () => {
    const context = useContext(DropdownContext);
    if (!context) throw new Error("Dropdown components must be used within <Dropdown>");
    return context;
};

// Root Component
export const Dropdown: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggle = () => setIsOpen(prev => !prev);
    const close = () => setIsOpen(false);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                close();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <DropdownContext.Provider value={{ isOpen, toggle, close }}>
            <div ref={dropdownRef} className={`relative inline-block text-left ${className || ''}`}>
                {children}
            </div>
        </DropdownContext.Provider>
    );
};

// Trigger Button
export const DropdownTrigger: React.FC<{ children: React.ReactNode, className?: string, hideIcon?: boolean }> = ({ children, className, hideIcon }) => {
    const { toggle, isOpen } = useDropdown();
    return (
        <button
            onClick={(e) => { e.stopPropagation(); toggle(); }}
            className={`flex items-center gap-1 cursor-pointer ${className || ''}`}
            type="button"
            aria-haspopup="true"
            aria-expanded={isOpen}
        >
            {children}
            {!hideIcon && <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
        </button>
    );
};

// Menu Content
interface DropdownContentProps {
    children: React.ReactNode;
    align?: 'left' | 'right';
    className?: string;
    width?: string;
}

export const DropdownMenu: React.FC<DropdownContentProps> = ({ children, align = 'left', className, width = 'w-48' }) => {
    const { isOpen } = useDropdown();

    if (!isOpen) return null;

    const alignmentClass = align === 'right' ? 'right-0' : 'left-0';

    return (
        <div
            className={`absolute z-50 mt-1 rounded-md shadow-lg bg-white dark:bg-neutral-800 ring-1 ring-black/5 dark:ring-white/10 focus:outline-none ${width} origin-top-${align} ${alignmentClass} ${className || ''}`}
            role="menu"
            aria-orientation="vertical"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking background
        >
            <div className="py-1" role="none">
                {children}
            </div>
        </div>
    );
};

// Menu Item
interface DropdownItemProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    active?: boolean;
    icon?: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ children, onClick, className, active, icon }) => {
    const { close } = useDropdown();

    const handleClick = () => {
        if (onClick) onClick();
        close();
    };

    return (
        <button
            onClick={handleClick}
            className={`
        w-full text-left px-4 py-2 text-sm flex items-center gap-2
        ${active ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'}
        ${className || ''}
      `}
            role="menuitem"
        >
            {icon && <span className="text-neutral-500">{icon}</span>}
            {children}
        </button>
    );
};

// Divider
export const DropdownLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="px-4 py-1 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
        {children}
    </div>
);

export const DropdownSeparator: React.FC = () => (
    <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
);

export default Dropdown;
