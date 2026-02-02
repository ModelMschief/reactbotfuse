import { useState } from "react";
import { useAuth } from "@/store/auth-context";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Smartphone, Loader2 } from "lucide-react";

export default function Login() {
    const { login, signupInit, verifyOtp } = useAuth();
    const navigate = useNavigate();

    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [telegramId, setTelegramId] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            if (isSignup) {
                // Step 1: Init Signup -> Triggers OTP
                // signupInit throws on failure, returns true on success
                await signupInit(email, password, telegramId);
                // If we get here, OTP was sent successfully
                setShowOtpModal(true);
            } else {
                // Login Flow
                const success = await login(email, password);
                if (success) {
                    navigate("/dashboard");
                } else {
                    setError("Invalid email or password");
                }
            }
        } catch (err: unknown) {
            // Handle AxiosError from API
            const axiosErr = err as { response?: { data?: { error?: string } } };
            const message = axiosErr?.response?.data?.error ||
                (typeof err === 'string' ? err : "An error occurred");
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const success = await verifyOtp(email, otp);
            if (success) {
                navigate("/dashboard");
            } else {
                setError("Invalid OTP");
            }
        } catch (err: unknown) {
            // Handle AxiosError from API
            const axiosErr = err as { response?: { data?: { error?: string } } };
            const message = axiosErr?.response?.data?.error || "Verification failed";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[var(--bg-app)] text-[var(--text-primary)] font-sans">

            {/* Left Decoration */}
            <div className="hidden md:flex flex-col justify-center items-center bg-[#070707] relative overflow-hidden p-12 text-center border-r border-[var(--border-color)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-color)]/10 to-transparent pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="mb-8 p-6 bg-[var(--primary-color)]/10 rounded-full border border-[var(--primary-color)]/20 shadow-[0_0_50px_rgba(220,38,38,0.2)]"
                >
                    <Shield size={64} className="text-[var(--primary-color)]" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-4">Command Your Fleet</h2>
                <p className="text-[var(--text-muted)] max-w-sm leading-relaxed">
                    Centralized management for your Telegram bot empire. Sync, broadcast, and dominate.
                </p>
            </div>

            {/* Right Form */}
            <div className="flex items-center justify-center p-6 relative">
                <AnimatePresence>
                    {showOtpModal ? (
                        /* OTP Modal Overlay */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8 shadow-2xl relative z-10"
                        >
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Smartphone size={24} />
                                </div>
                                <h2 className="text-2xl font-bold">Verify Account</h2>
                                <p className="text-[var(--text-muted)] text-sm mt-2">
                                    We sent a code to your Telegram ID linked to <b>{email}</b>.
                                </p>
                            </div>

                            <form onSubmit={handleOtpSubmit} className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                                        placeholder="••••••"
                                        maxLength={6}
                                        required
                                    />
                                </div>

                                {error && <div className="text-red-500 text-sm text-center font-medium bg-red-500/10 p-2 rounded">{error}</div>}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn btn-primary w-full py-3 text-base flex justify-center items-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : "Verify & Enter"}
                                </button>
                            </form>

                            <button
                                onClick={() => setShowOtpModal(false)}
                                className="mt-4 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] w-full text-center"
                            >
                                Cancel
                            </button>
                        </motion.div>

                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-md space-y-8"
                        >
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold mb-2">
                                    {isSignup ? "Create Account" : "Welcome Back"}
                                </h1>
                                <p className="text-[var(--text-muted)]">
                                    {isSignup ? "Join the BotFusion Fleet" : "Sign in to manage your bots"}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 ml-1">Email</label>
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
                                    <label className="block text-sm font-medium mb-1.5 ml-1">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input-field"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <AnimatePresence>
                                    {isSignup && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-0"> {/* Wrapper to avoid margin collapse if needed */}
                                                <label className="block text-sm font-medium mb-1.5 ml-1">Telegram ID</label>
                                                <input
                                                    type="text"
                                                    value={telegramId}
                                                    onChange={(e) => setTelegramId(e.target.value)}
                                                    className="input-field"
                                                    placeholder="e.g. 1928631932"
                                                    required={isSignup}
                                                />
                                                <p className="text-xs text-[var(--text-muted)] mt-1 ml-1">Required for OTP verification.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {error && <div className="text-red-500 text-sm text-center font-medium bg-red-500/10 p-2 rounded">{error}</div>}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn btn-primary w-full py-3 text-base font-bold shadow-lg hover:shadow-red-500/20 flex justify-center items-center gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <>
                                            {isSignup ? "Sign Up" : "Log In"}
                                            <Lock size={16} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
                                {isSignup ? "Already have an account?" : "Don't have an account?"} {" "}
                                <button
                                    type="button"
                                    onClick={() => { setIsSignup(!isSignup); setError(""); }}
                                    className="text-[var(--primary-color)] font-semibold hover:underline"
                                >
                                    {isSignup ? "Log In" : "Sign up"}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
