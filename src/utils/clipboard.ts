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

    lines.forEach(line => {
        // Detect indent
        const match = line.match(/^(\s*)(?:-\s+)?(.*)/);
        if (!match) return;

        const indentStr = match[1];
        const content = match[2];

        // Calculate level (assuming 1 tab or 2 spaces = 1 level)
        let level = 0;
        if (indentStr.includes('\t')) {
            level = indentStr.length;
        } else {
            level = Math.floor(indentStr.length / 2);
        }

        const newNode: TempNode = { content, children: [] };

        // Find parent
        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        const parent = stack[stack.length - 1].node;
        parent.children.push(newNode);
        stack.push({ node: newNode, level });
    });

    return root.children;
};
