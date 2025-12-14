import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useOutlinerStore } from '@/store/outliner';
import type { NodeId } from '@/types/outliner';
// Actually we need a simple list popup.

export const NodeBacklinksIndicator: React.FC<{ id: NodeId }> = ({ id }) => {
    const backlinks = useOutlinerStore(state => state.backlinks[id]);
    const nodes = useOutlinerStore(state => state.nodes);
    const navigateToNode = useOutlinerStore(state => state.navigateToNode);

    const [showPopup, setShowPopup] = useState(false);
    const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    const togglePopup = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!showPopup && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const top = rect.bottom + 4; // 4px spacing

            // Heuristic: If button is past 60% of screen width, align right.
            const isRightSide = rect.left > window.innerWidth * 0.6;

            const style: React.CSSProperties = {
                top: top,
                position: 'fixed',
            };

            if (isRightSide) {
                style.right = window.innerWidth - rect.right;
                style.transformOrigin = 'top right';
            } else {
                style.left = rect.left;
                style.transformOrigin = 'top left';
            }

            setPopupStyle(style);
            setShowPopup(true);
        } else {
            setShowPopup(false);
        }
    };

    useEffect(() => {
        const handleInteraction = (event: Event) => {
            // Close on click outside or scroll
            if (showPopup) {
                if (event.type === 'mousedown' && popupRef.current && popupRef.current.contains(event.target as Node)) {
                    return; // Click inside popup
                }
                setShowPopup(false);
            }
        };

        if (showPopup) {
            document.addEventListener('mousedown', handleInteraction);
            window.addEventListener('scroll', handleInteraction, true); // Capture scroll
            window.addEventListener('resize', handleInteraction);
        }

        return () => {
            document.removeEventListener('mousedown', handleInteraction);
            window.removeEventListener('scroll', handleInteraction, true);
            window.removeEventListener('resize', handleInteraction);
        };
    }, [showPopup]);

    if (!backlinks || backlinks.length === 0) return null;

    return (
        <>
            <div className="relative inline-block ml-2 align-middle pointer-events-auto">
                <button
                    ref={buttonRef}
                    className="w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center cursor-pointer transition-colors"
                    title={`${backlinks.length} backlinks`}
                    onClick={togglePopup}
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                </button>
            </div>

            {showPopup && createPortal(
                <div
                    ref={popupRef}
                    className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl w-72 max-h-56 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                    style={popupStyle}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 border-b flex-shrink-0 flex justify-between items-center">
                        <span>Linked from {backlinks.length} notes</span>
                    </div>
                    <div className="overflow-y-auto">
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
                </div>,
                document.body
            )}
        </>
    );
};
