"use client";

import { useState, useEffect } from "react";
import { Key, RefreshCw, AlertTriangle, Terminal, ArrowLeft, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import Link from "next/link";

// Use environment variable or fallback for API documentation
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://botfusion.onrender.com";

export default function AutoUpPage() {
    const [connectionKey, setConnectionKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadKey();
    }, []);

    const loadKey = async () => {
        try {
            const res = await api.get("/integration-info");
            if (res.data.connection_key) {
                setConnectionKey(res.data.connection_key);
            }
        } catch (err) {
            console.error("Failed to load key", err);
        } finally {
            setLoading(false);
        }
    };

    const generateKey = async () => {
        if (connectionKey && !confirm("This will revoke your old key. All bots using the old key will stop updating until you update them. Continue?")) {
            return;
        }

        setGenerating(true);
        try {
            const res = await api.post("/generate-connection-key", {});
            setConnectionKey(res.data.connection_key);
        } catch (err) {
            alert("Failed to generate key");
        } finally {
            setGenerating(false);
        }
    };

    const copyKey = () => {
        if (connectionKey) {
            navigator.clipboard.writeText(connectionKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    return (
        <div className="container max-w-4xl py-12 space-y-12">

            {/* Header */}
            <div>
                <Link href="/dashboard" className="text-[var(--text-muted)] hover:text-white flex items-center gap-2 mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold flex items-center gap-3 text-cyan-400">
                    <Key size={32} /> AutoUp Bot Integration
                </h1>
                <p className="text-[var(--text-muted)] mt-2 text-lg">
                    Automatically sync new Telegram users to your bot audience without manual uploads.
                </p>
            </div>

            {/* Key Management */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)]">
                <h2 className="text-xl font-bold mb-2">Connection Key</h2>
                <p className="text-[var(--text-muted)] mb-6">
                    This key identifies <b>your account</b>. Your bot application sends it when calling the AutoUp endpoint.
                </p>

                {!connectionKey && !loading && (
                    <button
                        onClick={generateKey}
                        disabled={generating}
                        className="btn bg-cyan-500 hover:bg-cyan-600 text-black font-bold flex items-center gap-2"
                    >
                        <RefreshCw size={18} className={generating ? "animate-spin" : ""} />
                        Generate Connection Key
                    </button>
                )}

                {connectionKey && (
                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="p-4 bg-[#020617] border border-dashed border-cyan-500 rounded-lg font-mono text-lg text-cyan-400 break-all pr-12">
                                {connectionKey}
                            </div>
                            <button
                                onClick={copyKey}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[var(--text-muted)] hover:text-white bg-[#020617]/50 rounded-md"
                            >
                                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                            </button>
                        </div>

                        <div className="flex gap-4 items-center">
                            <button
                                onClick={generateKey}
                                disabled={generating}
                                className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 font-semibold"
                            >
                                <RefreshCw size={14} className={generating ? "animate-spin" : ""} /> Revoke & Generate New
                            </button>
                            <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-app)] px-2 py-1 rounded">
                                <AlertTriangle size={12} className="inline mr-1 text-yellow-500" /> Not a secret key. Used for mapping only.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* How It Works */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)]">
                <h2 className="text-xl font-bold mb-4">How AutoUp Works</h2>
                <ol className="space-y-3 text-[var(--text-muted)] list-decimal list-inside marker:text-cyan-500">
                    <li>A user sends <code className="bg-[#020617] px-1 py-0.5 rounded text-cyan-400">/start</code> to your Telegram bot.</li>
                    <li>Your bot sends the user ID to the AutoUp API.</li>
                    <li>Backend verifying ownership using your Connection Key.</li>
                    <li>User ID is stored under the correct bot automatically.</li>
                    <li>Broadcast system detects the new user instantly.</li>
                </ol>
            </div>

            {/* API Spec */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)] space-y-6">
                <h2 className="text-xl font-bold">API Usage</h2>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold">POST</span>
                        <code className="bg-[var(--bg-app)] px-3 py-1 rounded text-sm flex-1">{API_BASE_URL}/autoup</code>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Headers</h3>
                        <pre className="bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)] text-xs font-mono text-[var(--primary-color)] overflow-x-auto">
                            {`X-CONNECTION-KEY: ${connectionKey || 'YOUR_KEY'}
Content-Type: application/json`}
                        </pre>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Body</h3>
                        <pre className="bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)] text-xs font-mono text-[var(--primary-color)] overflow-x-auto">
                            {`{
  "bot_username": "@yourbot",
  "user_id": 123456789
}`}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Code Example */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)]">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Terminal size={20} className="text-cyan-400" />
                    Example (Python)
                </h2>

                <pre className="bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)] text-sm font-mono text-[var(--text-secondary)] overflow-x-auto">
                    {`import requests

def update_user(user_id, bot_username):
    requests.post(
        "${API_BASE_URL}/autoup",
        headers={
            "X-CONNECTION-KEY": "${connectionKey || 'YOUR_KEY'}"
        },
        json={
            "bot_username": bot_username,
            "user_id": user_id
        }
    )

# Call 'update_user' inside your /start command handler`}
                </pre>
            </div>

        </div>
    )
}
