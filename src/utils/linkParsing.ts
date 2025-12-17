
/**
 * Utility for parsing links from node content.
 * Supports:
 * 1. [[WikiLinks]] -> Target Title
 * 2. ((BlockID)) -> Target Node ID
 */

interface ParsedLink {
    type: 'wiki' | 'block';
    target: string; // Title for wiki, NodeId for block
}

export const parseLinks = (content: string): ParsedLink[] => {
    if (!content) return [];

    const links: ParsedLink[] = [];

    // Regex for [[WikiLink]]
    // Matches [[Title]] or [[Title|Alias]]
    // Captures Title in group 1
    const wikiRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

    // Regex for ((BlockID))
    // Matches ((id))
    // Captures id in group 1
    const blockRegex = /\(\(([a-zA-Z0-9-]+)\)\)/g;

    let match;

    // Extract WikiLinks
    while ((match = wikiRegex.exec(content)) !== null) {
        links.push({
            type: 'wiki',
            target: match[1].trim()
        });
    }

    // Extract BlockRefs
    while ((match = blockRegex.exec(content)) !== null) {
        links.push({
            type: 'block',
            target: match[1].trim()
        });
    }

    return links;
};
