
import React, { useEffect, useState } from 'react';
import { useOutlinerStore } from '@/store/outlinerStore';
import { supabase } from '@/lib/supabase';
import { ChevronDown, ChevronRight, Link as LinkIcon } from 'lucide-react';

interface Reference {
    id: string;
    source_document_id: string;
    target_document_id: string;
    created_at: string;
    documents: {
        id: string;
        title: string;
    };
}

export const DocumentBacklinks: React.FC = () => {
    const activeDocumentId = useOutlinerStore(state => state.activeDocumentId);
    const setActiveDocument = useOutlinerStore(state => state.setActiveDocument);
    const [backlinks, setBacklinks] = useState<Reference[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        if (!activeDocumentId) {
            setBacklinks([]);
            return;
        }

        const fetchBacklinks = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('document_references')
                .select(`
                    id,
                    source_document_id,
                    target_document_id,
                    created_at,
                    documents!document_references_source_document_id_fkey (
                        id,
                        title
                    )
                `)
                .eq('target_document_id', activeDocumentId);

            if (error) {
                console.error('Error fetching backlinks:', error);
            } else {
                const formatted = data?.map((item: any) => ({
                    ...item,
                    documents: item.documents
                })) || [];
                setBacklinks(formatted);
            }
            setIsLoading(false);
        };

        fetchBacklinks();
    }, [activeDocumentId]);

    // Always render, just show empty state if needed.
    if (!activeDocumentId) return null;

    return (
        <div className="mt-16 pt-4 border-t border-gray-100 animate-in fade-in duration-500">
            {/* Header / Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors w-full text-left py-2 mb-2"
            >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="text-sm font-semibold select-none">
                    Linked References
                </span>
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                    {backlinks.length}
                </span>
                {isLoading && <span className="ml-2 text-xs opacity-50 font-normal">Loading...</span>}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="pl-6">
                    {backlinks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {backlinks.map(link => (
                                <div
                                    key={link.id}
                                    onClick={() => setActiveDocument(link.source_document_id)}
                                    className="
                                        group flex flex-col p-3 rounded-lg border border-gray-100 bg-white 
                                        hover:border-blue-200 hover:shadow-sm cursor-pointer transition-all
                                    "
                                >
                                    <div className="flex items-start gap-2">
                                        <LinkIcon size={14} className="mt-0.5 text-gray-300 group-hover:text-blue-400" />
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate">
                                                {link.documents?.title || 'Untitled Document'}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                Linked {new Date(link.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400 italic py-2">
                            No linked references yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
