
/**
 * Utility for parsing links from node content.
 * Supports:
 * 1. [[WikiLinks]] -> Target Title
 * 2. ((BlockID)) -> Target Node ID
 */

export interface ParsedLink {
    type: 'wiki';
    target: string; // Document Title (empty if local block ref)
    blockId?: string; // Block ID (if present)
    alias?: string;   // Alias text
    sourceNodeId: string;
    excerpt: string;
}

export const parseLinks = (nodeId: string, content: string): ParsedLink[] => {
    if (!content) return [];

    const links: ParsedLink[] = [];

    // Regex for [[Title^BlockID|Alias]]
    // Matches:
    // 1. [[Title]]
    // 2. [[^BlockID]] (Local)
    // 3. [[Title^BlockID]] (Remote)
    // 4. [[Title|Alias]]

    // Group 1: Title (optional, but if missing, Group 2 MUST exist)
    // Group 2: BlockID (optional)
    // Group 3: Alias (optional)
    const wikiRegex = /\[\[([^\]^|]*)(?:\^([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

    let match;

    while ((match = wikiRegex.exec(content)) !== null) {
        const title = match[1].trim();
        const blockId = match[2]?.trim();
        const alias = match[3]?.trim();

        // Valid link must have either Title or BlockID
        if (!title && !blockId) continue;

        links.push({
            type: 'wiki',
            target: title,
            blockId: blockId,
            alias: alias,
            sourceNodeId: nodeId,
            excerpt: content
        });
    }

    return links;
};
