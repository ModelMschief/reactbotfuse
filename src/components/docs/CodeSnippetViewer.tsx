import React, { useState } from 'react';
import { DocEndpoint } from '@/types/docs';
import { Check, Copy, Terminal, Code2 } from 'lucide-react';

interface CodeSnippetViewerProps {
  endpoint: DocEndpoint;
  baseUrl?: string;
  customAuthKey?: string;
  customBody?: string;
}

type LangType = 'curl' | 'python' | 'node' | 'javascript';

export const CodeSnippetViewer: React.FC<CodeSnippetViewerProps> = ({
  endpoint,
  baseUrl = 'https://botfusion.onrender.com',
  customAuthKey,
  customBody
}) => {
  const [activeLang, setActiveLang] = useState<LangType>('curl');
  const [copied, setCopied] = useState(false);

  const cleanPath = endpoint.path.replace(/\{(\w+)\}/g, ':$1');
  const fullUrl = `${baseUrl}${cleanPath}`;

  // Generate Snippets
  const getCurlSnippet = (): string => {
    let snippet = `curl -X ${endpoint.method} "${fullUrl}" \\\n`;
    snippet += `  -H "Content-Type: application/json" \\\n`;

    if (endpoint.auth === 'Bearer JWT') {
      snippet += `  -H "Authorization: Bearer ${customAuthKey || 'YOUR_JWT_TOKEN'}" \\\n`;
    } else if (endpoint.auth === 'X-CONNECTION-KEY') {
      snippet += `  -H "X-CONNECTION-KEY: ${customAuthKey || 'acct_eb3789b4a9912a8b'}" \\\n`;
    } else if (endpoint.auth === 'x-api-key') {
      snippet += `  -H "x-api-key: ${customAuthKey || 'bfpay_live_...'}" \\\n`;
    } else if (endpoint.auth === 'X-Webhook-Token') {
      snippet += `  -H "X-Webhook-Token: ${customAuthKey || 'MASTER_BOT_TOKEN'}" \\\n`;
    }

    if (endpoint.method !== 'GET' && endpoint.method !== 'HEAD') {
      const bodyContent = customBody || (endpoint.requestBodyExample ? JSON.stringify(endpoint.requestBodyExample, null, 2) : '{}');
      // Escape single quotes for bash
      const inlineJson = bodyContent.replace(/'/g, `'\\''`);
      snippet += `  -d '${inlineJson}'`;
    } else {
      // Remove trailing slash and newline
      snippet = snippet.replace(/ \\\n$/, '');
    }

    return snippet;
  };

  const getPythonSnippet = (): string => {
    let snippet = `import requests\n\n`;
    snippet += `url = "${fullUrl}"\n`;
    snippet += `headers = {\n`;
    snippet += `    "Content-Type": "application/json",\n`;

    if (endpoint.auth === 'Bearer JWT') {
      snippet += `    "Authorization": "Bearer ${customAuthKey || 'YOUR_JWT_TOKEN'}",\n`;
    } else if (endpoint.auth === 'X-CONNECTION-KEY') {
      snippet += `    "X-CONNECTION-KEY": "${customAuthKey || 'acct_eb3789b4a9912a8b'}",\n`;
    } else if (endpoint.auth === 'x-api-key') {
      snippet += `    "x-api-key": "${customAuthKey || 'bfpay_live_...'}",\n`;
    } else if (endpoint.auth === 'X-Webhook-Token') {
      snippet += `    "X-Webhook-Token": "${customAuthKey || 'MASTER_BOT_TOKEN'}",\n`;
    }
    snippet += `}\n\n`;

    if (endpoint.method !== 'GET' && endpoint.method !== 'HEAD') {
      const bodyContent = customBody || (endpoint.requestBodyExample ? JSON.stringify(endpoint.requestBodyExample, null, 4) : '{}');
      snippet += `payload = ${bodyContent}\n\n`;
      snippet += `response = requests.${endpoint.method.toLowerCase()}(url, json=payload, headers=headers)\n`;
    } else {
      snippet += `response = requests.${endpoint.method.toLowerCase()}(url, headers=headers)\n`;
    }

    snippet += `print("Status:", response.status_code)\n`;
    snippet += `print(response.json())`;
    return snippet;
  };

  const getNodeSnippet = (): string => {
    let snippet = `const axios = require('axios');\n\n`;
    snippet += `const config = {\n`;
    snippet += `  method: '${endpoint.method.toLowerCase()}',\n`;
    snippet += `  url: '${fullUrl}',\n`;
    snippet += `  headers: {\n`;
    snippet += `    'Content-Type': 'application/json',\n`;

    if (endpoint.auth === 'Bearer JWT') {
      snippet += `    'Authorization': 'Bearer ${customAuthKey || 'YOUR_JWT_TOKEN'}',\n`;
    } else if (endpoint.auth === 'X-CONNECTION-KEY') {
      snippet += `    'X-CONNECTION-KEY': '${customAuthKey || 'acct_eb3789b4a9912a8b'}',\n`;
    } else if (endpoint.auth === 'x-api-key') {
      snippet += `    'x-api-key': '${customAuthKey || 'bfpay_live_...'}',\n`;
    } else if (endpoint.auth === 'X-Webhook-Token') {
      snippet += `    'X-Webhook-Token': '${customAuthKey || 'MASTER_BOT_TOKEN'}',\n`;
    }
    snippet += `  },\n`;

    if (endpoint.method !== 'GET' && endpoint.method !== 'HEAD') {
      const bodyContent = customBody || (endpoint.requestBodyExample ? JSON.stringify(endpoint.requestBodyExample, null, 2) : '{}');
      snippet += `  data: ${bodyContent}\n`;
    }
    snippet += `};\n\n`;
    snippet += `axios(config)\n`;
    snippet += `  .then(res => console.log(res.data))\n`;
    snippet += `  .catch(err => console.error(err.response ? err.response.data : err.message));`;
    return snippet;
  };

  const getJsFetchSnippet = (): string => {
    let snippet = `const response = await fetch('${fullUrl}', {\n`;
    snippet += `  method: '${endpoint.method}',\n`;
    snippet += `  headers: {\n`;
    snippet += `    'Content-Type': 'application/json',\n`;

    if (endpoint.auth === 'Bearer JWT') {
      snippet += `    'Authorization': 'Bearer ${customAuthKey || 'YOUR_JWT_TOKEN'}',\n`;
    } else if (endpoint.auth === 'X-CONNECTION-KEY') {
      snippet += `    'X-CONNECTION-KEY': '${customAuthKey || 'acct_eb3789b4a9912a8b'}',\n`;
    } else if (endpoint.auth === 'x-api-key') {
      snippet += `    'x-api-key': '${customAuthKey || 'bfpay_live_...'}',\n`;
    } else if (endpoint.auth === 'X-Webhook-Token') {
      snippet += `    'X-Webhook-Token': '${customAuthKey || 'MASTER_BOT_TOKEN'}',\n`;
    }
    snippet += `  },\n`;

    if (endpoint.method !== 'GET' && endpoint.method !== 'HEAD') {
      const bodyContent = customBody || (endpoint.requestBodyExample ? JSON.stringify(endpoint.requestBodyExample, null, 2) : '{}');
      snippet += `  body: JSON.stringify(${bodyContent})\n`;
    }
    snippet += `});\n\n`;
    snippet += `const data = await response.json();\n`;
    snippet += `console.log(data);`;
    return snippet;
  };

  const getSnippet = (): string => {
    switch (activeLang) {
      case 'curl':
        return getCurlSnippet();
      case 'python':
        return getPythonSnippet();
      case 'node':
        return getNodeSnippet();
      case 'javascript':
        return getJsFetchSnippet();
      default:
        return getCurlSnippet();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[#09090b] overflow-hidden shadow-lg">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#27272a] bg-[#121215]">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-gray-400 mr-2">
            <Terminal size={14} className="text-[var(--primary-color)]" />
            <span>Example Request</span>
          </div>
          {(['curl', 'python', 'node', 'javascript'] as LangType[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveLang(lang)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                activeLang === lang
                  ? 'bg-[var(--primary-color)] text-white font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f1f23]'
              }`}
            >
              {lang === 'curl' ? 'cURL' : lang === 'python' ? 'Python' : lang === 'node' ? 'Node.js' : 'JavaScript'}
            </button>
          ))}
        </div>

        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-gray-300 hover:text-white bg-[#1f1f23] hover:bg-[#27272a] transition-all border border-[#27272a]"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Snippet Code Viewer */}
      <div className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-gray-200 max-h-72">
        <pre className="whitespace-pre">
          <code>{getSnippet()}</code>
        </pre>
      </div>
    </div>
  );
};
