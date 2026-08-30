import React, { useState, useEffect } from 'react';
import { DocEndpoint } from '@/types/docs';
import { Play, Loader2, RotateCcw, CheckCircle2, AlertCircle, Clock, ShieldCheck, KeyRound } from 'lucide-react';

interface ApiConsoleProps {
  endpoint: DocEndpoint;
  baseUrl: string;
}

export const ApiConsole: React.FC<ApiConsoleProps> = ({ endpoint, baseUrl }) => {
  // Path params
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  // Query params
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  // Auth Key / Header state
  const [authKey, setAuthKey] = useState<string>('');
  // Body state
  const [bodyText, setBodyText] = useState<string>('');
  const [bodyJsonError, setBodyJsonError] = useState<string | null>(null);

  // Response state
  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseData, setResponseBody] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize defaults
  useEffect(() => {
    // Reset state on endpoint change
    setResponseStatus(null);
    setResponseTime(null);
    setResponseHeaders({});
    setResponseBody(null);
    setErrorMessage(null);

    // Set stored token / connection key if available in localStorage
    if (endpoint.auth === 'Bearer JWT') {
      const storedToken = localStorage.getItem('jwtToken') || '';
      setAuthKey(storedToken);
    } else if (endpoint.auth === 'X-CONNECTION-KEY') {
      setAuthKey('acct_eb3789b4a9912a8b');
    } else if (endpoint.auth === 'x-api-key') {
      setAuthKey('bfpay_live_738a92b1c0e4');
    } else if (endpoint.auth === 'X-Webhook-Token') {
      setAuthKey('MASTER_BOT_TOKEN');
    } else {
      setAuthKey('');
    }

    // Default path params
    const initialPath: Record<string, string> = {};
    const matches = endpoint.path.match(/\{(\w+)\}/g);
    if (matches) {
      matches.forEach((m) => {
        const key = m.replace(/[{}]/g, '');
        initialPath[key] = key === 'task_id' ? 'task_98f12a3b' : key === 'path' ? 'invoices' : 'example_id';
      });
    }
    setPathParams(initialPath);

    // Default query params
    const initialQuery: Record<string, string> = {};
    if (endpoint.parameters) {
      endpoint.parameters
        .filter((p) => p.location === 'query')
        .forEach((p) => {
          initialQuery[p.name] = p.example ? String(p.example) : '';
        });
    }
    setQueryParams(initialQuery);

    // Default body
    if (endpoint.requestBodyExample) {
      setBodyText(JSON.stringify(endpoint.requestBodyExample, null, 2));
    } else {
      setBodyText('');
    }
  }, [endpoint]);

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBodyText(val);
    if (!val.trim()) {
      setBodyJsonError(null);
      return;
    }
    try {
      JSON.parse(val);
      setBodyJsonError(null);
    } catch (err: any) {
      setBodyJsonError(err.message);
    }
  };

  const executeRequest = async () => {
    setIsLoading(true);
    setResponseStatus(null);
    setResponseTime(null);
    setResponseBody(null);
    setErrorMessage(null);
    setResponseHeaders({});

    // Construct final URL
    let computedPath = endpoint.path;
    Object.entries(pathParams).forEach(([k, v]) => {
      computedPath = computedPath.replace(`{${k}}`, encodeURIComponent(v));
    });

    const url = new URL(`${baseUrl}${computedPath}`);
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v) url.searchParams.append(k, v);
    });

    // Build headers
    const reqHeaders: Record<string, string> = {};
    if (endpoint.method !== 'GET' && endpoint.method !== 'HEAD') {
      reqHeaders['Content-Type'] = 'application/json';
    }

    if (endpoint.auth === 'Bearer JWT' && authKey) {
      reqHeaders['Authorization'] = `Bearer ${authKey.trim()}`;
    } else if (endpoint.auth === 'X-CONNECTION-KEY' && authKey) {
      reqHeaders['X-CONNECTION-KEY'] = authKey.trim();
    } else if (endpoint.auth === 'x-api-key' && authKey) {
      reqHeaders['x-api-key'] = authKey.trim();
    } else if (endpoint.auth === 'X-Webhook-Token' && authKey) {
      reqHeaders['X-Webhook-Token'] = authKey.trim();
    }

    const startTime = performance.now();

    try {
      const fetchOptions: RequestInit = {
        method: endpoint.method === 'ALL' ? 'POST' : endpoint.method,
        headers: reqHeaders,
      };

      if (endpoint.method !== 'GET' && endpoint.method !== 'HEAD' && bodyText.trim()) {
        fetchOptions.body = bodyText;
      }

      const res = await fetch(url.toString(), fetchOptions);
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setResponseStatus(res.status);

      // Extract headers
      const resHdrs: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        resHdrs[k] = v;
      });
      setResponseHeaders(resHdrs);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        setResponseBody(JSON.stringify(json, null, 2));
      } else {
        const text = await res.text();
        setResponseBody(text);
      }
    } catch (err: any) {
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setErrorMessage(
        `Network Error or CORS Restriction: ${err.message}. Ensure backend is running and allows browser requests.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] overflow-hidden shadow-lg space-y-4 p-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h4 className="text-sm font-bold text-[var(--text-primary)]">Interactive API Console</h4>
          <span className="text-xs text-[var(--text-muted)] font-mono">({baseUrl})</span>
        </div>

        <button
          onClick={executeRequest}
          disabled={isLoading || Boolean(bodyJsonError)}
          className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5 font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Play size={14} className="fill-current" />
              <span>Send Request</span>
            </>
          )}
        </button>
      </div>

      {/* Auth Input */}
      {endpoint.auth !== 'None' && (
        <div className="bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-color)] space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
            <KeyRound size={13} className="text-[var(--primary-color)]" />
            <span>Authorization ({endpoint.auth})</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={authKey}
              onChange={(e) => setAuthKey(e.target.value)}
              placeholder={`Enter ${endpoint.auth}...`}
              className="w-full text-xs font-mono px-3 py-2 rounded-md bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]"
            />
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            {endpoint.auth === 'Bearer JWT'
              ? 'Automatically prefilled from your active session if logged in.'
              : endpoint.auth === 'X-CONNECTION-KEY'
              ? 'Enter your BotFusion connection key (acct_...).'
              : 'Pass the appropriate authorization header key.'}
          </p>
        </div>
      )}

      {/* Path / Query Parameters Input */}
      {(Object.keys(pathParams).length > 0 || Object.keys(queryParams).length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.keys(pathParams).map((paramName) => (
            <div key={paramName} className="bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-color)] space-y-1">
              <label className="text-xs font-mono font-semibold text-[var(--text-primary)]">
                Path: <span className="text-[var(--primary-color)]">{paramName}</span>
              </label>
              <input
                type="text"
                value={pathParams[paramName]}
                onChange={(e) => setPathParams({ ...pathParams, [paramName]: e.target.value })}
                className="w-full text-xs font-mono px-2.5 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]"
              />
            </div>
          ))}

          {Object.keys(queryParams).map((paramName) => (
            <div key={paramName} className="bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-color)] space-y-1">
              <label className="text-xs font-mono font-semibold text-[var(--text-primary)]">
                Query: <span className="text-blue-400">{paramName}</span>
              </label>
              <input
                type="text"
                value={queryParams[paramName]}
                onChange={(e) => setQueryParams({ ...queryParams, [paramName]: e.target.value })}
                className="w-full text-xs font-mono px-2.5 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]"
              />
            </div>
          ))}
        </div>
      )}

      {/* Request Body Editor */}
      {endpoint.method !== 'GET' && endpoint.method !== 'HEAD' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Request Body (JSON)</label>
            {bodyJsonError ? (
              <span className="text-[11px] font-mono text-red-400 flex items-center gap-1">
                <AlertCircle size={12} /> Invalid JSON: {bodyJsonError}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> Valid JSON
              </span>
            )}
          </div>
          <textarea
            rows={5}
            value={bodyText}
            onChange={handleBodyChange}
            placeholder='{"key": "value"}'
            className="w-full text-xs font-mono p-3 rounded-lg bg-[#09090b] border border-[var(--border-color)] text-gray-200 focus:outline-none focus:border-[var(--primary-color)] resize-y"
          />
        </div>
      )}

      {/* Live Response Panel */}
      {(responseStatus !== null || errorMessage || isLoading) && (
        <div className="rounded-lg border border-[var(--border-color)] bg-[#09090b] p-3 space-y-2">
          <div className="flex items-center justify-between text-xs border-b border-[#27272a] pb-2">
            <span className="font-semibold text-gray-300">Live Response</span>
            <div className="flex items-center gap-3">
              {responseTime !== null && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                  <Clock size={12} /> {responseTime}ms
                </span>
              )}
              {responseStatus !== null && (
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    responseStatus >= 200 && responseStatus < 300
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  Status: {responseStatus}
                </span>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
              <Loader2 className="animate-spin text-[var(--primary-color)]" size={20} />
              <span className="text-xs">Dispatching HTTP request to {baseUrl}...</span>
            </div>
          ) : errorMessage ? (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded text-red-400 text-xs font-mono">
              {errorMessage}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-64 text-xs font-mono text-emerald-400/95 leading-relaxed">
              <pre className="whitespace-pre">{responseData || 'Empty response'}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
