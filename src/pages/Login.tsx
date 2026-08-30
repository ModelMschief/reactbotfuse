import { useState, useEffect } from "react";
import { useAuth } from "@/store/auth-context";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Smartphone, Loader2, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24">
            <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
        </svg>
    );
}

export default function Login() {
    const { login, signupInit, verifyOtp } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [telegramId, setTelegramId] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Check for query errors on mount (e.g. from OAuth redirects)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const queryError = params.get("error");
        if (queryError) {
            if (queryError === "oauth_denied") {
                setError("Google sign-in was cancelled. Please try again.");
            } else if (queryError === "token_exchange_failed" || queryError === "userinfo_failed") {
                setError("Failed to authenticate with Google. Please try again or use email login.");
            } else {
                setError(`Authentication error: ${queryError}`);
            }
        }
    }, [location]);

    const handleGoogleAuth = () => {
        // Redirect browser to backend Google OAuth initiation endpoint
        window.location.href = `${API_BASE_URL}/api/auth/google`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            if (isSignup) {
                // Step 1: Init Signup -> Triggers OTP
                await signupInit(email, password, telegramId);
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
            const message =
                axiosErr?.response?.data?.error ||
                (typeof err === "string" ? err : "An error occurred during authentication.");
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
                setError("Invalid OTP code. Please check your Telegram.");
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            const message = axiosErr?.response?.data?.error || "Verification failed.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] grid grid-cols-1 md:grid-cols-2 bg-[var(--bg-app)] text-[var(--text-primary)] font-sans">
            {/* Left Hero / Brand Column */}
            <div className="hidden md:flex flex-col justify-center items-center bg-[#070707] relative overflow-hidden p-12 text-center border-r border-[var(--border-color)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-color)]/10 via-orange-500/5 to-transparent pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="mb-8 p-6 bg-[var(--primary-color)]/10 rounded-3xl border border-[var(--primary-color)]/20 shadow-[0_0_50px_rgba(220,38,38,0.2)]"
                >
                    <Shield size={64} className="text-[var(--primary-color)]" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Command Your Bot Fleet</h2>
                <p className="text-[var(--text-muted)] max-w-sm leading-relaxed text-sm">
                    Enterprise-grade API management and mass broadcast infrastructure for Telegram bots. Synchronize audiences, detect abuse, and accept crypto.
                </p>

                <div className="mt-8 flex items-center gap-6 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5">
                        <Lock size={14} className="text-emerald-500" /> AES-256 Auth
                    </span>
                    <span className="flex items-center gap-1.5">
                        <GoogleIcon className="w-3.5 h-3.5" /> Google OAuth
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Smartphone size={14} className="text-blue-400" /> Telegram 2FA
                    </span>
                </div>
            </div>

            {/* Right Authentication Form Column */}
            <div className="flex items-center justify-center p-6 sm:p-10 relative">
                <AnimatePresence mode="wait">
                    {showOtpModal ? (
                        /* OTP Modal Overlay */
                        <motion.div
                            key="otp-modal"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-8 shadow-2xl relative z-10"
                        >
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-sm">
                                    <Smartphone size={28} />
                                </div>
                                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Verify Telegram OTP</h2>
                                <p className="text-[var(--text-muted)] text-sm mt-2 leading-relaxed">
                                    We sent a 6-digit verification code to your Telegram ID via{" "}
                                    <a
                                        href="https://t.me/authentcastbot"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline font-semibold"
                                    >
                                        @authentcastbot
                                    </a>
                                    .<br />Check your Telegram messages for the code.
                                </p>
                            </div>

                            <form onSubmit={handleOtpSubmit} className="space-y-4">
                                <div>
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
                                        className="input-field text-center text-2xl tracking-[0.4em] font-mono py-3 font-bold"
                                        placeholder="••••••"
                                        required
                                        autoFocus
                                    />
                                </div>

                                {error && (
                                    <div className="text-red-500 text-xs text-center font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading || otp.length !== 6}
                                    className="btn btn-primary w-full py-3 text-base font-bold shadow-md flex justify-center items-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Verify & Enter Dashboard"}
                                </button>
                            </form>

                            <button
                                type="button"
                                onClick={() => setShowOtpModal(false)}
                                className="mt-4 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] w-full text-center"
                            >
                                Back to Signup
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="auth-card"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="w-full max-w-md space-y-6"
                        >
                            {/* Header */}
                            <div className="text-center">
                                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] mb-2">
                                    {isSignup ? "Create Your Account" : "Welcome Back"}
                                </h1>
                                <p className="text-[var(--text-muted)] text-sm">
                                    {isSignup
                                        ? "Get started with high-performance Telegram bot infrastructure"
                                        : "Sign in to access your bot fleet, APIs, and analytics"}
                                </p>
                            </div>

                            {/* Google OAuth Button */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={handleGoogleAuth}
                                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.99]"
                                >
                                    <GoogleIcon className="w-5 h-5 shrink-0" />
                                    <span>{isSignup ? "Sign up with Google" : "Continue with Google"}</span>
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[var(--border-color)]"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                                    <span className="bg-[var(--bg-app)] px-3 text-[var(--text-muted)] font-medium">
                                        or continue with email
                                    </span>
                                </div>
                            </div>

                            {/* Email / Password Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 ml-1">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setError("");
                                            }}
                                            className="input-field pl-10"
                                            placeholder="you@example.com"
                                            required
                                        />
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 ml-1">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                setError("");
                                            }}
                                            className="input-field pl-10 pr-10"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
                                            tabIndex={-1}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isSignup && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden space-y-1 pt-1"
                                        >
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
                                                className="input-field font-mono text-sm"
                                                placeholder="e.g. 1928631932"
                                                required={isSignup}
                                            />
                                            <p className="text-xs text-[var(--text-muted)] mt-1 ml-1 leading-relaxed">
                                                Send <code className="text-blue-500">/start</code> to{" "}
                                                <a
                                                    href="https://t.me/authentcastbot"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:underline font-semibold"
                                                >
                                                    @authentcastbot
                                                </a>{" "}
                                                to get your ID for OTP verification.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {error && (
                                    <div className="text-red-500 text-xs font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn btn-primary w-full py-3 text-sm font-bold shadow-lg hover:shadow-red-500/20 flex justify-center items-center gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <>
                                            <span>{isSignup ? "Sign Up & Verify" : "Log In to Account"}</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Toggle Sign up / Log in */}
                            <div className="text-center text-sm text-[var(--text-muted)] pt-2">
                                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSignup(!isSignup);
                                        setError("");
                                    }}
                                    className="text-[var(--primary-color)] font-semibold hover:underline cursor-pointer"
                                >
                                    {isSignup ? "Log In" : "Sign Up"}
                                </button>
                            </div>

                            {/* Forgot Password Link (Login mode only) */}
                            {!isSignup && (
                                <div className="text-center">
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs text-[var(--text-muted)] hover:text-[var(--primary-color)] hover:underline"
                                    >
                                        Forgot your password?
                                    </Link>
                                </div>
                            )}

                            {/* Terms and Privacy Reference */}
                            <div className="text-center text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-color)]">
                                By continuing, you agree to BotFusion's{" "}
                                <a
                                    href="/terms.html"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-[var(--primary-color)] underline"
                                >
                                    Terms of Service
                                </a>{" "}
                                and{" "}
                                <a
                                    href="/privacy.html"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-[var(--primary-color)] underline"
                                >
                                    Privacy Policy
                                </a>
                                .
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
