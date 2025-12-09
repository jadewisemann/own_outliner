import React, { useState } from 'react';
import { useOutlinerStore } from '@/store/useOutlinerStore';
import type { NodeId } from '@/types/outliner';
// Actually we need a simple list popup.

export const NodeBacklinksIndicator: React.FC<{ id: NodeId }> = ({ id }) => {
    const backlinks = useOutlinerStore(state => state.backlinks[id]);
    const nodes = useOutlinerStore(state => state.nodes);
    const navigateToNode = useOutlinerStore(state => state.navigateToNode);

    const [showPopup, setShowPopup] = useState(false);
    const popupRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setShowPopup(false);
            }
        };

        if (showPopup) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPopup]);

    if (!backlinks || backlinks.length === 0) return null;

    return (
        <div className="relative inline-block ml-2 align-middle" ref={popupRef}>
            <button
                className="w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center cursor-pointer transition-colors"
                title={`${backlinks.length} backlinks`}
                onClick={(e) => {
                    e.stopPropagation();
                    setShowPopup(!showPopup);
                }}
            >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </button>

            {showPopup && (
                <div
                    className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-64 max-h-48 overflow-y-auto right-0 mt-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 border-b">
                        Linked from:
                    </div>
                    {backlinks.map(sourceId => {
                        const sourceNode = nodes[sourceId];
                        return (
                            <div
                                key={sourceId}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-700 truncate border-b border-gray-100 last:border-0"
                                onClick={() => {
                                    navigateToNode(sourceId);
                                    setShowPopup(false);
                                }}
                            >
                                {sourceNode ? sourceNode.content || 'Empty Node' : 'Unknown Node'}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
