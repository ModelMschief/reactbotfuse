import React from 'react';
import { DocCategory } from '@/types/docs';
import { List, ArrowUp, Zap } from 'lucide-react';

interface DocsQuickNavProps {
  categories: DocCategory[];
  activeCategory: string | null;
  activeEndpointId: string | null;
  onSelectEndpoint: (id: string) => void;
  onScrollToTop: () => void;
}

export const DocsQuickNav: React.FC<DocsQuickNavProps> = ({
  categories,
  activeCategory,
  activeEndpointId,
  onSelectEndpoint,
  onScrollToTop
}) => {
  // Determine relevant endpoints to display in quick nav
  const currentCategoryObj = activeCategory
    ? categories.find((c) => c.id === activeCategory)
    : null;

  return (
    <aside className="hidden xl:block w-60 h-[calc(100vh-80px)] sticky top-20 flex-shrink-0 p-4 border-l border-[var(--border-color)] bg-[var(--bg-surface)] overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          <List size={14} className="text-[var(--primary-color)]" />
          <span>On This Page</span>
        </div>

        {/* Quick section links */}
        <div className="space-y-1 text-xs">
          <button
            onClick={() => onSelectEndpoint('overview')}
            className={`w-full text-left px-2 py-1 rounded transition-colors ${
              activeEndpointId === 'overview'
                ? 'text-[var(--primary-color)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Overview & Architecture
          </button>
          <button
            onClick={() => onSelectEndpoint('auth-schemes')}
            className={`w-full text-left px-2 py-1 rounded transition-colors ${
              activeEndpointId === 'auth-schemes'
                ? 'text-[var(--primary-color)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Authentication Schemes
          </button>
          <button
            onClick={() => onSelectEndpoint('ratelimits')}
            className={`w-full text-left px-2 py-1 rounded transition-colors ${
              activeEndpointId === 'ratelimits'
                ? 'text-[var(--primary-color)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Rate Limits & Safety
          </button>
          <button
            onClick={() => onSelectEndpoint('statuscodes')}
            className={`w-full text-left px-2 py-1 rounded transition-colors ${
              activeEndpointId === 'statuscodes'
                ? 'text-[var(--primary-color)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            HTTP Status Codes
          </button>
        </div>

        {/* Category Endpoints List */}
        {currentCategoryObj && (
          <div className="pt-3 border-t border-[var(--border-color)] space-y-1.5">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              {currentCategoryObj.name}
            </span>
            <div className="space-y-1">
              {currentCategoryObj.endpoints.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => onSelectEndpoint(ep.id)}
                  className={`w-full text-left text-[11px] font-mono px-2 py-1 rounded transition-colors truncate block ${
                    activeEndpointId === ep.id
                      ? 'text-[var(--primary-color)] font-bold bg-[var(--primary-color)]/10'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                  title={ep.path}
                >
                  {ep.method} {ep.path}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Back to top */}
        <div className="pt-4 border-t border-[var(--border-color)]">
          <button
            onClick={onScrollToTop}
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
          >
            <ArrowUp size={14} />
            <span>Back to top</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
