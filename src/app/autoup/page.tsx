"use client";

import { useState } from "react";
import { MOCK_KEYS, KeyData } from "@/lib/mock-data";
import { Key, RefreshCw, Trash2, Copy, FileText } from "lucide-react";

export default function AutoUpPage() {
    const [keys, setKeys] = useState<KeyData[]>(MOCK_KEYS);

    const generateKey = () => {
        const newKey: KeyData = {
            id: Math.random().toString(36).substr(2, 9),
            key: `sk_live_${Math.random().toString(36).substr(2, 12)}`,
            createdAt: new Date().toISOString().split('T')[0],
            status: "active",
        };
        setKeys([newKey, ...keys]);
    };

    const revokeKey = (id: string) => {
        setKeys(keys.map(k => k.id === id ? { ...k, status: "revoked" } : k));
    };

    return (
        <div className="container py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Key Management */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Key className="text-[var(--primary-color)]" /> AutoUp Keys
                        </h1>
                        <p className="text-[var(--text-muted)]">Manage connection keys for automated deployments.</p>
                    </div>
                    <button onClick={generateKey} className="btn btn-primary text-sm">
                        <RefreshCw size={16} /> Generate Key
                    </button>
                </div>

                <div className="space-y-3">
                    {keys.map((key) => (
                        <div key={key.id} className="card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="font-mono text-sm bg-[var(--bg-app)] px-3 py-1.5 rounded border border-[var(--border-color)] break-all">
                                {key.key}
                            </div>
                            <div className="flex items-center gap-4 text-sm w-full md:w-auto justify-between">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${key.status === 'active' ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-[var(--text-muted)] border-[var(--border-color)]'}`}>
                                    {key.status.toUpperCase()}
                                </span>
                                <span className="text-[var(--text-muted)] text-xs">{key.createdAt}</span>
                                {key.status === 'active' && (
                                    <button onClick={() => revokeKey(key.id)} className="text-[var(--destructive)] hover:bg-[var(--destructive)]/10 p-2 rounded">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Docs */}
            <div className="space-y-6">
                <div className="card bg-[var(--bg-surface)]/50">
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                        <FileText size={18} /> Documentation
                    </h3>

                    <div className="space-y-4 text-sm">
                        <div>
                            <h4 className="font-semibold text-[var(--primary-color)]">What is AutoUp?</h4>
                            <p className="text-[var(--text-muted)] mt-1">AutoUp allows you to programmatically update your bot instances without downtime using our CLI tool.</p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-[var(--primary-color)]">API Usage</h4>
                            <div className="mt-2 bg-[var(--bg-app)] p-3 rounded-lg border border-[var(--border-color)] font-mono text-xs overflow-x-auto">
                                curl -X POST https://api.firebot.io/v1/update \<br />
                                -H "Authorization: Bearer YOUR_KEY"
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-[var(--primary-color)]">Error Codes</h4>
                            <ul className="mt-1 space-y-1 text-[var(--text-muted)] list-disc list-inside">
                                <li>401: Invalid Key</li>
                                <li>429: Rate Limit Exceeded</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
