export interface Keybinding {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
}

export type KeyAction =
    | 'splitNode'
    | 'mergeNode'
    | 'indentNode'
    | 'outdentNode'
    | 'moveUp'
    | 'moveDown'
    | 'deleteNode' // General delete (e.g. Backspace on empty)
    | 'deleteLine' // Explicit delete line (e.g. Cmd+Shift+K)
    | 'copyNode'
    | 'cutNode'
    | 'pasteNode'
    | 'selectAll' // Ctrl+A behavior
    | 'selectLine' // Ctrl+L behavior
    | 'toggleCollapse'
    | 'zoomIn'
    | 'zoomOut'
    | 'formatBold'
    | 'formatItalic'
    | 'formatStrike'
    | 'undo'
    | 'redo'
    | 'search';

export interface OutlinerSettings {
    theme: 'light' | 'dark';
    splitBehavior: 'sibling' | 'child' | 'auto';
    linkClickBehavior: 'edit' | 'select' | 'navigate'; // 'edit' = focus input, 'select' = regular selection, 'navigate' = follow link
    keybindings: Record<KeyAction, Keybinding>;
    logicalOutdent: boolean; // true: 현재 동작 유지, false: Direct Outdent
}
