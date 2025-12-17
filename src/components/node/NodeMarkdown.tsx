import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { NodeReference } from './NodeReference';

interface NodeMarkdownProps {
    content: string;
}

// Regex to capture ((UUID)) - supporting standard UUID format or simpler ids
// Use negative lookbehind to avoid matching ((UUID)) if it is part of a markdown link like [label](((UUID)))
// Note: Lookbehind support in JS regex is generally good in modern envs.
// Regex to capture ((UUID)) and [[Title wiki-link]]
// 1. ((UUID))
// 2. [[Title]]
const BLOCK_REF_REGEX = /(?<!\]\(|\]\(\()(\(\([a-zA-Z0-9-]+\)\))|(\[\[[^\]]+\]\])/g;

import { useOutlinerStore } from '@/store/outlinerStore'; // Import store

const resolveDocument = (linkText: string, documents: any[]) => {
    // 1. Exact match first (optimization & fast path for simple links)
    const exactMatch = documents.find(d => d.title === linkText);
    if (exactMatch) return exactMatch;

    // 2. Path resolution
    const parts = linkText.split('/');
    if (parts.length <= 1) return null; // Already checked exact match above

    const targetTitle = parts.pop() || '';
    const pathSegments = parts.reverse(); // Bottom-up validation

    const candidates = documents.filter(d => d.title === targetTitle);

    return candidates.find(doc => {
        let current = doc;
        for (const segment of pathSegments) {
            if (!current.parentId) return false;
            const parent = documents.find(d => d.id === current.parentId);
            if (!parent || parent.title !== segment) return false;
            current = parent;
        }
        return true;
    });
};

export const NodeMarkdown: React.FC<NodeMarkdownProps> = ({ content }) => {
    const documents = useOutlinerStore(state => state.documents);
    const setActiveDocument = useOutlinerStore(state => state.setActiveDocument);

    if (!content || content.trim() === '') {
        return <span className="text-gray-300 italic">Empty node</span>;
    }

    // Split content by the regex, keeping the delimiters
    const parts = content.split(BLOCK_REF_REGEX);

    return (
        <span className="oo-node-markdown-wrapper">
            {parts.map((part, index) => {
                if (!part) return null; // Filter undefined from regex groups

                if (part.startsWith('((') && part.endsWith('))')) {
                    // It's a naked block ref: ((id))
                    const id = part.slice(2, -2);
                    return <NodeReference key={index} nodeId={id} />;
                }

                if (part.startsWith('[[') && part.endsWith(']]')) {
                    // It's a wiki link: [[Title]], [[Title|Alias]], [[^BlockID]], [[Title^BlockID]]
                    const rawContent = part.slice(2, -2);

                    // Check for Block Link (contains ^)
                    if (rawContent.includes('^')) {
                        const [targetDocTitle, blockId] = rawContent.split('^');

                        // Case: [[^id]] (Local)
                        if (targetDocTitle === '') {
                            return <NodeReference key={index} nodeId={blockId} />;
                        }

                        // Case: [[Title^id]] (Remote)
                        // Verify target doc exists
                        const targetDoc = resolveDocument(targetDocTitle, documents);
                        if (targetDoc) {
                            // Render as Remote Node Reference
                            // TODO: NodeReference needs to learn how to fetch/display *remote* nodes?
                            // Currently NodeReference takes 'nodeId'. 
                            // If it relies on 'useNodeLogic', it checks 'store.nodes'.
                            // If remote node is not in store, it will fail/empty.
                            // For now, we render a Link to the Doc, maybe with a suffix?
                            // Or we try NodeReference (it might work if we have the node loaded).
                            // User requirement: "Display it correctly". 
                            // If it breaks, use fallback text.
                            return (
                                <span key={index} className="inline-flex items-baseline gap-1">
                                    <span
                                        className="text-blue-600 hover:underline cursor-pointer font-medium text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveDocument(targetDoc.id);
                                            // We should also focus the node... passed as param?
                                            // Store needs 'flashId' or similar.
                                        }}
                                    >
                                        @{targetDocTitle}
                                    </span>
                                    <NodeReference nodeId={blockId} />
                                </span>
                            );
                        } else {
                            // Broken Remote Link
                            return <span key={index} className="text-red-400 opacity-60">[[{rawContent}]]</span>;
                        }
                    }

                    // Regular Wiki Link
                    const [linkTarget, linkAlias] = rawContent.split('|');
                    const displayText = linkAlias || linkTarget;

                    const targetDoc = resolveDocument(linkTarget, documents);

                    if (targetDoc) {
                        return (
                            <span
                                key={index}
                                className="text-blue-600 hover:underline cursor-pointer font-medium"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDocument(targetDoc.id);
                                }}
                            >
                                {displayText}
                            </span>
                        );
                    } else {
                        // Broken link
                        return <span key={index} className="text-red-400 opacity-60">[[{rawContent}]]</span>;
                    }
                }

                // It's regular markdown content
                // Skip empty strings from split
                if (part === '') return null;

                return (
                    <span key={index} className="inline">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ node, ...props }) => <p className="oo-markdown-p m-0 inline" {...props} />,
                                a: ({ node, href, children, ...props }) => {
                                    if (!href) return <a {...props}>{children}</a>;

                                    let targetId: string | null = null;

                                    if (href.match(/^[a-zA-Z0-9-]+$/)) {
                                        targetId = href;
                                    } else if (href.startsWith('((') && href.endsWith('))')) {
                                        targetId = href.slice(2, -2);
                                    }

                                    if (targetId) {
                                        return <NodeReference nodeId={targetId}>{children}</NodeReference>;
                                    }

                                    return <a className="oo-markdown-link text-blue-500 hover:underline pointer-events-auto" onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer" href={href} {...props}>{children}</a>
                                },
                                h1: ({ node, ...props }) => <h1 className="oo-markdown-h1 text-xl font-bold mt-2 mb-1 text-gray-900 inline-block" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="oo-markdown-h2 text-lg font-bold mt-2 mb-1 text-gray-800 inline-block" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="oo-markdown-h3 text-base font-bold mt-1 mb-1 text-gray-800 inline-block" {...props} />,
                                blockquote: ({ node, ...props }) => <blockquote className="oo-markdown-blockquote border-l-4 border-gray-300 pl-2 text-gray-500 italic my-1 inline-block" {...props} />,
                                code: ({ node, ...props }) => <code className="oo-markdown-code bg-gray-100 px-1 rounded text-sm font-mono text-red-500" {...props} />,
                                strong: ({ node, ...props }) => <strong className="oo-markdown-bold font-bold" {...props} />,
                                em: ({ node, ...props }) => <em className="oo-markdown-italic italic" {...props} />,
                                del: ({ node, ...props }) => <del className="oo-markdown-strike line-through" {...props} />,
                            }}
                        >
                            {part}
                        </ReactMarkdown>
                    </span>
                );
            })}
        </span>
    );
};
