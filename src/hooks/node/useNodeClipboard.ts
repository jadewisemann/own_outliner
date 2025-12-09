import type { NodeId } from '@/types/outliner';

export const useNodeClipboard = () => {
    const copyNodes = (targets: NodeId[], nodes: any) => {
        import('@/utils/clipboard').then(({ serializeNodesToClipboard }) => {
            const { text, json } = serializeNodesToClipboard(targets, nodes);
            const data = [new ClipboardItem({
                'text/plain': new Blob([text], { type: 'text/plain' }),
                'application/json': new Blob([json], { type: 'application/json' })
            })];
            navigator.clipboard.write(data).catch(() => navigator.clipboard.writeText(text));
        });
    };

    const cutNodes = (targets: NodeId[], state: any) => {
        import('@/utils/clipboard').then(({ serializeNodesToClipboard }) => {
            const { text, json } = serializeNodesToClipboard(targets, state.nodes);
            const data = [new ClipboardItem({
                'text/plain': new Blob([text], { type: 'text/plain' }),
                'application/json': new Blob([json], { type: 'application/json' })
            })];
            navigator.clipboard.write(data).then(() => {
                state.deleteNodes(targets);
            }).catch(() => {
                navigator.clipboard.writeText(text).then(() => state.deleteNodes(targets));
            });
        });
    };

    const handleClipboardPaste = async (id: NodeId, state: any) => {
        const executePaste = async (content: string, isJson: boolean) => {
            if (!content) return;

            const { parseIndentedText } = await import('@/utils/clipboard');
            let parsedData = null;

            if (isJson) {
                try {
                    const json = JSON.parse(content);
                    if (json.format === 'outliner/nodes') {
                        parsedData = json.nodes;
                    }
                } catch (e) {
                    console.warn('Clipboard contained invalid JSON', e);
                }
            } else {
                parsedData = parseIndentedText(content);
            }

            if (parsedData && parsedData.length > 0) {
                const node = state.nodes[id];
                const parent = state.nodes[node.parentId || ''];
                if (parent) {
                    const index = parent.children.indexOf(id) + 1;
                    state.pasteNodes(parent.id, index, parsedData);
                }
            }
        };

        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                if (item.types.includes('application/json')) {
                    const blob = await item.getType('application/json');
                    const text = await blob.text();
                    await executePaste(text, true);
                    return;
                }
            }
        } catch (e) {
            // Ignore read() errors
        }

        try {
            const text = await navigator.clipboard.readText();
            await executePaste(text, false);
        } catch (e) {
            console.error('Failed to paste from clipboard', e);
        }
    };

    return { copyNodes, cutNodes, handleClipboardPaste };
};
