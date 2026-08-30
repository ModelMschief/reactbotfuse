import React, { useState } from 'react';
import { DocEndpoint } from '@/types/docs';
import { SchemaTable } from './SchemaTable';
import { CodeSnippetViewer } from './CodeSnippetViewer';
import { ApiConsole } from './ApiConsole';
import { 
  Key, 
  ShieldCheck, 
  Clock, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Code2, 
  Play, 
  FileText,
  Lock,
  Globe
} from 'lucide-react';

interface EndpointCardProps {
  endpoint: DocEndpoint;
  baseUrl: string;
  isExpandedDefault?: boolean;
}

export const EndpointCard: React.FC<EndpointCardProps> = ({
  endpoint,
  baseUrl,
  isExpandedDefault = true
}) => {
  const [isExpanded, setIsExpanded] = useState(isExpandedDefault);
  const [activeTab, setActiveTab] = useState<'schema' | 'snippets' | 'console'>('schema');
  const [copiedPath, setCopiedPath] = useState(false);

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'POST':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      case 'PUT':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'DELETE':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'ALL':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getAuthBadge = (auth: string) => {
    if (auth === 'None') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-500/10 text-[var(--text-muted)] border border-[var(--border-color)]">
          <Globe size={11} /> Public
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/30">
        <Lock size={11} /> {auth}
      </span>
    );
  };

  const copyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(endpoint.path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  return (
    <div
      id={endpoint.id}
      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] overflow-hidden shadow-sm transition-all duration-200 hover:border-[var(--primary-color)]/50"
    >
      {/* Endpoint Header / Trigger */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer hover:bg-[var(--bg-surface-hover)]/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 select-none"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Method Badge */}
          <span className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold border ${getMethodBadgeClass(endpoint.method)}`}>
            {endpoint.method}
          </span>

          {/* Path */}
          <span className="font-mono text-sm md:text-base font-semibold text-[var(--text-primary)]">
            {endpoint.path}
          </span>

          {/* Copy path icon */}
          <button
            onClick={copyPath}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            title="Copy path"
          >
            {copiedPath ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Right meta */}
        <div className="flex items-center gap-2.5 text-xs">
          {getAuthBadge(endpoint.auth)}
          {endpoint.rateLimit && (
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-app)] border border-[var(--border-color)]">
              <Clock size={11} /> {endpoint.rateLimit}
            </span>
          )}
          <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Title & Summary banner */}
      <div className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-app)]/50 flex flex-col gap-1">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">{endpoint.title}</h3>
        <p className="text-xs text-[var(--text-secondary)]">{endpoint.description}</p>
        {endpoint.tags && endpoint.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {endpoint.tags.map((t, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)]"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Details Body */}
      {isExpanded && (
        <div className="p-4 border-t border-[var(--border-color)] space-y-4">
          {/* Inner tab selectors */}
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <button
              onClick={() => setActiveTab('schema')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'schema'
                  ? 'bg-[var(--primary-color)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <FileText size={13} />
              <span>Parameters & Schema</span>
            </button>

            <button
              onClick={() => setActiveTab('snippets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'snippets'
                  ? 'bg-[var(--primary-color)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <Code2 size={13} />
              <span>Code Snippets</span>
            </button>

            <button
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'console'
                  ? 'bg-[var(--primary-color)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <Play size={13} />
              <span>Try It Out (Console)</span>
            </button>
          </div>

          {/* Tab Views */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <SchemaTable
                parameters={endpoint.parameters}
                headers={endpoint.headers}
                responses={endpoint.responses}
              />
              {endpoint.notes && endpoint.notes.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-600 dark:text-amber-400 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <span>⚠️ Implementation Notes:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {endpoint.notes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'snippets' && (
            <CodeSnippetViewer endpoint={endpoint} baseUrl={baseUrl} />
          )}

          {activeTab === 'console' && (
            <ApiConsole endpoint={endpoint} baseUrl={baseUrl} />
          )}
        </div>
      )}
    </div>
  );
};
