import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DOC_CATEGORIES } from '@/data/docsData';
import { DocCategory, DocEndpoint } from '@/types/docs';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { DocsQuickNav } from '@/components/docs/DocsQuickNav';
import { DocsOverview } from '@/components/docs/DocsOverview';
import { EndpointCard } from '@/components/docs/EndpointCard';
import { 
  Search, 
  Filter, 
  Server, 
  Menu, 
  ChevronRight, 
  Layers, 
  SlidersHorizontal,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

const Docs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeEndpointId, setActiveEndpointId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Server Environment URL
  const [baseUrl, setBaseUrl] = useState('https://botfusion.onrender.com');
  const [customUrlModal, setCustomUrlModal] = useState(false);

  // Sync with URL Query Parameters on mount / change
  useEffect(() => {
    const cat = searchParams.get('category');
    const ep = searchParams.get('endpoint');
    const q = searchParams.get('q');

    if (cat) setActiveCategory(cat);
    if (ep) {
      setActiveEndpointId(ep);
      // Scroll to endpoint if present
      setTimeout(() => {
        const el = document.getElementById(ep);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
    }
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // Handle category / endpoint selection
  const handleSelectCategory = (catId: string | null) => {
    setActiveCategory(catId);
    if (catId) {
      setSearchParams({ category: catId });
    } else {
      setSearchParams({});
    }
  };

  const handleSelectEndpoint = (epId: string) => {
    setActiveEndpointId(epId);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('endpoint', epId);
      return p;
    });

    const el = document.getElementById(epId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter Categories & Endpoints
  const filteredCategories = useMemo(() => {
    return DOC_CATEGORIES.map((cat) => {
      // If a category is explicitly selected and it's not this one, filter out if not searching
      if (activeCategory && activeCategory !== cat.id && !searchQuery) {
        return null;
      }

      const matchingEndpoints = cat.endpoints.filter((ep) => {
        const matchesSearch =
          !searchQuery ||
          ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ep.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ep.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (ep.tags && ep.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

        const matchesMethod =
          selectedMethod === 'ALL' || ep.method === selectedMethod;

        return matchesSearch && matchesMethod;
      });

      if (matchingEndpoints.length === 0 && (searchQuery || selectedMethod !== 'ALL')) {
        return null;
      }

      return {
        ...cat,
        endpoints: matchingEndpoints
      };
    }).filter(Boolean) as DocCategory[];
  }, [activeCategory, searchQuery, selectedMethod]);

  const totalEndpointsCount = useMemo(() => {
    return filteredCategories.reduce((acc, c) => acc + c.endpoints.length, 0);
  }, [filteredCategories]);

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
      {/* Sub-Header bar for Docs Navigation & Environment Switcher */}
      <div className="sticky top-16 z-30 border-b border-[var(--border-color)] bg-[var(--bg-surface)]/90 backdrop-blur-md px-4 py-2.5">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Mobile Drawer Trigger & Breadcrumbs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] lg:hidden"
              aria-label="Toggle Docs Sidebar"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span>Docs</span>
              <ChevronRight size={12} />
              <span className="font-semibold text-[var(--text-primary)]">
                {activeCategory
                  ? DOC_CATEGORIES.find((c) => c.id === activeCategory)?.name || 'Category'
                  : 'All Endpoints'}
              </span>
            </div>
          </div>

          {/* Right: Environment Selector & Quick Filter Badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[var(--bg-app)] border border-[var(--border-color)] px-2.5 py-1 rounded-lg text-xs">
              <Server size={13} className="text-emerald-500" />
              <span className="text-[var(--text-muted)]">Target API:</span>
              <select
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="bg-transparent text-[var(--text-primary)] font-mono font-medium focus:outline-none cursor-pointer"
              >
                <option value="https://botfusion.onrender.com">Production (botfusion.onrender.com)</option>
                <option value="http://localhost:8080">Local Dev (localhost:8080)</option>
                <option value="https://bscusdtapi.onrender.com">Gateway Direct (bscusdtapi.onrender.com)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="container mx-auto flex-1 flex">
        {/* Left Navigation Sidebar */}
        <DocsSidebar
          categories={DOC_CATEGORIES}
          activeCategory={activeCategory}
          activeEndpointId={activeEndpointId}
          onSelectCategory={handleSelectCategory}
          onSelectEndpoint={handleSelectEndpoint}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedMethod={selectedMethod}
          onMethodChange={setSelectedMethod}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Center Main Documentation Body */}
        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-10">
          {/* Render Overview Section on Top */}
          {(!activeCategory || activeCategory === 'all') && !searchQuery && (
            <DocsOverview />
          )}

          {/* Category Filter Pills (if all shown) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handleSelectCategory(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCategory === null
                    ? 'bg-[var(--primary-color)] text-white shadow-sm'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)]'
                }`}
              >
                All Categories ({DOC_CATEGORIES.reduce((acc, c) => acc + c.endpoints.length, 0)})
              </button>

              {DOC_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeCategory === c.id
                      ? 'bg-[var(--primary-color)] text-white shadow-sm'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)]'
                  }`}
                >
                  {c.name} ({c.endpoints.length})
                </button>
              ))}
            </div>

            <span className="text-xs text-[var(--text-muted)] font-mono">
              Showing {totalEndpointsCount} endpoints
            </span>
          </div>

          {/* Render Filtered Endpoint Groups */}
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16 p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-3">
              <Search size={32} className="mx-auto text-[var(--text-muted)] opacity-50" />
              <h3 className="text-base font-bold text-[var(--text-primary)]">No endpoints matched your search</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                No matching routes found for &quot;{searchQuery}&quot;. Try clearing filters or searching for endpoint names like &quot;autoup&quot;, &quot;score_user&quot;, &quot;signup&quot;, or &quot;crypto&quot;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedMethod('ALL');
                  setActiveCategory(null);
                }}
                className="btn btn-primary text-xs px-4 py-2"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredCategories.map((category) => (
                <section key={category.id} id={`cat-${category.id}`} className="space-y-6">
                  {/* Category Header */}
                  <div className="border-b border-[var(--border-color)] pb-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[var(--text-primary)]">{category.name}</h2>
                      {category.badge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--primary-color)]/10 text-[var(--primary-color)] border border-[var(--primary-color)]/20">
                          {category.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{category.description}</p>
                  </div>

                  {/* Endpoints Cards */}
                  <div className="space-y-4">
                    {category.endpoints.map((ep) => (
                      <EndpointCard
                        key={ep.id}
                        endpoint={ep}
                        baseUrl={baseUrl}
                        isExpandedDefault={category.endpoints.length === 1 || activeEndpointId === ep.id}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>

        {/* Right Sticky Quick Navigation */}
        <DocsQuickNav
          categories={DOC_CATEGORIES}
          activeCategory={activeCategory}
          activeEndpointId={activeEndpointId}
          onSelectEndpoint={handleSelectEndpoint}
          onScrollToTop={handleScrollToTop}
        />
      </div>
    </div>
  );
};

export default Docs;
