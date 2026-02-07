
import { useState, useRef, useEffect } from "react";
import {
    Megaphone,
    X,
    Paperclip,
    Image as ImageIcon,
    Video,
    Type,
    Plus,
    Trash2,
    Send,
    Loader2,
    Minimize2,
    Maximize2
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { Bot, Task } from "@/hooks/use-dashboard";

interface BroadcastWizardProps {
    isOpen: boolean;
    onClose: () => void;
    bots: Bot[];
    onTaskStarted: (taskId: string) => void;
}

type ContentType = "text" | "image" | "video";

interface InlineButton {
    text: string;
    url: string;
}

export function BroadcastWizard({ isOpen, onClose, bots, onTaskStarted }: BroadcastWizardProps) {
    const [stage, setStage] = useState<"input" | "sending" | "complete">("input");
    const [contentType, setContentType] = useState<ContentType>("text");
    const [message, setMessage] = useState("");
    const [buttons, setButtons] = useState<InlineButton[][]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [status, setStatus] = useState({ sent: 0, failed: 0, total: 0 });
    const [isMinimized, setIsMinimized] = useState(false);

    // Bot Selection State
    const [excludedBots, setExcludedBots] = useState<string[]>([]);

    // Pin Message State
    const [pinMessage, setPinMessage] = useState(false);

    const pollRef = useRef<NodeJS.Timeout | null>(null);

    const handleAddButtonRow = () => {
        setButtons([...buttons, [{ text: "", url: "" }]]);
    };

    const updateButton = (rowIndex: number, btnIndex: number, field: keyof InlineButton, value: string) => {
        const newButtons = [...buttons];
        newButtons[rowIndex][btnIndex][field] = value;
        setButtons(newButtons);
    };

    const removeButtonRow = (rowIndex: number) => {
        setButtons(buttons.filter((_, i) => i !== rowIndex));
    };

    const toggleBot = (token: string) => {
        if (excludedBots.includes(token)) {
            setExcludedBots(excludedBots.filter(t => t !== token));
        } else {
            setExcludedBots([...excludedBots, token]);
        }
    };

    const handleStart = async () => {
        if (!message && contentType === 'text') return;
        if (!file && contentType !== 'text') return;

        // Validation: At least one bot must be selected
        if (excludedBots.length === bots.length) {
            alert("Please select at least one bot.");
            return;
        }

        const formData = new FormData();
        formData.append("message", message);
        formData.append("content_type", contentType);

        // Flatten the 2D buttons array to 1D - backend expects [{text, url}, ...] 
        // and wraps it in [] for Telegram's inline_keyboard format
        const flattenedButtons = buttons.flat().filter(btn => btn.text && btn.url);
        formData.append("buttons", JSON.stringify(flattenedButtons));
        formData.append("excluded_bot_tokens", JSON.stringify(excludedBots));
        formData.append("pin_message", pinMessage.toString());

        if (file) formData.append("file", file);

        try {
            const res = await api.post("/start-broadcast", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            setTaskId(res.data.task_id);
            onTaskStarted(res.data.task_id);
            setStage("sending");
            startPolling(res.data.task_id);
        } catch (e: any) {
            console.error("Broadcast failed", e);
            alert("Failed to start broadcast: " + (e.response?.data?.error || e.message || "Unknown error"));
        }
    };

    const startPolling = (id: string) => {
        pollRef.current = setInterval(async () => {
            try {
                const res = await api.get(`/task-status/${id}`);
                const task: Task = res.data;
                if (task.progress) {
                    setStatus({
                        sent: task.progress.sent || 0,
                        failed: task.progress.failed || 0,
                        total: task.progress.total || 0
                    });
                }

                if (task.status === 'complete' || task.status === 'stopped') {
                    setStage("complete");
                    if (pollRef.current) clearInterval(pollRef.current);
                }
            } catch (e) {
                console.error("Poll failed", e);
            }
        }, 2000);
    };

    const handleStop = async () => {
        if (taskId) {
            await api.post(`/stop-broadcast/${taskId}`);
        }
    };

    // Cleanup polling on unmount
    useEffect(() => {
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, []);

    // Reset workflow if reopened after completion
    useEffect(() => {
        if (isOpen && stage === 'complete') {
            // When the wizard is reopened and the previous broadcast is complete,
            // keep showing the results. User can click "New Broadcast" to reset.
            // This is intentional behavior - no auto-reset.
        }
    }, [isOpen, stage]);

    const resetWizard = () => {
        setStage("input");
        setTaskId(null);
        setStatus({ sent: 0, failed: 0, total: 0 });
        setMessage("");
        setFile(null);
        setButtons([]);
        setPinMessage(false);
    }

    // STRICT VISIBILITY CONTROL: If !isOpen, return null immediately.
    // This allows backgrounding (state preserved) but ensures Close button actually HIDES the UI.
    if (!isOpen) return null;

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-50 card w-80 bg-[var(--bg-surface)] border-[var(--primary-color)] shadow-2xl p-4 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-sm">Broadcasting...</h4>
                    <p className="text-xs text-[var(--text-muted)]">Sent: {status.sent} / {status.total}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsMinimized(false)} className="hover:text-cyan-400"><Maximize2 size={16} /></button>
                    <button onClick={onClose} className="hover:text-red-400"><X size={16} /></button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="card w-full max-w-2xl bg-[var(--bg-surface)] border-[var(--border-color)] flex flex-col max-h-[90vh] overflow-hidden"
            >
                <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)]">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Megaphone className="text-[var(--primary-color)]" />
                        Broadcaster
                    </h2>
                    <div className="flex gap-2">
                        {stage === 'sending' && <button onClick={() => setIsMinimized(true)} className="p-2 hover:bg-[var(--bg-app)] rounded"><Minimize2 size={20} /></button>}
                        <button onClick={onClose} className="p-2 hover:bg-[var(--bg-app)] rounded text-red-400/80 hover:text-red-400"><X size={20} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {stage === 'input' && (
                        <>
                            {/* Bot Selection */}
                            <div className="bg-[var(--bg-app)] rounded-lg p-4 border border-[var(--border-color)]">
                                <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
                                    Target Bots
                                    <span className="text-xs font-normal text-[var(--text-muted)]">
                                        {bots.length - excludedBots.length} / {bots.length} selected
                                    </span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                    {bots.map((bot) => {
                                        const isSelected = !excludedBots.includes(bot.token);
                                        return (
                                            <label
                                                key={bot.token}
                                                className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${isSelected
                                                    ? "bg-[var(--bg-surface)] border-green-500/50"
                                                    : "bg-[#020617] border-transparent opacity-60"
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded accent-green-500"
                                                    checked={isSelected}
                                                    onChange={() => toggleBot(bot.token)}
                                                />
                                                <div className="overflow-hidden">
                                                    <div className="text-xs font-bold truncate">{bot.username}</div>
                                                    <div className="text-[10px] text-[var(--text-muted)]">{bot.user_count} users</div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex bg-[var(--bg-app)] p-1 rounded-lg">
                                {(['text', 'image', 'video'] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setContentType(type)}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${contentType === type ? 'bg-[var(--bg-surface)] shadow text-[var(--primary-color)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                            }`}
                                    >
                                        {type === 'text' && <Type size={16} />}
                                        {type === 'image' && <ImageIcon size={16} />}
                                        {type === 'video' && <Video size={16} />}
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {contentType !== 'text' && (
                                <div className="border-2 border-dashed border-[var(--border-color)] rounded-xl p-8 text-center hover:border-[var(--primary-color)]/50 transition-colors cursor-pointer"
                                    onClick={() => document.getElementById('media-upload')?.click()}
                                >
                                    <input
                                        id="media-upload"
                                        type="file"
                                        className="hidden"
                                        accept={contentType === 'image' ? "image/*" : "video/*"}
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    {file ? (
                                        <div className="text-green-500 font-bold flex items-center justify-center gap-2">
                                            <Paperclip size={20} /> {file.name}
                                        </div>
                                    ) : (
                                        <div className="text-[var(--text-muted)]">
                                            <p className="mb-2">Click to upload {contentType}</p>
                                            <p className="text-xs">Max size: 10MB</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold mb-2">
                                    {contentType === 'text' ? 'Message' : 'Caption (Optional)'}
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="input-field min-h-[120px]"
                                    placeholder={contentType === 'text' ? "Hello everyone..." : "Describe this media..."}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold">Inline Buttons</label>
                                    <button onClick={handleAddButtonRow} className="text-xs text-[var(--primary-color)] flex items-center gap-1 hover:underline">
                                        <Plus size={14} /> Add Row
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {buttons.map((row, rowIndex) => (
                                        <div key={rowIndex} className="flex gap-2 items-center">
                                            <input
                                                className="input-field py-1 text-sm flex-1"
                                                placeholder="Button Text"
                                                value={row[0].text}
                                                onChange={(e) => updateButton(rowIndex, 0, 'text', e.target.value)}
                                            />
                                            <input
                                                className="input-field py-1 text-sm flex-1"
                                                placeholder="URL (https://...)"
                                                value={row[0].url}
                                                onChange={(e) => updateButton(rowIndex, 0, 'url', e.target.value)}
                                            />
                                            <button onClick={() => removeButtonRow(rowIndex)} className="text-red-500 hover:bg-red-500/10 p-1 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pin Message Toggle */}
                            <div className="bg-[var(--bg-app)] rounded-lg p-4 border border-[var(--border-color)]">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <span className="text-sm font-bold">Pin Message</span>
                                        <p className="text-xs text-[var(--text-muted)] mt-1">
                                            ⚠️ Pinning adds a small delay to avoid rate limits.
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={pinMessage}
                                        onChange={(e) => setPinMessage(e.target.checked)}
                                        className="w-5 h-5 rounded accent-[var(--primary-color)]"
                                    />
                                </label>
                            </div>
                        </>
                    )}

                    {(stage === 'sending' || stage === 'complete') && (
                        <div className="text-center py-10 space-y-6">
                            <div className="relative w-32 h-32 mx-auto">
                                <div className="absolute inset-0 rounded-full border-4 border-[var(--bg-app)]"></div>
                                <motion.div
                                    className="absolute inset-0 rounded-full border-4 border-[var(--primary-color)] border-t-transparent"
                                    animate={stage === 'sending' ? { rotate: 360 } : {}}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl">
                                    {/* Safe calculation */}
                                    {status.total > 0 ? Math.round((status.sent / status.total) * 100) : 0}%
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                                <div className="card p-3 text-center">
                                    <div className="text-2xl font-bold text-green-500">{status.sent}</div>
                                    <div className="text-xs text-[var(--text-muted)]">SENT</div>
                                </div>
                                <div className="card p-3 text-center">
                                    <div className="text-2xl font-bold text-red-500">{status.failed}</div>
                                    <div className="text-xs text-[var(--text-muted)]">FAILED</div>
                                </div>
                            </div>

                            {stage === 'complete' && <p className="text-green-500 font-bold">Broadcast Complete!</p>}
                        </div>
                    )}

                </div>

                <div className="p-4 border-t border-[var(--border-color)] flex justify-end gap-3">
                    {stage === 'input' && (
                        <button onClick={handleStart} className="btn btn-primary flex gap-2 items-center">
                            <Send size={18} /> Start Broadcast
                        </button>
                    )}
                    {stage === 'sending' && (
                        <>
                            <button onClick={onClose} className="btn bg-[var(--bg-app)] hover:bg-[var(--bg-surface)] text-[var(--text-muted)]">
                                Background
                            </button>
                            <button onClick={handleStop} className="btn bg-red-500 hover:bg-red-600 text-white">
                                Stop Broadcast
                            </button>
                        </>
                    )}
                    {stage === 'complete' && (
                        <>
                            <button onClick={resetWizard} className="btn bg-[var(--bg-surface)] hover:bg-[var(--bg-app)]">
                                New Broadcast
                            </button>
                            <button onClick={onClose} className="btn btn-primary">
                                Close
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
// End of file
