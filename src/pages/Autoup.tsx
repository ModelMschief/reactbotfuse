import { useState, useEffect } from "react";
import { Key, RefreshCw, AlertTriangle, Terminal, ArrowLeft, Copy, Check, ChevronDown, ChevronUp, Bot, ShieldAlert, QrCode, Link2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

// Use environment variable or fallback for API documentation
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://botfusion.onrender.com";

export default function Autoup() {
    const [connectionKey, setConnectionKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showAutoUpDetails, setShowAutoUpDetails] = useState(false);
    const [showAnomalyDetails, setShowAnomalyDetails] = useState(false);
    const [showQrDetails, setShowQrDetails] = useState(false);
    const [showTrackingDetails, setShowTrackingDetails] = useState(false);

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
                <Link to="/dashboard" className="text-[var(--text-muted)] hover:text-white flex items-center gap-2 mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold flex items-center gap-3 text-cyan-400">
                    <Key size={32} /> API Integrations
                </h1>
                <p className="text-[var(--text-muted)] mt-2 text-lg">
                    Manage your connection key for AutoUp user syncing and Automated Account Detection.
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
                                <AlertTriangle size={12} className="inline mr-1 text-yellow-500" /> This is a secret key. Keep it safe.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* AutoUp Section */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)]">
                <div
                    className="flex justify-between items-center cursor-pointer group"
                    onClick={() => setShowAutoUpDetails(!showAutoUpDetails)}
                >
                    <div className="flex items-center gap-3">
                        <Bot className="text-cyan-400" size={24} />
                        <div>
                            <h2 className="text-xl font-bold group-hover:text-cyan-400 transition-colors">AutoUp Integration API</h2>
                            <p className="text-sm text-[var(--text-muted)] font-normal mt-1">
                                Instantly sync new Telegram users to your bot audience dynamically. No manual CSV uploads needed.
                            </p>
                        </div>
                    </div>
                    <button className="p-2 rounded-full hover:bg-[var(--bg-app)] text-[var(--text-muted)]">
                        {showAutoUpDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>

                <AnimatePresence>
                    {showAutoUpDetails && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-8 space-y-6">
                                <h3 className="font-bold text-sm text-[var(--text-secondary)]">How It Works</h3>
                                <ol className="space-y-3 text-sm text-[var(--text-muted)] list-decimal list-inside marker:text-cyan-500 mb-6 bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)]">
                                    <li>A user sends <code className="bg-[#020617] px-1 py-0.5 rounded text-cyan-400">/start</code> to your Telegram bot.</li>
                                    <li>Your bot sends the user ID to the AutoUp API.</li>
                                    <li>Backend verifying ownership using your Connection Key.</li>
                                    <li>User ID is stored under the correct bot automatically.</li>
                                    <li>Broadcast system detects the new user instantly.</li>
                                </ol>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold">POST</span>
                                        <code className="bg-[var(--bg-app)] px-3 py-1 rounded text-sm flex-1">{API_BASE_URL}/autoup</code>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-2">
                                        Uses the exact same <b>X-CONNECTION-KEY</b> header.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Headers</h3>
                                        <pre className="bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)] text-xs font-mono text-[var(--primary-color)] overflow-x-auto h-[250px]">
                                            {`X-CONNECTION-KEY: \n${connectionKey || 'YOUR_KEY'}
Content-Type: application/json`}
                                        </pre>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Body</h3>
                                        <pre className="bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)] text-xs font-mono text-[var(--primary-color)] overflow-x-auto h-[250px]">
                                            {`{
  "bot_username": "@yourbot",
  "user_id": 123456789
}`}
                                        </pre>
                                    </div>
                                </div>

                                <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                                    <Terminal size={16} className="text-cyan-400" />
                                    AutoUp Example (Python)
                                </h3>
                                <pre className="bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)] text-xs font-mono text-[var(--text-secondary)] overflow-x-auto h-[250px]">
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

                                <div className="pt-4 border-t border-[var(--border-color)] mt-4">
                                    <a
                                        href="/docs.html#api-autoup"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold flex items-center gap-1 transition-colors"
                                    >
                                        View AutoUp Documentation
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Automated Account Detection API Section */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)]">
                <div
                    className="flex justify-between items-center cursor-pointer group"
                    onClick={() => setShowAnomalyDetails(!showAnomalyDetails)}
                >
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="text-purple-400" size={24} />
                        <div>
                            <h2 className="text-xl font-bold group-hover:text-purple-400 transition-colors">Automated Account Detection API</h2>
                            <p className="text-sm text-[var(--text-muted)] font-normal mt-1">
                                Real-time behavioral risk scoring. Protect your bot from userbots and automated spam directly via API.
                            </p>
                        </div>
                    </div>
                    <button className="p-2 rounded-full hover:bg-[var(--bg-app)] text-[var(--text-muted)]">
                        {showAnomalyDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>

                <AnimatePresence>
                    {showAnomalyDetails && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-8 space-y-6">
                                <p className="text-[var(--text-muted)]">
                                    Feed user activity logs into our machine learning model to receive a real-time behavioral risk score. Ideal for moderation bots handling thousands of users.
                                </p>

                                <div className="bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)]">
                                    <h3 className="font-bold mb-3 text-sm text-[var(--text-secondary)]">Integration Strategy</h3>
                                    <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                                        <li><strong className="text-purple-400">1. Event Collection:</strong> Log user activity structurally locally (chat_id, timestamp, text, type). You can safely anonymize text based on your privacy rules.</li>
                                        <li><strong className="text-purple-400">2. API Triggers:</strong> Do not call the API on every single message to respect rate limits. Call it at specific checkpoints (e.g., 20th, 100th message).</li>
                                        <li><strong className="text-purple-400">3. History Limit:</strong> Pass a brief history of the most recent ~300 events per user to prevent memory bloat.</li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold">POST</span>
                                        <code className="bg-[var(--bg-app)] px-3 py-1 rounded text-sm flex-1">{API_BASE_URL}/score_user</code>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-2">
                                        Uses the exact same <b>X-CONNECTION-KEY</b> header as AutoUp above.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Request Body</h3>
                                        <pre className="bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)] text-xs font-mono text-purple-400 overflow-x-auto h-[250px]">
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
                                        <pre className="bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)] text-xs font-mono text-green-400 overflow-x-auto h-[250px]">
                                            {`{
  "user_id": 4021189931,
  "anomaly_score": 0.67,
  "risk_level": "HIGH",
  "confidence_band": "top_5_percent"
}`}
                                        </pre>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[var(--border-color)] mt-4">
                                    <a
                                        href="/docs.html#api-anomaly"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-400 hover:text-purple-300 text-sm font-semibold flex items-center gap-1 transition-colors"
                                    >
                                        View Full Documentation
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* QR Code Generation API Section */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)]">
                <div
                    className="flex justify-between items-center cursor-pointer group"
                    onClick={() => setShowQrDetails(!showQrDetails)}
                >
                    <div className="flex items-center gap-3">
                        <QrCode className="text-orange-400" size={24} />
                        <div>
                            <h2 className="text-xl font-bold group-hover:text-orange-400 transition-colors">QR Code Generation API</h2>
                            <p className="text-sm text-[var(--text-muted)] font-normal mt-1">
                                Generate high-performance, stylized QR codes with deep customization and logo integration via API.
                            </p>
                        </div>
                    </div>
                    <button className="p-2 rounded-full hover:bg-[var(--bg-app)] text-[var(--text-muted)]">
                        {showQrDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>

                <AnimatePresence>
                    {showQrDetails && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-8 space-y-6">
                                <p className="text-[var(--text-muted)]">
                                    Embed Telegram links, profiles, or custom data into generated QRs. Supports extensive customization including gradients, custom finder shapes, and central logo embedding.
                                </p>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold">POST</span>
                                        <code className="bg-[var(--bg-app)] px-3 py-1 rounded text-sm flex-1">{API_BASE_URL}/genqr</code>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-2">
                                        Uses the exact same <b>X-CONNECTION-KEY</b> header as other APIs. Rate limit: 20 req/sec.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Headers</h3>
                                        <pre className="bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)] text-xs font-mono text-orange-400 overflow-x-auto h-[250px]">
                                            {`X-CONNECTION-KEY: \n${connectionKey || 'YOUR_KEY'}
Content-Type: application/json`}
                                        </pre>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Body (Example Scenario A)</h3>
                                        <pre className="bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)] text-xs font-mono text-orange-400 overflow-x-auto h-[250px]">
                                            {`{
  "data": "https://botfusion.wuaze.com",
  "telegram_url": "https://api.telegram.org/file/bot789/photos/file_1.jpg",
  "dot_style": "rounded",
  "gradient": true
}`}
                                        </pre>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[var(--border-color)] mt-4">
                                    <a
                                        href="/docs.html#api-genqr"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-orange-400 hover:text-orange-300 text-sm font-semibold flex items-center gap-1 transition-colors"
                                    >
                                        View Full Documentation
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* URL Tracking API Section */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)]">
                <div
                    className="flex justify-between items-center cursor-pointer group"
                    onClick={() => setShowTrackingDetails(!showTrackingDetails)}
                >
                    <div className="flex items-center gap-3">
                        <Link2 className="text-pink-400" size={24} />
                        <div>
                            <h2 className="text-xl font-bold group-hover:text-pink-400 transition-colors">URL Tracking API</h2>
                            <p className="text-sm text-[var(--text-muted)] font-normal mt-1">
                                Generate smart, trackable short links that notify your bot's user (who created the track link) via Your Bot when someone clicked on it.
                            </p>
                        </div>
                    </div>
                    <button className="p-2 rounded-full hover:bg-[var(--bg-app)] text-[var(--text-muted)]">
                        {showTrackingDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>

                <AnimatePresence>
                    {showTrackingDetails && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-8 space-y-6">
                                <p className="text-[var(--text-muted)]">
                                    The <code>/gen_link</code> endpoint allows developers to generate trackable short links dynamically. When someone clicked on the generated link, BotFusion automatically alerts the owner of original url via Your Telegram Bot .
                                </p>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold">POST</span>
                                        <code className="bg-[var(--bg-app)] px-3 py-1 rounded text-sm flex-1">{API_BASE_URL}/gen_link</code>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-2">
                                        Uses the exact same <b>X-CONNECTION-KEY</b> header. Rate limit: 20 req/sec.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Headers</h3>
                                        <pre className="bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)] text-xs font-mono text-pink-400 overflow-x-auto h-[250px]">
                                            {`X-CONNECTION-KEY: \n${connectionKey || 'YOUR_KEY'}
Content-Type: application/json`}
                                        </pre>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm mb-2 text-[var(--text-muted)]">Request Body</h3>
                                        <pre className="bg-[var(--bg-app)] p-4 rounded-lg border border-[var(--border-color)] text-xs font-mono text-pink-400 overflow-x-auto h-[250px]">
                                            {`{
  "link": "https://example.com",
  "user_id": "123456789",
  "username": "@MyAwesomeBot"
}`}
                                        </pre>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[var(--border-color)] mt-4">
                                    <a
                                        href="/docs.html#api-tracking"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-pink-400 hover:text-pink-300 text-sm font-semibold flex items-center gap-1 transition-colors"
                                    >
                                        View Full Documentation
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="text-center py-10 mt-12 mb-4">
                <p className="text-[var(--text-secondary)] font-medium text-lg">Built by developers, for developers.</p>
                <p className="text-[var(--text-muted)] text-sm mt-2">Integrate seamlessly and scale your Telegram presence securely with BotFusion APIs.</p>
            </div>

        </div>
    )
}
