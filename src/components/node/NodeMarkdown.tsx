import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NodeMarkdownProps {
    content: string;
}

export const NodeMarkdown: React.FC<NodeMarkdownProps> = ({ content }) => {
    if (content.trim() === '') {
        return <span className="text-gray-300 italic">Empty node</span>;
    }

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: ({ node, ...props }) => <p className="oo-markdown-p m-0" {...props} />,
                a: ({ node, ...props }) => <a className="oo-markdown-link text-blue-500 hover:underline pointer-events-auto" onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer" {...props} />,
                h1: ({ node, ...props }) => <h1 className="oo-markdown-h1 text-xl font-bold mt-2 mb-1 text-gray-900" {...props} />,
                h2: ({ node, ...props }) => <h2 className="oo-markdown-h2 text-lg font-bold mt-2 mb-1 text-gray-800" {...props} />,
                h3: ({ node, ...props }) => <h3 className="oo-markdown-h3 text-base font-bold mt-1 mb-1 text-gray-800" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="oo-markdown-blockquote border-l-4 border-gray-300 pl-2 text-gray-500 italic my-1" {...props} />,
                code: ({ node, ...props }) => <code className="oo-markdown-code bg-gray-100 px-1 rounded text-sm font-mono text-red-500" {...props} />,
                strong: ({ node, ...props }) => <strong className="oo-markdown-bold font-bold" {...props} />,
                em: ({ node, ...props }) => <em className="oo-markdown-italic italic" {...props} />,
                del: ({ node, ...props }) => <del className="oo-markdown-strike line-through" {...props} />,
            }}
        >
            {content}
        </ReactMarkdown>
    );
};
