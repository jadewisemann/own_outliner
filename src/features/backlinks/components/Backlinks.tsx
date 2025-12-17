
import { useBacklinks } from '../hooks/useBacklinks';

export const Backlinks = () => {
    const { backlinks, handleNavigate } = useBacklinks();

    if (backlinks.length === 0) return null;

    return (
        <div className="mt-12 pt-8 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 mb-4 px-2">
                {backlinks.length} Linked References
            </h3>
            <div className="space-y-2">
                {backlinks.map((link) => (
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
                        {/* Excerpt rendering - Truncate or formatted? */}
                        <div className="text-sm text-slate-700 line-clamp-2 font-mono text-xs">
                            {link.excerpt || '(No content)'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
