import { useState, useEffect } from "react";
import { Key, RefreshCw, AlertTriangle, Terminal, ArrowLeft, Copy, Check, Bot, ShieldAlert, QrCode, Link2, MessageSquareWarning, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

// Use environment variable or fallback for API documentation
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://botfusion.onrender.com";

export default function Dashboard() {
    const [connectionKey, setConnectionKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeApi, setActiveApi] = useState<'autoup' | 'anomaly' | 'qr' | 'tracking' | 'profanity' | null>(null);

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

    const ConnectionKeySnippet = () => (
        <div className="card bg-[var(--bg-surface)] border-[var(--border-color)] mb-8">
            <h2 className="text-xl font-bold mb-2">Your Connection Key</h2>
            <p className="text-[var(--text-muted)] mb-6 text-sm">
                This key authenticates your requests. It must be included in the header of every API call.
            </p>

            {!connectionKey && !loading && (
                <button
                    onClick={generateKey}
                    disabled={generating}
                    className="btn btn-primary text-sm font-bold flex items-center gap-2"
                >
                    <RefreshCw size={16} className={generating ? "animate-spin" : ""} />
                    Generate Key
                </button>
            )}

            {connectionKey && (
                <div className="space-y-4">
                    <div className="relative group">
                        <div className="p-4 bg-[#020617] border border-dashed border-gray-600 rounded-lg font-mono text-base text-gray-300 break-all pr-12">
                            {connectionKey}
                        </div>
                        <button
                            onClick={copyKey}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white bg-[#020617]/50 rounded-md transition-colors"
                        >
                            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        </button>
                    </div>

                    <div className="flex gap-4 items-center">
                        <button
                            onClick={generateKey}
                            disabled={generating}
                            className="text-red-500 hover:text-red-400 text-xs flex items-center gap-1 font-semibold transition-colors"
                        >
                            <RefreshCw size={12} className={generating ? "animate-spin" : ""} /> Revoke & Generate New
                        </button>
                        <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-app)] px-2 py-1 rounded">
                            <AlertTriangle size={12} className="inline mr-1 text-yellow-500" /> Keep this secret.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    const apis = [
        {
            id: 'autoup',
            title: 'AutoUp Integration API',
            desc: 'Instantly sync new Telegram users to your bot audience dynamically. No manual CSV uploads needed.',
            icon: Bot,
            color: 'text-cyan-500',
        },
        {
            id: 'anomaly',
            title: 'Automated Account Detection API',
            desc: 'Real-time behavioral risk scoring. Protect your bot from userbots and automated spam directly via API.',
            icon: ShieldAlert,
            color: 'text-purple-500',
        },
        {
            id: 'qr',
            title: 'QR Code Generation API',
            desc: 'Generate high-performance, stylized QR codes with deep customization and logo integration.',
            icon: QrCode,
            color: 'text-orange-500',
        },
        {
            id: 'tracking',
            title: 'URL Tracking API',
            desc: 'Generate, monitor, and manage tracked short links programmatically for your Telegram bots.',
            icon: Link2,
            color: 'text-pink-500',
        },
        {
            id: 'profanity',
            title: 'Profanity Filter API',
            desc: 'Detect blocked content and profanity in user messages using a fast, centralized filtering model.',
            icon: MessageSquareWarning,
            color: 'text-red-500',
        }
    ];

    return (
        <div className="container max-w-5xl py-12 space-y-12">

            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
                    <Key size={32} className="text-[var(--primary-color)]" /> API Integrations
                </h1>
                <p className="text-[var(--text-muted)] text-lg max-w-2xl">
                    Discover and integrate our enterprise APIs into your bot infrastructure.
                </p>
            </div>

            <AnimatePresence mode="wait">
                {!activeApi ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Global Key Management (When Grid is shown) */}
                        <ConnectionKeySnippet />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {apis.map((apiItem) => {
                                const Icon = apiItem.icon;
                                return (
                                    <div key={apiItem.id} className="card bg-[var(--bg-surface)] border-[var(--border-color)] flex flex-col hover:border-gray-400 dark:hover:border-gray-500 transition-all cursor-pointer" onClick={() => setActiveApi(apiItem.id as any)}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg">
                                                <Icon size={24} className={apiItem.color} />
                                            </div>
                                            <h3 className="text-xl font-bold text-[var(--text-primary)]">{apiItem.title}</h3>
                                        </div>
                                        <p className="text-[var(--text-muted)] text-sm mb-6 flex-1">
                                            {apiItem.desc}
                                        </p>
                                        <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                                            <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-app)] px-2 py-1 rounded">REST API</span>
                                            <button 
                                                className="text-sm font-semibold text-[var(--primary-color)] hover:text-[var(--primary-hover)] transition-colors flex items-center gap-1"
                                                onClick={(e) => { e.stopPropagation(); setActiveApi(apiItem.id as any); }}
                                            >
                                                Get API <ArrowLeft size={14} className="rotate-180" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                    >
                        <button
                            onClick={() => setActiveApi(null)}
                            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-medium mb-4"
                        >
                            <ArrowLeft size={18} /> Back to APIs
                        </button>

                        <ConnectionKeySnippet />

                        <div className="card bg-[var(--bg-surface)] border-[var(--border-color)]">
                            {/* Detailed Views */}
                            {activeApi === 'autoup' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-6">
                                        <div className="p-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg">
                                            <Bot size={32} className="text-cyan-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-[var(--text-primary)]">AutoUp Integration API</h2>
                                            <p className="text-sm text-[var(--text-muted)] mt-1">Instantly sync new Telegram users to your bot audience.</p>
                                            <a href="/docs.html#api-autoup" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--primary-color)] hover:underline flex items-center gap-1 mt-2 w-fit">
                                                Read full documentation <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-bold text-sm text-[var(--text-secondary)]">How It Works</h3>
                                    <ol className="space-y-3 text-sm text-[var(--text-muted)] list-decimal list-inside marker:text-cyan-500 mb-6 bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)]">
                                        <li>A user sends <code className="bg-[#020617] px-1 py-0.5 rounded text-cyan-400">/start</code> to your Telegram bot.</li>
                                        <li>Your bot sends the user ID to the AutoUp API.</li>
                                        <li>Backend verifies ownership using your Connection Key.</li>
                                        <li>User ID is stored under the correct bot automatically.</li>
                                        <li>Broadcast system detects the new user instantly.</li>
                                    </ol>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-green-500/10 text-green-600 px-2 py-1 rounded text-xs font-bold">POST</span>
                                            <code className="bg-[var(--bg-app)] border border-[var(--border-color)] px-3 py-1 rounded text-sm flex-1 font-mono">{API_BASE_URL}/autoup</code>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Headers</h3>
                                            <pre className="bg-[#020617] p-4 rounded-lg border border-gray-800 text-xs font-mono text-cyan-400 overflow-x-auto h-[250px]">
                                                {`X-CONNECTION-KEY: \n${connectionKey || 'YOUR_KEY'}
Content-Type: application/json`}
                                            </pre>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Body</h3>
                                            <pre className="bg-[#020617] p-4 rounded-lg border border-gray-800 text-xs font-mono text-cyan-400 overflow-x-auto h-[250px]">
                                                {`{
  "bot_username": "@yourbot",
  "user_id": 123456789
}`}
                                            </pre>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-[var(--text-primary)]">
                                        <Terminal size={16} className="text-cyan-500" />
                                        AutoUp Example (Python)
                                    </h3>
                                    <pre className="bg-[#020617] p-4 rounded-lg border border-gray-800 text-xs font-mono text-gray-300 overflow-x-auto">
                                        {`import requests

def update_user(user_id, bot_username):
    response = requests.post(
        "${API_BASE_URL}/autoup",
        headers={
            "X-CONNECTION-KEY": "${connectionKey || 'YOUR_KEY'}",
            "Content-Type": "application/json"
        },
        json={
            "bot_username": bot_username,
            "user_id": user_id
        }
    )
    return response.json()
# Call 'update_user' inside /start handler`}
                                    </pre>
                                </div>
                            )}

                            {activeApi === 'anomaly' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-6">
                                        <div className="p-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg">
                                            <ShieldAlert size={32} className="text-purple-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Automated Account Detection API</h2>
                                            <p className="text-sm text-[var(--text-muted)] mt-1">Real-time behavioral risk scoring.</p>
                                            <a href="/docs.html#api-anomaly" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--primary-color)] hover:underline flex items-center gap-1 mt-2 w-fit">
                                                Read full documentation <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    </div>

                                    <p className="text-[var(--text-muted)] text-sm">
                                        Feed user activity logs into our machine learning model to receive a real-time behavioral risk score. Ideal for moderation bots handling thousands of users.
                                    </p>

                                    <div className="bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)]">
                                        <h3 className="font-bold mb-3 text-sm text-[var(--text-secondary)]">Integration Strategy</h3>
                                        <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                                            <li><strong className="text-purple-500">1. Event Collection:</strong> Log user activity structurally locally (chat_id, timestamp, text, type). You can safely anonymize text.</li>
                                            <li><strong className="text-purple-500">2. API Triggers:</strong> Do not call the API on every single message to respect rate limits. Call it at specific checkpoints.</li>
                                            <li><strong className="text-purple-500">3. History Limit:</strong> Pass a brief history of the most recent ~300 events per user to prevent memory bloat.</li>
                                        </ul>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-green-500/10 text-green-600 px-2 py-1 rounded text-xs font-bold">POST</span>
                                            <code className="bg-[var(--bg-app)] border border-[var(--border-color)] px-3 py-1 rounded text-sm flex-1 font-mono">{API_BASE_URL}/score_user</code>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                        <div>
                                            <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Request Body</h3>
                                            <pre className="bg-[#020617] p-4 rounded-lg border border-gray-800 text-xs font-mono text-purple-400 overflow-x-auto h-[250px]">
                                                {`{
  "user_id": 4021189931,
  "events": [
    {
      "chat_id": -100123456,
      "timestamp": 1769401000,
      "text": "Hello",
      "type": "text"
    }
    // ... recent events (max ~300)
  ]
}`}
                                            </pre>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Response</h3>
                                            <pre className="bg-[#020617] p-4 rounded-lg border border-gray-800 text-xs font-mono text-green-400 overflow-x-auto h-[250px]">
                                                {`{
  "user_id": 4021189931,
  "anomaly_score": 0.67,
  "risk_level": "HIGH",
  "confidence_band": "top_5_percent"
}`}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeApi === 'qr' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-6">
                                        <div className="p-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg">
                                            <QrCode size={32} className="text-orange-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-[var(--text-primary)]">QR Code Generation API</h2>
                                            <p className="text-sm text-[var(--text-muted)] mt-1">High-performance, stylized QR codes.</p>
                                            <a href="/docs.html#api-genqr" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--primary-color)] hover:underline flex items-center gap-1 mt-2 w-fit">
                                                Read full documentation <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    </div>

                                    <p className="text-[var(--text-muted)] text-sm">
                                        Embed Telegram links, profiles, or custom data into generated QRs. Supports extensive customization including gradients, custom finder shapes, and central logo embedding.
                                    </p>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-green-500/10 text-green-600 px-2 py-1 rounded text-xs font-bold">POST</span>
                                            <code className="bg-[var(--bg-app)] border border-[var(--border-color)] px-3 py-1 rounded text-sm flex-1 font-mono">{API_BASE_URL}/genqr</code>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)] mt-2">Rate limit: 20 req/sec.</p>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                        <div>
                                            <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Headers</h3>
                                            <pre className="bg-[#020617] p-4 rounded-lg border border-gray-800 text-xs font-mono text-orange-400 overflow-x-auto h-[250px]">
                                                {`X-CONNECTION-KEY: \n${connectionKey || 'YOUR_KEY'}
Content-Type: application/json`}
                                            </pre>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Body (Example)</h3>
                                            <pre className="bg-[#020617] p-4 rounded-lg border border-gray-800 text-xs font-mono text-orange-400 overflow-x-auto h-[250px]">
                                                {`{
  "data": "https://botfusion.wuaze.com",
  "telegram_url": "https://api.telegram.org/file/bot789/photos/file_1.jpg",
  "dot_style": "rounded",
  "gradient": true
}`}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeApi === 'tracking' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-6">
                                        <div className="p-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg">
                                            <Link2 size={32} className="text-pink-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-[var(--text-primary)]">URL Tracking API</h2>
                                            <p className="text-sm text-[var(--text-muted)] mt-1">Generate, monitor, and manage tracked short links.</p>
                                            <a href="/docs.html#api-tracking" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--primary-color)] hover:underline flex items-center gap-1 mt-2 w-fit">
                                                Read full documentation <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    </div>

                                    <p className="text-[var(--text-muted)] text-sm">
                                        The <code>/gen_link</code> endpoint allows URL generation, statistics bulk fetching, and tracking link deletion.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="bg-green-500/10 text-green-600 px-2 py-1 rounded text-xs font-bold w-16 text-center">POST</span>
                                            <span className="bg-blue-500/10 text-blue-600 px-2 py-1 rounded text-xs font-bold w-16 text-center">GET</span>
                                            <span className="bg-red-500/10 text-red-600 px-2 py-1 rounded text-xs font-bold w-16 text-center">DELETE</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="bg-[var(--bg-app)] border border-[var(--border-color)] px-3 py-1 rounded text-sm flex-1 font-mono">{API_BASE_URL}/gen_link</code>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)] mt-2">Rate limit: 20 req/sec.</p>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                        <div>
                                            <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Headers</h3>
                                            <pre className="bg-[#020617] p-4 rounded-lg border border-gray-800 text-xs font-mono text-pink-400 overflow-x-auto h-[250px]">
                                                {`X-CONNECTION-KEY: \n\${connectionKey || 'YOUR_KEY'}
Content-Type: application/json`}
                                            </pre>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Request Body</h3>
                                            <pre className="bg-[#020617] p-4 rounded-lg border border-gray-800 text-xs font-mono text-pink-400 overflow-x-auto h-[250px]">
                                                {`{
  "username": "@MyAwesomeBot",
  "user_id": 123456789,
  "link": "https://example.com/checkout",
  "notify": true 
}`}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeApi === 'profanity' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-6">
                                        <div className="p-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg">
                                            <MessageSquareWarning size={32} className="text-red-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Profanity Filter API</h2>
                                            <p className="text-sm text-[var(--text-muted)] mt-1">Check messages for banned content programmatically.</p>
                                            <a href="/docs.html#api-profanity" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--primary-color)] hover:underline flex items-center gap-1 mt-2 w-fit">
                                                Read full documentation <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    </div>

                                    <p className="text-[var(--text-muted)] text-sm">
                                        Checks if a given string contains any banned words or phrases using a centralized filter. Keep your bot communities clean and safe.
                                    </p>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-green-500/10 text-green-600 px-2 py-1 rounded text-xs font-bold">POST</span>
                                            <code className="bg-[var(--bg-app)] border border-[var(--border-color)] px-3 py-1 rounded text-sm flex-1 font-mono">{API_BASE_URL}/profanity_check</code>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)] mt-2">Rate limit: 20 req/sec.</p>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                        <div>
                                            <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Request</h3>
                                            <pre className="bg-[#020617] p-4 rounded-lg border border-gray-800 text-xs font-mono text-red-400 overflow-x-auto h-[250px]">
                                                {`POST /profanity_check
                                                
Headers:
X-CONNECTION-KEY: \n\${connectionKey || 'YOUR_KEY'}
Content-Type: application/json

Body:
{
  "message": "The string of text to check."
}`}
                                            </pre>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Response</h3>
                                            <pre className="bg-[#020617] p-4 rounded-lg border border-gray-800 text-xs font-mono text-green-400 overflow-x-auto h-[250px]">
                                                {`{
  "profanity": true,
  "message": "Message contains blocked content."
}

// Or if clean:
{
  "profanity": false,
  "message": "Message is clean!"
}`}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <div className="text-center py-10 mt-12 mb-4 border-t border-[var(--border-color)]">
                <p className="text-[var(--text-secondary)] font-medium text-lg">Built by developers, for developers.</p>
                <p className="text-[var(--text-muted)] text-sm mt-2">Integrate seamlessly and scale your Telegram presence securely with BotFusion APIs.</p>
            </div>

        </div>
    )
}
