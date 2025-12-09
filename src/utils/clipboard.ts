export interface TempNode {
    content: string;
    children: TempNode[];
}

export const serializeNodeToText = (
    nodeId: string,
    nodes: Record<string, { content: string, children: string[] }>,
    depth = 0
): string => {
    const node = nodes[nodeId];
    if (!node) return '';

    const indent = '\t'.repeat(depth);
    const selfText = `${indent}- ${node.content}\n`;
    const childrenText = node.children
        .map(childId => serializeNodeToText(childId, nodes, depth + 1))
        .join('');

    return selfText + childrenText;
};

// Simple parser for tab or 2-space indented lists
export const parseIndentedText = (text: string): TempNode[] => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const root: TempNode = { content: 'root', children: [] };
    const stack: { node: TempNode, level: number }[] = [{ node: root, level: -1 }];

    for (const line of lines) {
        // Detect indent
        const match = line.match(/^(\s*)(?:-\s+)?(.*)/);
        if (!match) continue;

        const indentStr = match[1];
        const content = match[2];

        // Calculate level (assuming 1 tab or 2 spaces = 1 level)
        const level = indentStr.includes('\t')
            ? indentStr.length
            : Math.floor(indentStr.length / 2);

        const newNode: TempNode = { content, children: [] };

        // Find parent
        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        const parent = stack[stack.length - 1].node;
        parent.children.push(newNode);
        stack.push({ node: newNode, level });
    }

    return root.children;
};

// Structure for internal clipboard data
export interface ClipboardData {
    format: 'outliner/nodes';
    nodes: TempNode[]; // Reusing TempNode for recursive structure
}

export const serializeNodesToClipboard = (
    ids: string[],
    nodes: Record<string, { content: string, children: string[] }>
): { text: string, json: string } => {
    // 1. Convert selected nodes to recursive structure
    const toTempNode = (id: string): TempNode | null => {
        const node = nodes[id];
        if (!node) return null;
        return {
            content: node.content,
            children: node.children
                .map(toTempNode)
                .filter((n): n is TempNode => n !== null)
        };
    };

    const forest = ids.map(toTempNode).filter((n): n is TempNode => n !== null);

    // 2. Generate Text (Indented)
    const structureToText = (nodes: TempNode[], depth = 0): string => {
        return nodes.map(node => {
            const indent = '\t'.repeat(depth);
            const selfText = `${indent}- ${node.content}\n`;
            const childrenText = structureToText(node.children, depth + 1);
            return selfText + childrenText;
        }).join('');
    };

    const text = structureToText(forest);

    // 3. Generate JSON
    const json = JSON.stringify({
        format: 'outliner/nodes',
        nodes: forest
    });

    return { text, json };
};
