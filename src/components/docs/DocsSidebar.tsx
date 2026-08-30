import React from 'react';
import { DocCategory, HttpMethod } from '@/types/docs';
import { 
  Shield, 
  Key, 
  Cpu, 
  Bot, 
  CreditCard, 
  Activity, 
  Search, 
  X, 
  BookOpen, 
  Gauge, 
  HelpCircle, 
  Layers
} from 'lucide-react';

interface DocsSidebarProps {
  categories: DocCategory[];
  activeCategory: string | null;
  activeEndpointId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectEndpoint: (endpointId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({
  categories,
  activeCategory,
  activeEndpointId,
  onSelectCategory,
  onSelectEndpoint,
  searchQuery,
  onSearchChange,
  selectedMethod,
  onMethodChange,
  isOpenMobile,
  onCloseMobile
}) => {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shield':
        return <Shield size={16} />;
      case 'Key':
        return <Key size={16} />;
      case 'Cpu':
        return <Cpu size={16} />;
      case 'Bot':
        return <Bot size={16} />;
      case 'CreditCard':
        return <CreditCard size={16} />;
      case 'Activity':
        return <Activity size={16} />;
      default:
        return <Layers size={16} />;
    }
  };

  const getMethodBadge = (method: HttpMethod) => {
    switch (method) {
      case 'GET':
        return <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400">GET</span>;
      case 'POST':
        return <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400">POST</span>;
      case 'PUT':
        return <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400">PUT</span>;
      case 'DELETE':
        return <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-500/10 text-red-400">DEL</span>;
      case 'ALL':
        return <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400">ALL</span>;
      default:
        return <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-gray-500/10 text-gray-400">{method}</span>;
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] border-r border-[var(--border-color)]">
      {/* Sidebar Header & Search */}
      <div className="p-4 border-b border-[var(--border-color)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="text-[var(--primary-color)]" size={20} />
            <h2 className="font-bold text-sm text-[var(--text-primary)]">API Reference</h2>
          </div>
          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] md:hidden"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search endpoints..."
            className="w-full text-xs pl-8 pr-8 py-2 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Method Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono">
          {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map((m) => (
            <button
              key={m}
              onClick={() => onMethodChange(selectedMethod === m ? 'ALL' : m)}
              className={`px-2 py-1 rounded transition-all ${
                selectedMethod === m
                  ? 'bg-[var(--primary-color)] text-white font-bold'
                  : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Core System Guides */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 mb-1.5 block">
            Guides & Overview
          </span>
          <div className="space-y-0.5">
            <button
              onClick={() => {
                onSelectCategory(null);
                onSelectEndpoint('overview');
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                activeEndpointId === 'overview' && activeCategory === null
                  ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <Gauge size={14} />
              <span>Overview & Architecture</span>
            </button>

            <button
              onClick={() => {
                onSelectCategory(null);
                onSelectEndpoint('ratelimits');
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                activeEndpointId === 'ratelimits'
                  ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <Activity size={14} />
              <span>Rate Limits & Safety</span>
            </button>

            <button
              onClick={() => {
                onSelectCategory(null);
                onSelectEndpoint('statuscodes');
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                activeEndpointId === 'statuscodes'
                  ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <HelpCircle size={14} />
              <span>HTTP Status & Errors</span>
            </button>
          </div>
        </div>

        {/* API Categories */}
        <div className="space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 block">
            Endpoint Categories
          </span>

          {categories.map((cat) => {
            const filteredEndpoints = cat.endpoints.filter((ep) => {
              const matchesSearch =
                !searchQuery ||
                ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ep.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (ep.tags && ep.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

              const matchesMethod =
                selectedMethod === 'ALL' || ep.method === selectedMethod;

              return matchesSearch && matchesMethod;
            });

            if (filteredEndpoints.length === 0 && searchQuery) return null;

            const isSelected = activeCategory === cat.id;

            return (
              <div key={cat.id} className="space-y-1">
                {/* Category Header */}
                <button
                  onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[var(--primary-color)]">
                      {getCategoryIcon(cat.iconName)}
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-app)] text-[var(--text-muted)] border border-[var(--border-color)]">
                    {filteredEndpoints.length}
                  </span>
                </button>

                {/* Endpoint Sub-items */}
                <div className="pl-3 space-y-0.5 border-l border-[var(--border-color)] ml-3">
                  {filteredEndpoints.map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => {
                        onSelectEndpoint(ep.id);
                        if (isOpenMobile) onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono transition-colors text-left truncate ${
                        activeEndpointId === ep.id
                          ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-bold'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <span className="truncate">{ep.path}</span>
                      {getMethodBadge(ep.method)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-app)]/60 text-center">
        <span className="text-[10px] text-[var(--text-muted)] font-mono">
          BotFusion API v2.4 (Live)
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:block w-72 h-[calc(100vh-80px)] sticky top-20 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-80 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
