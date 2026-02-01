"use client";

import { useAuth } from "@/store/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { DASHBOARD_STATS, MOCK_BOTS, BotData } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Loader2, Megaphone, X, CheckCircle, Minimize2, Maximize2, Send, AlertCircle, Clock, Upload, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [bots, setBots] = useState<BotData[]>(MOCK_BOTS);
    const [isLoading, setIsLoading] = useState(true);

    // Selection
    const [selectedBots, setSelectedBots] = useState<Set<string>>(new Set(MOCK_BOTS.map(b => b.id)));

    // Broadcast State Machine
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [broadcastStage, setBroadcastStage] = useState<"idle" | "input" | "sending" | "complete">("idle");
    const [message, setMessage] = useState("");

    // Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingBotId, setUploadingBotId] = useState<string | null>(null);
    const [uploadResult, setUploadResult] = useState<{ count: number; filename: string } | null>(null);

    // Stats
    const [stats, setStats] = useState({
        sent: 0,
        failed: 0,
        total: 0,
        eta: 0, // seconds
        progress: 0
    });

    const simulationRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, [user, router]);

    const toggleBotSelection = (id: string) => {
        const newSet = new Set(selectedBots);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedBots(newSet);
    };

    // --- Broadcast Logic ---
    const openBroadcastWizard = () => {
        setBroadcastStage("input");
        setIsModalOpen(true);
        setMessage("");
    };

    const startBroadcast = () => {
        if (!message.trim()) return;

        setBroadcastStage("sending");

        // Initialize Mock Stats
        const estimatedTotal = selectedBots.size * 1250; // Mock users
        let currentSent = 0;
        let currentFailed = 0;

        setStats({
            sent: 0,
            failed: 0,
            total: estimatedTotal,
            eta: 60,
            progress: 0
        });

        // Simulation Loop
        const interval = setInterval(() => {
            setStats(prev => {
                const batchSize = Math.floor(Math.random() * 50) + 10;
                const failChance = Math.random() > 0.95 ? 1 : 0;

                const nextSent = Math.min(prev.sent + batchSize, estimatedTotal);
                const nextFailed = prev.failed + failChance;
                const nextProgress = Math.min((nextSent / estimatedTotal) * 100, 100);

                if (nextSent >= estimatedTotal) {
                    clearInterval(interval);
                    setBroadcastStage("complete");
                    return { ...prev, sent: nextSent, failed: nextFailed, progress: 100, eta: 0 };
                }

                return {
                    sent: nextSent,
                    failed: nextFailed,
                    total: estimatedTotal,
                    eta: Math.max(0, prev.eta - 0.5), // Mock ETA drop
                    progress: nextProgress
                };
            });
        }, 200);

        simulationRef.current = interval;
    };

    const cancelBroadcast = () => {
        if (simulationRef.current) clearInterval(simulationRef.current);
        setBroadcastStage("idle");
        setIsModalOpen(false);
    };

    const minimize = () => {
        setIsModalOpen(false);
    };

    const maximize = () => {
        setIsModalOpen(true);
    };

    const finish = () => {
        setBroadcastStage("idle");
        setIsModalOpen(false);
    };

    // --- Upload Logic ---
    const handleUploadClick = (e: React.MouseEvent, botId: string) => {
        e.stopPropagation(); // Prevent card selection
        setUploadingBotId(botId);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadingBotId) {
            setUploadingBotId(null);
            return;
        }

        // Simulate Upload and Scan
        setTimeout(() => {
            const newUsers = Math.floor(Math.random() * 500) + 50;

            // Update local bot state mock
            setBots(prev => prev.map(b =>
                b.id === uploadingBotId
                    ? { ...b, userCount: b.userCount + newUsers }
                    : b
            ));

            setUploadResult({ count: newUsers, filename: file.name });
            setUploadingBotId(null);
        }, 1500);
    };

    if (!user) return null;

    return (
        <div className="container py-8 space-y-8 relative pb-24">
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.json,.xml,.csv"
                className="hidden"
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-[var(--text-muted)]">Manage your bot fleet.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={openBroadcastWizard}
                        disabled={selectedBots.size === 0 || broadcastStage === 'sending'}
                        className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Megaphone size={18} />
                        {broadcastStage === 'sending' ? 'Broadcasting...' : `Broadcast (${selectedBots.size})`}
                    </button>
                    <button className="btn bg-[var(--bg-surface)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]">
                        <Plus size={18} /> Add Bot
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DASHBOARD_STATS.map((stat, idx) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="card bg-[var(--bg-surface)] border-[var(--border-color)]"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[var(--text-muted)] text-sm font-medium">{stat.title}</span>
                        </div>
                        <div className="text-3xl font-bold mb-1">{stat.value}</div>
                        <div className={cn("text-xs font-medium", stat.trend === 'up' ? "text-green-500" : "text-[var(--text-muted)]")}>
                            {stat.change}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Bot Grid for Selection */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Your Bots</h2>
                    <div className="relative w-full max-w-xs hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                        <input type="text" placeholder="Search bots..." className="input-field pl-9 py-2 text-sm" />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-[var(--primary-color)]" size={32} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bots.map((bot, idx) => (
                            <motion.div
                                key={bot.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + idx * 0.1 }}
                                className={cn(
                                    "card relative transition-all border-2 cursor-pointer",
                                    selectedBots.has(bot.id) ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5" : "border-[var(--border-color)]"
                                )}
                                onClick={() => toggleBotSelection(bot.id)}
                            >
                                <div className="absolute top-4 right-4 text-[var(--primary-color)]">
                                    {selectedBots.has(bot.id) ? (
                                        <CheckCircle size={20} fill="currentColor" className="text-[var(--bg-surface)]" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-[var(--text-muted)]" />
                                    )}
                                </div>

                                <div className="mb-4 pr-8">
                                    <h3 className="font-bold text-lg">{bot.name}</h3>
                                    <p className="text-sm text-[var(--text-muted)]">{bot.username}</p>
                                </div>

                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border-color)]/50">
                                    <span className="text-sm font-semibold">{bot.userCount.toLocaleString()} users</span>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => handleUploadClick(e, bot.id)}
                                            disabled={uploadingBotId === bot.id}
                                            className="btn btn-ghost text-xs p-1.5 h-auto border border-[var(--border-color)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                                            title="Upload Users"
                                        >
                                            {uploadingBotId === bot.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Upload size={14} />
                                            )}
                                        </button>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${bot.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                            {bot.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- Broadcast Modal & Status Bar --- */}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card w-full max-w-lg bg-[var(--bg-surface)] border-[var(--border-color)] shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            {/* ... (Existing Broadcast Modal Content) ... */}
                            {/* Re-pasting the exact same content to ensure it's preserved */}
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border-color)]">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Megaphone className="text-[var(--primary-color)]" />
                                    {broadcastStage === 'input' ? 'Compose Broadcast' : 'Broadcasting Live'}
                                </h3>
                                <div className="flex gap-2">
                                    {(broadcastStage === 'sending' || broadcastStage === 'complete') && (
                                        <button onClick={minimize} className="p-1 hover:bg-[var(--bg-app)] rounded">
                                            <Minimize2 size={18} />
                                        </button>
                                    )}
                                    <button onClick={broadcastStage === 'sending' ? minimize : cancelBroadcast} className="p-1 hover:bg-[var(--bg-app)] rounded">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Stage: Input */}
                            {broadcastStage === 'input' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Message</label>
                                        <textarea
                                            className="input-field min-h-[150px] resize-none"
                                            placeholder="Type your message here..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                        />
                                        <p className="text-xs text-[var(--text-muted)] mt-2 text-right">{message.length} chars</p>
                                    </div>
                                    <div className="bg-[var(--bg-app)] p-3 rounded-lg flex items-start gap-3 text-sm text-[var(--text-muted)]">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        <p>This will be sent to <strong>{selectedBots.size} bots</strong>, reaching approx <strong>{(selectedBots.size * 1250).toLocaleString()} users</strong>.</p>
                                    </div>
                                    <div className="pt-4 flex justify-end gap-3">
                                        <button onClick={cancelBroadcast} className="btn btn-ghost text-[var(--text-muted)]">Cancel</button>
                                        <button onClick={startBroadcast} disabled={!message} className="btn btn-primary">
                                            <Send size={16} /> Send Broadcast
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Stage: Sending / Complete */}
                            {(broadcastStage === 'sending' || broadcastStage === 'complete') && (
                                <div className="space-y-6">
                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm font-bold">
                                            <span>Progress</span>
                                            <span>{stats.progress.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-4 w-full bg-[var(--bg-app)] rounded-full overflow-hidden border border-[var(--border-color)]">
                                            <motion.div
                                                className="h-full bg-[var(--primary-color)]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stats.progress}%` }}
                                                transition={{ type: "tween", ease: "linear" }}
                                            />
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-[var(--bg-app)] rounded-lg text-center border border-[var(--border-color)]">
                                            <div className="text-2xl font-bold text-green-500">{stats.sent.toLocaleString()}</div>
                                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Success</div>
                                        </div>
                                        <div className="p-4 bg-[var(--bg-app)] rounded-lg text-center border border-[var(--border-color)]">
                                            <div className="text-2xl font-bold text-red-500">{stats.failed.toLocaleString()}</div>
                                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Failed</div>
                                        </div>
                                        <div className="p-4 bg-[var(--bg-app)] rounded-lg text-center border border-[var(--border-color)]">
                                            <div className="text-lg font-bold flex items-center justify-center gap-1">
                                                <Clock size={16} /> {Math.floor(stats.eta)}s
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Est. Time</div>
                                        </div>
                                        <div className="p-4 bg-[var(--bg-app)] rounded-lg text-center border border-[var(--border-color)]">
                                            <div className="text-lg font-bold">{stats.total.toLocaleString()}</div>
                                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Target</div>
                                        </div>
                                    </div>

                                    {broadcastStage === 'complete' && (
                                        <div className="pt-4">
                                            <div className="flex items-center gap-2 text-green-500 justify-center mb-4 font-bold">
                                                <CheckCircle /> Broadcast Completed Successfully
                                            </div>
                                            <button onClick={finish} className="btn btn-primary w-full">Close Report</button>
                                        </div>
                                    )}

                                    {broadcastStage === 'sending' && (
                                        <div className="text-center text-xs text-[var(--text-muted)]">
                                            You can minimize this window to continue working.
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Minimized Bottom Bar */}
            <AnimatePresence>
                {!isModalOpen && (broadcastStage === 'sending' || broadcastStage === 'complete') && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-surface)] border-t border-[var(--primary-color)] shadow-2xl p-4 md:px-8"
                    >
                        <div className="container flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-10 h-10 bg-[var(--primary-color)]/10 rounded-full flex items-center justify-center text-[var(--primary-color)] shrink-0 animate-pulse">
                                    <Megaphone size={20} />
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span>{broadcastStage === 'complete' ? 'Broadcast Complete' : 'Broadcasting...'}</span>
                                        <span>{stats.progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-[var(--bg-app)] rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-[var(--primary-color)]"
                                            animate={{ width: `${stats.progress}%` }}
                                        />
                                    </div>
                                    <div className="text-[10px] text-[var(--text-muted)] mt-1 hidden md:block">
                                        Sent: {stats.sent} | ETA: {Math.floor(stats.eta)}s
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 shrink-0">
                                <button onClick={maximize} className="btn btn-ghost text-sm py-1.5 px-3 border border-[var(--border-color)]">
                                    <Maximize2 size={16} className="mr-2" /> Details
                                </button>
                                {broadcastStage === 'complete' && (
                                    <button onClick={finish} className="btn btn-ghost p-2 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500">
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Upload Result Modal */}
            <AnimatePresence>
                {uploadResult && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card w-full max-w-sm bg-[var(--bg-surface)] border-[var(--border-color)] shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileUp size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Import Complete</h3>
                            <p className="text-[var(--text-muted)] text-sm mb-4">
                                Successfully scanned <strong>{uploadResult.filename}</strong>.
                            </p>

                            <div className="bg-[var(--bg-app)] p-4 rounded-xl border border-[var(--border-color)] mb-6">
                                <div className="text-3xl font-bold text-[var(--primary-color)]">+{uploadResult.count}</div>
                                <div className="text-xs uppercase font-bold text-[var(--text-muted)]">New Users Added</div>
                            </div>

                            <button onClick={() => setUploadResult(null)} className="btn btn-primary w-full">
                                Done
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
