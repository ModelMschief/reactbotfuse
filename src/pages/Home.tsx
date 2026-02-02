import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Zap, Activity, Server, Lock, Layers, ExternalLink } from "lucide-react";
import { ParticleBackground } from "@/components/particle-background";

// Import logo image
import appleTouchIcon from "/apple-touch-icon.png";

export default function Home() {
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
            <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden">
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
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-30 pointer-events-none mix-blend-screen"
                >
                    <img
                        src={appleTouchIcon}
                        alt="Background Logo"
                        width={400}
                        height={400}
                        className="blur-[80px]"
                    />
                </motion.div>

                <div className="container relative z-10 text-center px-4 mx-auto max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-color)]/10 text-[var(--primary-color)] text-xs font-bold uppercase tracking-wider mb-6 border border-[var(--primary-color)]/20 backdrop-blur-sm shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                    >
                        <Zap size={12} fill="currentColor" /> Enterprise Telegram Tools
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1] drop-shadow-2xl"
                    >
                        Unitify Your Bots <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-[var(--primary-color)] via-orange-500 to-yellow-500 animate-gradient-x">
                            Telegram Bot Armies
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed font-light drop-shadow-md"
                    >
                        Centralize management, sync user bases automatically, and broadcast to millions.
                        Engineered for technical bot owners who need scale without bans.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link to="/login" className="btn btn-primary h-12 px-8 text-base font-bold shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] hover:scale-105 transition-all">
                            Get Started
                        </Link>
                        <a href="https://modelmschief.github.io/BotFusionDoc/" target="_blank" rel="noopener noreferrer" className="btn bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] h-12 px-8 text-base backdrop-blur-md transition-all">
                            Documentation <ExternalLink size={16} className="ml-2" />
                        </a>
                    </motion.div>
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
                            { icon: Layers, label: "Multi-Bot Architecture" }
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

                        {/* Offline Broadcasting */}
                        <motion.div variants={itemVariants} className="card p-8 group hover:border-[var(--primary-color)]/30 transition-colors">
                            <div className="w-12 h-12 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg flex items-center justify-center mb-6 text-[var(--primary-color)] group-hover:scale-110 transition-transform">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Offline Broadcasting</h3>
                            <p className="text-[var(--text-muted)] leading-relaxed">
                                Bot crashed? Server down? We broadcast directly via Telegram API, bypassing your local bot instance entirely.
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

                        {/* AutoUp */}
                        <motion.div variants={itemVariants} className="md:col-span-2 card p-8 group hover:border-[var(--primary-color)]/30 transition-colors">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="flex-1">
                                    <div className="w-12 h-12 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg flex items-center justify-center mb-6 text-[var(--primary-color)] group-hover:scale-110 transition-transform">
                                        <Shield size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3">AutoUp User Sync Protocol</h3>
                                    <p className="text-[var(--text-muted)] leading-relaxed text-lg mb-4">
                                        Use our API endpoint to automatically push new users from your bot code to our database.
                                        Forget manual CSV exports. As users <code className="bg-[var(--bg-app)] px-1 py-0.5 rounded text-sm font-mono border border-[var(--border-color)]">/start</code> your bot, they are instantly broadcast-ready.
                                    </p>
                                    <span className="font-mono text-xs p-2 rounded bg-[var(--primary-color)]/10 text-[var(--primary-color)] border border-[var(--primary-color)]/20">
                                        POST /autoup
                                    </span>
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
                            { step: "01", title: "Authenticate", desc: "Secure login via Telegram OTP. We verify identity to prevent abuse." },
                            { step: "02", title: "Connect Bots", desc: "Add Bot Tokens. We validate ownership via Telegram's getMe method." },
                            { step: "03", title: "Ingest Users", desc: "Upload legacy files or integrate AutoUp for realtime sync." },
                            { step: "04", title: "Broadcast", desc: "Compose content, select bot subset, and fire. We handle queues." }
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
                                <li><a href="https://modelmschief.github.io/BotFusionDoc/#autoup-system" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary-color)] transition-colors">AutoUp Integration</a></li>
                                <li><a href="https://modelmschief.github.io/BotFusionDoc/#premium-plans" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary-color)] transition-colors">Premium Plans</a></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="font-bold mb-4 uppercase text-xs tracking-wider text-[var(--text-primary)]">Developers</h5>
                            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                                <li><a href="https://modelmschief.github.io/BotFusionDoc/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary-color)] transition-colors">Documentation</a></li>
                                <li><a href="https://modelmschief.github.io/BotFusionDoc/#api-reference" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary-color)] transition-colors">API Reference</a></li>
                                <li><a href="https://modelmschief.github.io/BotFusionDoc/#rate-limits" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary-color)] transition-colors">Rate Limits</a></li>
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
                            <a href="#" className="hover:text-[var(--text-primary)]">Privacy</a>
                            <a href="#" className="hover:text-[var(--text-primary)]">Terms</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
