import { Link } from "react-router-dom";
import { useAuth } from "@/store/auth-context";
import { motion } from "framer-motion";
import { Shield, Zap, Activity, Server, Lock, Layers, ExternalLink, Coins } from "lucide-react";
import { ParticleBackground } from "@/components/particle-background";

// Import logo image
import appleTouchIcon from "/apple-touch-icon.png";

export default function Home() {
    const { user } = useAuth();
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-sans overflow-x-hidden">

            {/* Hero Section */}
            <section className="relative pt-20 pb-24 md:pt-32 md:pb-32 overflow-hidden">
                {/* Background Glow & Particles */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--primary-color)]/5 rounded-full blur-[120px] pointer-events-none" />
                <ParticleBackground />

                {/* Floating Blurred Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -20, 0] }}
                    transition={{
                        opacity: { duration: 1.5 },
                        scale: { duration: 1.5 },
                        y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-10 pointer-events-none mix-blend-screen"
                >
                    <img
                        src={appleTouchIcon}
                        alt="Background Logo"
                        width={400}
                        height={400}
                        className="blur-[60px]"
                    />
                </motion.div>

                <div className="container relative z-10 px-4 mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left Column: Copy */}
                        <div className="text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-color)]/10 text-[var(--primary-color)] text-xs font-bold uppercase tracking-wider mb-6 border border-[var(--primary-color)]/20"
                            >
                                <Zap size={12} fill="currentColor" /> Bot & Payment API Infrastructure
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] text-[var(--text-primary)]"
                            >
                                Deploy Powerful APIs & <br className="hidden lg:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary-color)] to-orange-500">
                                    Accept Crypto
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="text-base sm:text-lg md:text-xl text-[var(--text-muted)] mb-10 leading-relaxed font-light max-w-xl"
                            >
                                BotFusion is the premier API provider for developers. Build resilient infrastructure with our enterprise-grade endpoints for realtime user syncing, ML-powered spam detection, and an automated, non-custodial crypto payment gateway for BSC and TON.
                            </motion.p>
                        </div>

                        {/* Right Column: Graphic & Buttons */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col gap-8"
                        >
                            {/* Mock Terminal Graphic */}
                            <div className="bg-[#09090b] border border-gray-800 rounded-xl p-4 sm:p-6 font-mono text-xs sm:text-sm relative shadow-xl overflow-x-auto text-left">
                                <div className="flex gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                </div>
                                <div className="space-y-2 break-all sm:break-normal">
                                    <div className="text-gray-400">curl -X POST https://botfusion.onrender.com/autoup \</div>
                                    <div className="text-gray-400 pl-4">-H "X-CONNECTION-KEY: <span className="text-[var(--primary-color)]">secret_key</span>" \</div>
                                    <div className="text-gray-400 pl-4">-d '&#123;"user_id": 123456789, "bot": "@my_bot"&#125;'</div>
                                    <div className="text-green-400 mt-4">&gt; {"{"}"status": "success", "synced": true{"}"}</div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to={user ? "/dashboard" : "/login"} className="btn btn-primary h-12 px-8 text-base font-bold transition-all w-full sm:w-auto shadow-sm hover:shadow-md">
                                    Start Building
                                </Link>
                                <Link to="/docs" className="btn bg-[var(--bg-surface)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] h-12 px-8 text-base transition-all w-full sm:w-auto shadow-sm flex items-center justify-center">
                                    Read Docs <ExternalLink size={16} className="ml-2" />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Trust Strip */}
            <section className="border-y border-[var(--border-color)] bg-[var(--bg-surface)] py-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70">
                        {[
                            { icon: Lock, label: "AES-256 Secured" },
                            { icon: Activity, label: "Rate-Limit Aware" },
                            { icon: Server, label: "99.9% Uptime" },
                            { icon: Coins, label: "Non-Custodial Crypto Gateway" }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 font-medium">
                                <item.icon size={20} className="text-[var(--text-muted)]" />
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 relative">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Infrastructure Grade Features</h2>
                        <p className="text-[var(--text-muted)] max-w-xl mx-auto">Built for power users who demand control and reliability.</p>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(280px,auto)]"
                    >
                        {/* Centralized Hub */}
                        <motion.div variants={itemVariants} className="md:col-span-2 card p-8 group hover:border-[var(--primary-color)]/30 transition-colors">
                            <div className="w-12 h-12 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg flex items-center justify-center mb-6 text-[var(--primary-color)] group-hover:scale-110 transition-transform">
                                <Layers size={24} />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Centralized Management Hub</h3>
                            <p className="text-[var(--text-muted)] leading-relaxed text-lg">
                                Stop managing bots via scattered Python scripts. Connect all your tokens to one unified dashboard.
                                View aggregate user counts, plan status, and health metrics in a single pane of glass.
                            </p>
                        </motion.div>

                        {/* BotFusion Pay API */}
                        <motion.div variants={itemVariants} className="card p-8 group hover:border-[var(--primary-color)]/30 transition-colors">
                            <div className="w-12 h-12 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg flex items-center justify-center mb-6 text-[var(--primary-color)] group-hover:scale-110 transition-transform">
                                <Coins size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Crypto Payment API</h3>
                            <p className="text-[var(--text-muted)] leading-relaxed">
                                Integrate non-custodial BSC & TON payments directly into your apps. Zero middleman fees, automatic gas sweeping.
                            </p>
                        </motion.div>

                        {/* Live Status */}
                        <motion.div variants={itemVariants} className="card p-8 group hover:border-[var(--primary-color)]/30 transition-colors">
                            <div className="w-12 h-12 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg flex items-center justify-center mb-6 text-[var(--primary-color)] group-hover:scale-110 transition-transform">
                                <Activity size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Live Status Streams</h3>
                            <p className="text-[var(--text-muted)] leading-relaxed">
                                Real-time WebSockets feed delivery status. Watch Sent, Failed, and Blocked counts update as they happen.
                            </p>
                        </motion.div>

                        {/* Advanced APIs */}
                        <motion.div variants={itemVariants} className="md:col-span-2 card p-8 group hover:border-[var(--primary-color)]/30 transition-colors">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="flex-1">
                                    <div className="w-12 h-12 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg flex items-center justify-center mb-6 text-[var(--primary-color)] group-hover:scale-110 transition-transform">
                                        <Shield size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3">Enterprise Developer APIs</h3>
                                    <p className="text-[var(--text-muted)] leading-relaxed text-lg mb-4">
                                        Integrate our powerful suite of APIs directly into your bot code. Use <strong>AutoUp</strong> for real-time user syncing, deploy our <strong>Anomaly Detection ML</strong> for automated spam protection, and generate highly-customized, branded QR codes instantly.
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="font-mono text-xs p-2 rounded bg-[var(--primary-color)]/10 text-[var(--primary-color)] border border-[var(--primary-color)]/20">
                                            POST /autoup
                                        </span>
                                        <span className="font-mono text-xs p-2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                            POST /score_user
                                        </span>
                                        <span className="font-mono text-xs p-2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                            POST /invoices
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-[var(--bg-surface)] border-y border-[var(--border-color)]">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-2">Technical Workflow</h2>
                        <p className="text-[var(--text-muted)]">From setup to delivery in four steps.</p>
                    </div>

                    <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-[24px] left-[10%] right-[10%] h-[2px] bg-[var(--border-color)] z-0" />

                        {[
                            { step: "01", title: "Authenticate", desc: "Secure API access via developer keys and JWT tokens." },
                            { step: "02", title: "Integrate Modules", desc: "Plug AutoUp user syncing and ML tracking seamlessly into your app." },
                            { step: "03", title: "Monetize", desc: "Generate secure crypto invoices via POST /invoices and accept Web3 payments." },
                            { step: "04", title: "Scale & Analyze", desc: "Manage millions of users, track real-time analytics, and broadcast via our infrastructure." }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="relative z-10 flex flex-col items-center text-center group"
                            >
                                <div className="w-12 h-12 rounded-full bg-[var(--bg-app)] border border-[var(--border-color)] flex items-center justify-center font-bold font-mono text-lg mb-6 group-hover:border-[var(--primary-color)] group-hover:text-[var(--primary-color)] transition-colors shadow-lg">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed px-4">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Performance / Safety */}
            <section id="safety" className="py-24 overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">Rate-Limit Safe.<br />Flood Control Built-in.</h2>
                            <p className="text-[var(--text-muted)] text-lg mb-8">
                                Telegram enforces strict limits (~30 messages/sec). Naive loops lead to 429 errors and bot bans.
                                We handle the complexity for you.
                            </p>

                            <ul className="space-y-4">
                                {[
                                    "Intelligent exponential backoff on 429s.",
                                    "Parallel worker threads (configurable).",
                                    "Automatic pruning of blocked/deleted users."
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-[var(--text-secondary)]">
                                        <Shield size={20} className="text-green-500 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-[#0d0d0d] border border-[var(--border-color)] rounded-xl p-6 font-mono text-sm relative shadow-2xl"
                        >
                            <div className="flex gap-2 mb-4 opacity-50">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>

                            <div className="space-y-2">
                                <div className="text-[var(--text-muted)]">&gt; Initializing broadcast worker...</div>
                                <div className="text-[var(--text-primary)]">&gt; <span className="text-[var(--primary-color)]">Target:</span> 45,200 users across 12 bots</div>
                                <div className="text-[var(--text-muted)]">&gt; Batch 1 sent. (Latency: 12ms)</div>
                                <div className="text-[var(--text-muted)]">&gt; Batch 2 sent. (Latency: 14ms)</div>
                                <div className="text-yellow-500">&gt; Rate Limit Hit (429). Sleeping 3s...</div>
                                <div className="text-green-500 font-bold">&gt; Resumed. 99.8% Delivery Rate.</div>
                            </div>

                            {/* Decorative Glow */}
                            <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-[var(--primary-color)]/20 to-transparent opacity-20 pointer-events-none rounded-xl" />
                        </motion.div>
                    </div>
                </div>
            </section>
            {/* SEO Content Section */}
            <section className="py-20 border-t border-[var(--border-color)]">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h2 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">
                        Telegram Bot APIs and Automation Platform
                    </h2>

                    <p className="text-[var(--text-muted)] mb-6 leading-relaxed">
                        BotFusion is a Telegram bot developer platform that provides infrastructure,
                        automation tools, and APIs for building and scaling Telegram bots. Developers
                        can manage multiple bots, broadcast messages, synchronize users in real time
                        using the AutoUp API, analyze user behavior using anomaly detection, generate
                        QR codes, track links, and monitor bot analytics from a unified dashboard.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 text-[var(--text-primary)]">
                        Platform Features
                    </h3>

                    <ul className="list-disc pl-6 space-y-2 text-[var(--text-muted)]">
                        <li>Non-Custodial Crypto Payment API (BotFusion Pay)</li>
                        <li>Automated USDT Invoicing on BSC and TON</li>
                        <li>Auto User Sync API (AutoUp)</li>
                        <li>Telegram Broadcast Infrastructure</li>
                        <li>Telegram User Behavior Analysis and Anomaly Detection</li>
                        <li>Multi-Bot Management Dashboard</li>
                        <li>Automation Webhooks and Developer APIs</li>
                    </ul>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[var(--bg-surface)] border-t border-[var(--border-color)] pt-20 pb-8">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-1">
                            <Link to="/" className="font-bold text-xl flex items-center gap-2 mb-4 text-[var(--primary-color)]">
                                BotFusion
                            </Link>
                            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                                The professional standard for Telegram bot automation.
                                Built for developers, by developers.
                            </p>
                        </div>

                        <div>
                            <h5 className="font-bold mb-4 uppercase text-xs tracking-wider text-[var(--text-primary)]">Platform</h5>
                            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                                <li><Link to="/dashboard" className="hover:text-[var(--primary-color)] transition-colors">Dashboard</Link></li>
                                <li><Link to="/pay" className="hover:text-[var(--primary-color)] transition-colors">Crypto API (BotFusion Pay)</Link></li>
                                <li><Link to="/premium" className="hover:text-[var(--primary-color)] transition-colors">Premium Plans</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="font-bold mb-4 uppercase text-xs tracking-wider text-[var(--text-primary)]">Developers</h5>
                            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                                <li><Link to="/docs" className="hover:text-[var(--primary-color)] transition-colors">Documentation</Link></li>
                                <li><Link to="/docs?category=auth" className="hover:text-[var(--primary-color)] transition-colors">API Reference</Link></li>
                                <li><Link to="/docs?endpoint=ratelimits" className="hover:text-[var(--primary-color)] transition-colors">Rate Limits</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="font-bold mb-4 uppercase text-xs tracking-wider text-[var(--text-primary)]">Support</h5>
                            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                                <li><a href="https://t.me/chosentwo_bot" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary-color)] transition-colors">Telegram Support</a></li>
                                <li><a href="#" className="hover:text-[var(--primary-color)] transition-colors">Status Page</a></li>
                                <li><a href="https://github.com/modelmschief/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary-color)] transition-colors">GitHub</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-[var(--border-color)] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[var(--text-muted)]">
                        <div>&copy; 2025 BotFusion Inc. All rights reserved.</div>
                        <div className="flex gap-6">
                            <a href="/privacy.html" className="hover:text-[var(--text-primary)]">Privacy</a>
                            <a href="/terms.html" className="hover:text-[var(--text-primary)]">Terms</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
