import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Smartphone, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [telegramId, setTelegramId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            await api.post("/request-password-reset", {
                email,
                telegram_id: telegramId
            });
            setSuccess(true);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            const message = axiosErr?.response?.data?.error || "An error occurred";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] text-[var(--text-primary)] p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {success ? (
                    /* Success State */
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Check Your <a href="https://t.me/authentcastbot" style={{ color: "blue" }}>Telegram</a></h2>
                        <p className="text-[var(--text-muted)] mb-6">
                            If your email and Telegram ID match an account, we've sent a reset link to <a href="https://t.me/authentcastbot" style={{ color: "blue" }}>BotFusion Bot</a>. Check the Bot
                        </p>
                        <p className="text-sm text-yellow-500/80 bg-yellow-500/10 p-3 rounded-lg mb-6">
                            <b>⚠️ The link expires in 5 minutes...</b>
                            <p><i>If you didn't get any reset link, Please Check you entered the correct details!</i></p>
                        </p>
                        <Link
                            to="/login"
                            className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={18} />
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    /* Request Form */
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold mb-2">Forgot Password?</h1>
                            <p className="text-[var(--text-muted)]">
                                Enter your email and Telegram ID to receive a reset link
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 ml-1">
                                    <Mail size={14} className="inline mr-1" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 ml-1">
                                    <Smartphone size={14} className="inline mr-1" />
                                    Telegram ID
                                </label>
                                <input
                                    type="text"
                                    value={telegramId}
                                    onChange={(e) => setTelegramId(e.target.value)}
                                    className="input-field"
                                    placeholder="e.g. 1928631932"
                                    required
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1 ml-1">
                                    The same Telegram ID you used during signup
                                </p>
                            </div>

                            {error && (
                                <div className="text-red-500 text-sm text-center font-medium bg-red-500/10 p-2 rounded">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary w-full py-3 text-base font-bold flex justify-center items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    "Send Reset Link"
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link
                                to="/login"
                                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1"
                            >
                                <ArrowLeft size={16} />
                                Back to Login
                            </Link>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
