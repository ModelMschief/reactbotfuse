import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smartphone, CheckCircle2, AlertCircle, Loader2, X, ExternalLink, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth-context";

interface TelegramLinkingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function TelegramLinkingModal({ isOpen, onClose, onSuccess }: TelegramLinkingModalProps) {
    const { updateUserTelegram } = useAuth();

    const [step, setStep] = useState<"input" | "otp" | "success">("input");
    const [telegramId, setTelegramId] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);

    const handleClose = () => {
        setError("");
        setLoading(false);
        setStep("input");
        setOtp("");
        onClose();
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const cleanId = telegramId.trim();
        if (!cleanId || !/^\d+$/.test(cleanId)) {
            setError("Please enter a valid numerical Telegram User ID.");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post("/api/auth/link-telegram", {
                telegram_id: cleanId,
            });

            if (res.status === 200 || res.data?.status === "otp_sent") {
                setStep("otp");
                setResendCooldown(60);
                const timer = setInterval(() => {
                    setResendCooldown((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setError(res.data?.error || "Failed to send verification code.");
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            const msg = axiosErr?.response?.data?.error || "Failed to send OTP. Ensure you started @authentcastbot on Telegram.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const cleanOtp = otp.trim();
        if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
            setError("Please enter the 6-digit verification code sent to your Telegram.");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post("/api/auth/verify-telegram-otp", {
                telegram_id: telegramId.trim(),
                otp: cleanOtp,
            });

            if (res.status === 200 && (res.data?.status === "verified" || res.data?.user?.telegram_verified)) {
                updateUserTelegram(telegramId.trim(), true);
                setStep("success");
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                setError(res.data?.error || "Invalid verification code. Please check your Telegram.");
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            const msg = axiosErr?.response?.data?.error || "Verification failed. The code may be incorrect or expired.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden z-10"
                >
                    {/* Header bar with gradient */}
                    <div className="h-2 bg-gradient-to-r from-[var(--fire-red)] via-[var(--fire-orange)] to-[var(--fire-yellow)]" />

                    <div className="p-6 sm:p-8">
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--bg-app)] transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={18} />
                        </button>

                        {/* STEP 1: Input Telegram ID */}
                        {step === "input" && (
                            <div>
                                <div className="text-center mb-6">
                                    <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-sm">
                                        <Send size={28} className="translate-x-[-1px] translate-y-[1px]" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Connect Telegram</h2>
                                    <p className="text-[var(--text-muted)] text-sm mt-1.5 leading-relaxed">
                                        Link your Telegram account to receive instant login alerts, manage bot fleets, and execute broadcasts.
                                    </p>
                                </div>

                                {/* Guidance Callout */}
                                <div className="mb-6 p-3.5 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl text-xs space-y-2">
                                    <p className="font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                                        <ShieldCheck size={14} className="text-blue-500 shrink-0" />
                                        How to find your Telegram User ID:
                                    </p>
                                    <ol className="list-decimal list-inside space-y-1 text-[var(--text-muted)] pl-1">
                                        <li>
                                            Open{" "}
                                            <a
                                                href="https://t.me/authentcastbot"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:underline font-medium inline-flex items-center gap-0.5"
                                            >
                                                @authentcastbot <ExternalLink size={10} />
                                            </a>{" "}
                                            or{" "}
                                            <a
                                                href="https://t.me/userinfobot"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:underline font-medium inline-flex items-center gap-0.5"
                                            >
                                                @userinfobot <ExternalLink size={10} />
                                            </a>
                                        </li>
                                        <li>Send <code className="bg-[var(--bg-surface)] px-1 py-0.5 rounded font-mono text-blue-400">/start</code> to get your numerical ID.</li>
                                        <li>Make sure you have started <code className="text-blue-500 font-semibold">@authentcastbot</code> to receive the OTP code.</li>
                                    </ol>
                                </div>

                                <form onSubmit={handleSendOtp} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 ml-1">
                                            Telegram User ID
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={telegramId}
                                            onChange={(e) => {
                                                setTelegramId(e.target.value);
                                                setError("");
                                            }}
                                            placeholder="e.g. 1928631932"
                                            className="input-field font-mono text-base"
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    {error && (
                                        <div className="flex items-start gap-2 text-red-500 text-xs font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                            <span className="leading-relaxed">{error}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading || !telegramId.trim()}
                                        className="btn btn-primary w-full py-3 text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                <span>Sending Verification Code...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Send Verification Code</span>
                                                <ArrowRight size={16} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* STEP 2: Input OTP */}
                        {step === "otp" && (
                            <div>
                                <div className="text-center mb-6">
                                    <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-sm">
                                        <Smartphone size={28} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Enter Security Code</h2>
                                    <p className="text-[var(--text-muted)] text-sm mt-1.5 leading-relaxed">
                                        We sent a 6-digit OTP code to Telegram ID <span className="font-mono font-semibold text-[var(--text-primary)]">{telegramId}</span> via{" "}
                                        <a
                                            href="https://t.me/authentcastbot"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline font-medium inline-flex items-center gap-0.5"
                                        >
                                            @authentcastbot <ExternalLink size={10} />
                                        </a>.
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 ml-1 text-center">
                                            6-Digit Verification Code
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => {
                                                setOtp(e.target.value);
                                                setError("");
                                            }}
                                            placeholder="••••••"
                                            className="input-field text-center text-2xl tracking-[0.4em] font-mono py-3 font-bold"
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    {error && (
                                        <div className="flex items-start gap-2 text-red-500 text-xs font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                            <span className="leading-relaxed">{error}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading || otp.trim().length !== 6}
                                        className="btn btn-primary w-full py-3 text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                <span>Verifying Code...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck size={18} />
                                                <span>Verify & Link Telegram</span>
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--border-color)]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep("input");
                                            setError("");
                                        }}
                                        className="hover:text-[var(--text-primary)] hover:underline"
                                    >
                                        Change ID
                                    </button>
                                    <button
                                        type="button"
                                        disabled={resendCooldown > 0 || loading}
                                        onClick={handleSendOtp}
                                        className="hover:text-[var(--primary-color)] flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Success Confirmation */}
                        {step === "success" && (
                            <div className="text-center py-4 space-y-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20"
                                >
                                    <CheckCircle2 size={36} />
                                </motion.div>

                                <div className="space-y-1">
                                    <h3 className="text-2xl font-bold text-[var(--text-primary)]">Telegram Connected!</h3>
                                    <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">
                                        Your account is now linked with Telegram ID <span className="font-mono font-semibold text-[var(--text-primary)]">{telegramId}</span>.
                                    </p>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="btn btn-primary w-full py-3 text-sm font-bold shadow-md hover:shadow-lg"
                                    >
                                        Done & Continue
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default TelegramLinkingModal;
