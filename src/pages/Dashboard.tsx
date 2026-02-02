import { useState, useEffect } from "react";
import {
    Users,
    Send,
    Plus,
    FileUp,
    Activity,
    Zap,
    Trash2,
    Bot as BotIcon,
    Loader2,
    UploadCloud,
    X,
    BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/hooks/use-dashboard";
import { BroadcastWizard } from "@/components/broadcast-wizard";

export default function Dashboard() {
    const { bots, tasks, plan, loading, refresh, addBot, deleteBot, uploadUsers } = useDashboard();

    // Local UI State
    const [isAddBotOpen, setIsAddBotOpen] = useState(false);
    const [newBotToken, setNewBotToken] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    // Upload State
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedBotForUpload, setSelectedBotForUpload] = useState<string | null>(null);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Broadcast State
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

    // Mobile Stats Modal State
    const [isMobileStatsOpen, setMobileStatsOpen] = useState(false);

    // Listen for openStatsModal event from navbar
    useEffect(() => {
        const handleOpenStats = () => setMobileStatsOpen(true);
        window.addEventListener("openStatsModal", handleOpenStats);
        return () => window.removeEventListener("openStatsModal", handleOpenStats);
    }, []);

    // Stats Calculation
    const totalUsers = bots.reduce((acc, bot) => acc + bot.user_count, 0);
    const activeBroadcasts = tasks.filter(t => t.status === 'running').length;

    const handleAddBot = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);

        const result = await addBot(newBotToken);

        setIsAdding(false);
        if (result.success) {
            setIsAddBotOpen(false);
            setNewBotToken("");
        } else {
            alert(result.message); // Simple alert for now, can be Toast later
        }
    };

    const handleTaskStarted = () => {
        refresh(); // Reload tasks list
        // We don't close the wizard automatically, let it stay open to show progress
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                <Loader2 className="animate-spin text-[var(--primary-color)]" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header Stats - Hidden on mobile, use navbar "Stats & History" instead */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Total Audience"
                    value={totalUsers.toLocaleString()}
                    icon={<Users className="text-blue-400" />}
                    trend="+12% this week"
                />
                <StatsCard
                    title="Active Bots"
                    value={bots.length.toString()}
                    icon={<BotIcon className="text-purple-400" />}
                />
                <StatsCard
                    title="Broadcasts"
                    value={tasks.length.toString()}
                    icon={<Activity className="text-green-400" />}
                    trend={`${activeBroadcasts} running`}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Bot Management */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Zap className="text-[var(--primary-color)]" size={20} />
                            Your Fleet
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsBroadcastOpen(true)}
                                disabled={bots.length === 0}
                                className="btn bg-[var(--bg-surface)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)] flex items-center gap-2 disabled:opacity-50"
                            >
                                <Send size={16} /> Broadcast
                            </button>
                            <button
                                onClick={() => setIsAddBotOpen(true)}
                                className="btn btn-primary flex items-center gap-2 text-sm"
                            >
                                <Plus size={16} /> Add Bot
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence>
                            {bots.map((bot) => (
                                <motion.div
                                    key={bot.token}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="card group hover:border-[var(--primary-color)]/50 transition-colors relative"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[var(--bg-app)] border border-[var(--border-color)] flex items-center justify-center">
                                                <BotIcon size={20} className="text-[var(--text-muted)]" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{bot.username}</h3>
                                                <p className="text-xs text-[var(--text-muted)] font-mono">
                                                    {bot.token.substring(0, 10)}...
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteBot(bot.token)}
                                            className="text-red-500/0 group-hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-500/10 rounded"
                                            title="Delete Bot"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--text-muted)]">Subscribers</span>
                                        <span className="font-bold">{bot.user_count.toLocaleString()}</span>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex gap-2">
                                        <button
                                            className="flex-1 py-1.5 text-xs bg-[var(--bg-app)] hover:bg-[var(--primary-color)]/10 hover:text-[var(--primary-color)] rounded transition-colors"
                                            onClick={() => { setSelectedBotForUpload(bot.token); setUploadModalOpen(true); }}
                                        >
                                            Upload Users
                                        </button>
                                        {/* Replaced individual broadcast button with global one for now, or could map to this */}
                                        <button
                                            onClick={() => setIsBroadcastOpen(true)}
                                            className="flex-1 py-1.5 text-xs bg-[var(--bg-app)] hover:bg-blue-500/10 hover:text-blue-400 rounded transition-colors"
                                        >
                                            Broadcast
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {bots.length === 0 && (
                            <div className="col-span-full py-12 text-center text-[var(--text-muted)] border border-dashed border-[var(--border-color)] rounded-xl">
                                <BotIcon size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No bots connected yet.</p>
                                <button onClick={() => setIsAddBotOpen(true)} className="text-[var(--primary-color)] hover:underline mt-2">Add your first bot</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Recent Activity (Tasks) - Hidden on mobile/tablet */}
                <div className="hidden lg:block lg:col-span-1 space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="text-blue-400" size={20} />
                        Recent Tasks
                    </h2>

                    <div className="card space-y-4 max-h-[600px] overflow-y-auto">
                        {tasks.length === 0 ? (
                            <p className="text-center text-[var(--text-muted)] py-4">No recent activity.</p>
                        ) : (
                            tasks.slice(0, 10).map((task) => (
                                <div key={task._id} className="p-3 bg-[var(--bg-app)] rounded-lg border border-[var(--border-color)]">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${task.status === 'complete' ? 'bg-green-500/10 text-green-500' :
                                            task.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                                                'bg-blue-500/10 text-blue-500 animate-pulse'
                                            }`}>
                                            {task.status}
                                        </span>
                                        <span className="text-[10px] text-[var(--text-muted)]">
                                            {new Date(task.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium mb-1">
                                        {task.type === 'broadcast' ? '📢 Broadcast' : '📂 File Parse'}
                                    </p>
                                    {task.type === 'broadcast' && task.progress && (
                                        <div className="text-xs text-[var(--text-muted)]">
                                            Sent: {task.progress.sent} / {task.progress.total}
                                            {task.progress.failed ? <span className="text-red-400 ml-2">({task.progress.failed} failed)</span> : null}
                                        </div>
                                    )}
                                    {task.type === 'file_parse' && task.progress && (
                                        <div className="text-xs text-[var(--text-muted)]">
                                            Found: {task.progress.found} | Added: {task.progress.added}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Broadcast Wizard */}
            <BroadcastWizard
                isOpen={isBroadcastOpen}
                onClose={() => setIsBroadcastOpen(false)}
                bots={bots}
                onTaskStarted={handleTaskStarted}
            />

            {/* Add Bot Modal */}
            <AnimatePresence>
                {isAddBotOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="card w-full max-w-md bg-[var(--bg-surface)] border-[var(--border-color)]"
                        >
                            <h2 className="text-xl font-bold mb-4">Connect New Bot</h2>
                            <form onSubmit={handleAddBot}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2">Bot Token</label>
                                    <input
                                        type="text"
                                        value={newBotToken}
                                        onChange={(e) => setNewBotToken(e.target.value)}
                                        className="input-field font-mono text-sm"
                                        placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                        required
                                    />
                                    <p className="text-xs text-[var(--text-muted)] mt-2">
                                        Paste the token from BotFather. We'll automatically fetch the username.
                                    </p>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddBotOpen(false)}
                                        className="px-4 py-2 rounded-lg hover:bg-[var(--bg-app)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary flex items-center gap-2"
                                        disabled={isAdding}
                                    >
                                        {isAdding ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                        Connect Bot
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Upload Users Modal */}
            <AnimatePresence>
                {uploadModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="card w-full max-w-lg bg-[var(--bg-surface)] border-[var(--border-color)]"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <UploadCloud className="text-[var(--primary-color)]" /> Upload Users
                                </h2>
                                <button onClick={() => { setUploadModalOpen(false); setFileToUpload(null); }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="border-2 border-dashed border-[var(--border-color)] rounded-xl p-8 text-center hover:border-[var(--primary-color)]/50 transition-colors cursor-pointer"
                                    onClick={() => document.getElementById('user-file-upload')?.click()}
                                >
                                    <input
                                        id="user-file-upload"
                                        type="file"
                                        className="hidden"
                                        accept=".txt,.csv,.xml,.json"
                                        onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                                    />
                                    {fileToUpload ? (
                                        <div className="text-green-500 font-bold flex flex-col items-center gap-2">
                                            <FileUp size={32} />
                                            {fileToUpload.name}
                                            <span className="text-xs text-[var(--text-muted)] font-normal">{(fileToUpload.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    ) : (
                                        <div className="text-[var(--text-muted)]">
                                            <UploadCloud size={32} className="mx-auto mb-3 opacity-50" />
                                            <p className="font-medium">Click to select file</p>
                                            <p className="text-xs mt-1">Supported: .txt, .csv, .xml, .json (One ID per line)</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        className="btn btn-primary w-full flex justify-center items-center gap-2"
                                        disabled={!fileToUpload || isUploading}
                                        onClick={async () => {
                                            if (!fileToUpload || !selectedBotForUpload) return;
                                            setIsUploading(true);
                                            const res = await uploadUsers(selectedBotForUpload, fileToUpload);
                                            setIsUploading(false);

                                            if (res.success) {
                                                alert(res.message);
                                                setUploadModalOpen(false);
                                                setFileToUpload(null);
                                                refresh();
                                            } else {
                                                alert("Upload Error: " + res.message);
                                            }
                                        }}
                                    >
                                        {isUploading ? <Loader2 className="animate-spin" /> : <UploadCloud size={18} />}
                                        Start Upload
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Stats & History Modal */}
            <AnimatePresence>
                {isMobileStatsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-[var(--bg-app)] overflow-y-auto md:hidden"
                    >
                        <div className="p-4 space-y-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <BarChart3 className="text-blue-400" size={24} />
                                    Stats & History
                                </h2>
                                <button
                                    onClick={() => setMobileStatsOpen(false)}
                                    className="p-2 bg-[var(--bg-surface)] rounded-full border border-[var(--border-color)]"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 gap-4">
                                <StatsCard
                                    title="Total Audience"
                                    value={totalUsers.toLocaleString()}
                                    icon={<Users className="text-blue-400" />}
                                    trend="+12% this week"
                                />
                                <StatsCard
                                    title="Active Bots"
                                    value={bots.length.toString()}
                                    icon={<BotIcon className="text-purple-400" />}
                                />
                                <StatsCard
                                    title="Broadcasts"
                                    value={tasks.length.toString()}
                                    icon={<Activity className="text-green-400" />}
                                    trend={`${activeBroadcasts} running`}
                                />
                            </div>

                            {/* Recent Tasks */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Activity className="text-blue-400" size={18} />
                                    Recent Tasks
                                </h3>
                                <div className="space-y-3">
                                    {tasks.length === 0 ? (
                                        <p className="text-center text-[var(--text-muted)] py-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)]">
                                            No recent activity.
                                        </p>
                                    ) : (
                                        tasks.slice(0, 10).map((task) => (
                                            <div key={task._id} className="p-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)]">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${task.status === 'complete' ? 'bg-green-500/10 text-green-500' :
                                                        task.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                                                            'bg-blue-500/10 text-blue-500 animate-pulse'
                                                        }`}>
                                                        {task.status}
                                                    </span>
                                                    <span className="text-[10px] text-[var(--text-muted)]">
                                                        {new Date(task.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium mb-1">
                                                    {task.type === 'broadcast' ? '📢 Broadcast' : '📂 File Parse'}
                                                </p>
                                                {task.type === 'broadcast' && task.progress && (
                                                    <div className="text-xs text-[var(--text-muted)]">
                                                        Sent: {task.progress.sent} / {task.progress.total}
                                                        {task.progress.failed ? <span className="text-red-400 ml-2">({task.progress.failed} failed)</span> : null}
                                                    </div>
                                                )}
                                                {task.type === 'file_parse' && task.progress && (
                                                    <div className="text-xs text-[var(--text-muted)]">
                                                        Found: {task.progress.found} | Added: {task.progress.added}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Close button at bottom */}
                            <button
                                onClick={() => setMobileStatsOpen(false)}
                                className="w-full btn bg-[var(--bg-surface)] border border-[var(--border-color)] py-3"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatsCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend?: string }) {
    return (
        <div className="card hover:border-[var(--primary-color)]/30 transition-colors">
            <div className="flex items-start justify-between mb-2">
                <span className="text-[var(--text-muted)] text-sm font-medium">{title}</span>
                <div className="p-2 bg-[var(--bg-app)] rounded-lg border border-[var(--border-color)]">
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-bold mb-1">{value}</div>
            {trend && <div className="text-xs text-[var(--primary-color)] font-medium">{trend}</div>}
        </div>
    );
}
