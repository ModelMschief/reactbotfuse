import React from 'react';
import { DocParameter, DocHeader, DocResponse } from '@/types/docs';

interface SchemaTableProps {
  parameters?: DocParameter[];
  headers?: DocHeader[];
  responses?: DocResponse[];
}

export const SchemaTable: React.FC<SchemaTableProps> = ({ parameters = [], headers = [], responses = [] }) => {
  return (
    <div className="space-y-6">
      {/* Headers Table */}
      {headers.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            HTTP Headers
          </h4>
          <div className="overflow-x-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-surface-hover)]/60 text-[var(--text-secondary)] font-semibold">
                  <th className="py-2.5 px-3">Header</th>
                  <th className="py-2.5 px-3">Required</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {headers.map((h, i) => (
                  <tr key={i} className="hover:bg-[var(--bg-surface-hover)]/40 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-[var(--primary-color)]">
                      {h.name}
                    </td>
                    <td className="py-2 px-3">
                      {h.required ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                          REQUIRED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-color)]">
                          OPTIONAL
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[var(--text-secondary)]">{h.description}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-[var(--text-muted)]">
                      {h.example || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parameters Table */}
      {parameters.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Parameters & Fields
          </h4>
          <div className="overflow-x-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-surface-hover)]/60 text-[var(--text-secondary)] font-semibold">
                  <th className="py-2.5 px-3">Field</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Required</th>
                  <th className="py-2.5 px-3">Description & Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {parameters.map((p, i) => (
                  <tr key={i} className="hover:bg-[var(--bg-surface-hover)]/40 transition-colors">
                    <td className="py-2 px-3 font-mono font-semibold text-[var(--text-primary)]">
                      {p.name}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {p.type}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {p.location}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {p.required ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                          REQUIRED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-color)]">
                          OPTIONAL
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 space-y-1">
                      <div className="text-[var(--text-secondary)]">{p.description}</div>
                      {p.example !== undefined && (
                        <div className="text-[11px] font-mono text-[var(--text-muted)]">
                          <span className="text-[var(--text-muted)] opacity-70">Example: </span>
                          <span className="text-[var(--primary-color)]">
                            {typeof p.example === 'object' ? JSON.stringify(p.example) : String(p.example)}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Responses Table */}
      {responses.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Response Statuses
          </h4>
          <div className="space-y-2">
            {responses.map((resp, i) => {
              const isSuccess = resp.status >= 200 && resp.status < 300;
              const isRedirect = resp.status >= 300 && resp.status < 400;
              const badgeBg = isSuccess
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : isRedirect
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30';

              return (
                <div key={i} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-surface)] border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${badgeBg}`}>
                        {resp.status}
                      </span>
                      <span className="text-xs font-medium text-[var(--text-primary)]">
                        {resp.description}
                      </span>
                    </div>
                  </div>
                  {resp.body && (
                    <div className="p-3 bg-black/60 overflow-x-auto text-[11px] font-mono text-emerald-400/90 max-h-48">
                      <pre className="whitespace-pre">{resp.body}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
