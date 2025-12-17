import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useBacklinks } from '../hooks/useBacklinks';

export const Backlinks = () => {
    const { backlinks, handleNavigate } = useBacklinks();
    const [isOpen, setIsOpen] = useState(true);

    // Keep the panel visible even if empty
    // if (backlinks.length === 0) return null; 

    return (
        <div className="mt-12 pt-8 border-t border-slate-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 text-sm font-semibold text-slate-500 mb-4 px-2 hover:text-slate-700 transition-colors"
            >
                <div className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                    <ChevronRight size={16} />
                </div>
                <span>
                    {backlinks.length} Linked References
                </span>
            </button>

            {isOpen && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {backlinks.length === 0 ? (
                        <div className="px-3 py-4 text-sm text-slate-400 italic text-center rounded-lg bg-slate-50 border border-slate-100 border-dashed">
                            No linked references yet.
                        </div>
                    ) : (
                        backlinks.map((link) => (
                            <div
                                key={link.id}
                                onClick={() => handleNavigate(link)}
                                className="p-3 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors border border-transparent hover:border-slate-200"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {link.sourceDocTitle}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-700 line-clamp-2 font-mono text-xs">
                                    {link.excerpt || '(No content)'}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
