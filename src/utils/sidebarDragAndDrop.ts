import type { Document } from '@/types/outliner';

export type DropPosition = 'before' | 'inside' | 'after' | null;

/**
 * Calculates the drop position based on the mouse Y coordinate relative to the target element.
 */
export const calculateDropPosition = (
    y: number,
    height: number,
    isTargetFolder: boolean,
    sortOrder: 'none' | 'name' | 'manual'
): DropPosition => {
    if (sortOrder === 'manual') {
        if (isTargetFolder) {
            if (y < height * 0.25) return 'before';
            if (y > height * 0.75) return 'after';
            return 'inside';
        } else {
            if (y < height * 0.5) return 'before';
            return 'after';
        }
    } else {
        return isTargetFolder ? 'inside' : null;
    }
};

/**
 * Calculates a new rank string between two existing ranks (average).
 * Supports both float-string and Lexorank-style simply by averaging floats for now.
 */
export const calculateNewRank = (prevRankStr: string, nextRankStr: string): string => {
    const pVal = parseFloat(prevRankStr);
    const nVal = parseFloat(nextRankStr);
    return ((pVal + nVal) / 2).toFixed(4);
};

/**
 * Generates a unique title to avoid conflicts in the same folder.
 * Appends (1), (2), etc.
 */
export const getUniqueTitle = (siblings: Document[], baseTitle: string): string | null => {
    let candidate = baseTitle;
    let counter = 1;
    let conflictFound = false;

    // Check if initial title exists
    if (siblings.some(s => s.title === candidate)) {
        conflictFound = true;
        while (siblings.some(s => s.title === candidate)) {
            candidate = `${baseTitle} (${counter})`;
            counter++;
        }
    }

    return conflictFound ? candidate : null;
};
