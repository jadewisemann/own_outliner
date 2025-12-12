import type { Keybinding } from '../types/outliner';

export const isMatch = (event: KeyboardEvent | React.KeyboardEvent, binding: Keybinding | undefined): boolean => {
    if (!binding) return false;
    // Check Key
    if (event.key.toLowerCase() !== binding.key.toLowerCase()) {
        return false;
    }

    // Check Modifiers
    // !! converts undefined to false for strict comparison
    const ctrl = !!(binding.ctrl || binding.meta); // Treat Ctrl/Meta interchangeably (or based on OS preference later)
    const eventCtrl = event.ctrlKey || event.metaKey;

    if (ctrl !== eventCtrl) return false;
    if (!!binding.shift !== event.shiftKey) return false;
    if (!!binding.alt !== event.altKey) return false;

    return true;
};

export const executeIfMatch = (e: React.KeyboardEvent, binding: Keybinding, action: () => void) => {
    if (isMatch(e, binding)) {
        e.preventDefault();
        action();
        return true;
    }
    return false;
};

export const defaultKeybindings: Record<string, Keybinding> = {
    splitNode: { key: 'Enter' },
    mergeNode: { key: 'Backspace' },
    indentNode: { key: 'Tab' },
    outdentNode: { key: 'Tab', shift: true },
    moveUp: { key: 'ArrowUp', alt: true }, // Defaulting to Alt+Up
    moveDown: { key: 'ArrowDown', alt: true },
    deleteNode: { key: 'Delete' },
    deleteLine: { key: 'k', meta: true, shift: true }, // VS Code style delete line
    copyNode: { key: 'c', meta: true },
    cutNode: { key: 'x', meta: true },
    pasteNode: { key: 'v', meta: true },
    selectAll: { key: 'a', meta: true },
    selectLine: { key: 'l', meta: true }, // VS Code style select line
    toggleCollapse: { key: 'Enter', meta: true }, // Changed to Cmd+Enter to free up Cmd+.
    zoomIn: { key: '.', meta: true }, // Cmd + .
    zoomOut: { key: ',', meta: true }, // Cmd + ,
    formatBold: { key: 'b', meta: true },
    formatItalic: { key: 'i', meta: true },
    formatStrike: { key: 'x', meta: true, shift: true },
    undo: { key: 'z', meta: true },
    redo: { key: 'z', meta: true, shift: true },
    search: { key: 'p', meta: true },
};
