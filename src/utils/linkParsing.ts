
/**
 * Utility for parsing links from node content.
 * Supports:
 * 1. [[WikiLinks]] -> Target Title
 * 2. ((BlockID)) -> Target Node ID
 */

export interface ParsedLink {
    type: 'wiki' | 'block';
    target: string; // Title for wiki, NodeId for block
    sourceNodeId: string;
    excerpt: string;
}

export const parseLinks = (nodeId: string, content: string): ParsedLink[] => {
    if (!content) return [];

    const links: ParsedLink[] = [];

    // Regex for [[WikiLink]]
    // Matches [[Title]] or [[Title|Alias]]
    const wikiRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

    // Regex for ((BlockID))
    const blockRegex = /\(\(([a-zA-Z0-9-]+)\)\)/g;

    let match;

    // Extract WikiLinks
    while ((match = wikiRegex.exec(content)) !== null) {
        links.push({
            type: 'wiki',
            target: match[1].trim(),
            sourceNodeId: nodeId,
            excerpt: content // Store full content or snippet? Full content is safer for context, can truncate in UI.
        });
    }

    // Extract BlockRefs
    while ((match = blockRegex.exec(content)) !== null) {
        links.push({
            type: 'block',
            target: match[1].trim(),
            sourceNodeId: nodeId,
            excerpt: content
        });
    }

    return links;
};
