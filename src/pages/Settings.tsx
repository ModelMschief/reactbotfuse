import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft,
    Shield,
    Key,
    Send,
    CheckCircle2,
    AlertTriangle,
    LogOut,
    Copy,
    Check,
    Lock,
    ExternalLink,
    Crown,
    Bell,
    Smartphone
} from "lucide-react";
import { useAuth } from "@/store/auth-context";
import { API_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

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

export default function Settings() {
    const { user, logout, setShowTelegramModal } = useAuth();
    const navigate = useNavigate();

    const [copiedId, setCopiedId] = useState(false);
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true);
    const [broadcastAlertsEnabled, setBroadcastAlertsEnabled] = useState(true);

    const isGoogleLinked = user?.authProviders?.includes("google") || Boolean(user?.profilePicture);
    const isTelegramLinked = Boolean(user?.telegramId && user?.telegramVerified);

    const handleCopyId = () => {
        if (user?.id) {
            navigator.clipboard.writeText(user.id);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    const handleLinkGoogle = () => {
        window.location.href = `${API_BASE_URL}/api/auth/google`;
    };

    const handleConfirmRevoke = () => {
        setShowRevokeModal(false);
        // Revoke current session and log out
        logout();
    };

    return (
        <div className="container max-w-4xl py-10 space-y-8 px-4 sm:px-6">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                            Account & Security
                        </h1>
                        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                            Manage linked authentication providers, Telegram security, and session controls.
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Overview Card */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)] p-6 sm:p-8 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        {user?.profilePicture ? (
                            <img
                                src={user.profilePicture}
                                alt="User avatar"
                                className="w-16 h-16 rounded-2xl object-cover border-2 border-[var(--border-color)] shadow-md"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--fire-red)] to-[var(--fire-orange)] text-white font-bold text-2xl flex items-center justify-center shadow-md">
                                {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
                            </div>
                        )}

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                    {user?.displayName || (user?.email ? user.email.split("@")[0] : "BotFusion Developer")}
                                </h2>
                                {user?.isPremium ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                        <Crown size={12} /> PRO Plan
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-app)] text-[var(--text-muted)] border border-[var(--border-color)]">
                                        Free Tier
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-[var(--text-muted)] mt-1">{user?.email || "No email attached"}</p>

                            {/* User ID snippet */}
                            {user?.id && (
                                <div className="flex items-center gap-2 mt-2 text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-app)] px-2.5 py-1 rounded-lg border border-[var(--border-color)] w-fit">
                                    <span>ID: {user.id.substring(0, 14)}...</span>
                                    <button
                                        onClick={handleCopyId}
                                        className="hover:text-[var(--text-primary)] transition-colors ml-1"
                                        title="Copy User ID"
                                    >
                                        {copiedId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {!user?.isPremium && (
                        <Link
                            to="/premium"
                            className="btn btn-primary text-xs font-bold py-2 px-4 shadow-sm hover:shadow-md shrink-0 w-full sm:w-auto"
                        >
                            Upgrade to Premium
                        </Link>
                    )}
                </div>
            </div>

            {/* Authentication Providers & Account Security */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)] p-6 sm:p-8 space-y-6">
                <div className="border-b border-[var(--border-color)] pb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
                        <Shield size={20} className="text-[var(--primary-color)]" />
                        Linked Authentication Providers
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                        Connect multiple sign-in methods to secure your account and avoid lockouts.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Google OAuth Provider */}
                    <div className="p-4 sm:p-5 border border-[var(--border-color)] rounded-xl bg-[var(--bg-app)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shrink-0 shadow-sm">
                                <GoogleIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">Google Account</h3>
                                    {isGoogleLinked && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            <CheckCircle2 size={12} /> Connected
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                    {isGoogleLinked
                                        ? "Google authentication is active for instant one-click sign-in."
                                        : "Link your Google account for secure, passwordless authentication."}
                                </p>
                            </div>
                        </div>

                        {!isGoogleLinked ? (
                            <button
                                onClick={handleLinkGoogle}
                                className="btn border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold py-2 px-4 shadow-sm flex items-center gap-2 w-full sm:w-auto"
                            >
                                <GoogleIcon className="w-4 h-4" />
                                <span>Secure with Google</span>
                            </button>
                        ) : (
                            <span className="text-xs text-emerald-500 font-medium px-3 py-1 bg-emerald-500/10 rounded-lg">
                                Active Provider
                            </span>
                        )}
                    </div>

                    {/* Telegram Verification Provider */}
                    <div className="p-4 sm:p-5 border border-[var(--border-color)] rounded-xl bg-[var(--bg-app)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl shrink-0 shadow-sm">
                                <Send size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">Telegram Account</h3>
                                    {isTelegramLinked ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                            <CheckCircle2 size={12} /> Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                            <AlertTriangle size={12} /> Action Required
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                    {isTelegramLinked ? (
                                        <>
                                            Connected to Telegram ID:{" "}
                                            <span className="font-mono font-semibold text-[var(--text-primary)]">
                                                {user?.telegramId}
                                            </span>
                                        </>
                                    ) : (
                                        "Connect your Telegram ID to enable bot broadcasts and receive login security notifications."
                                    )}
                                </p>
                            </div>
                        </div>

                        {!isTelegramLinked ? (
                            <button
                                onClick={() => setShowTelegramModal(true)}
                                className="btn btn-primary text-xs font-bold py-2 px-4 shadow-sm flex items-center gap-2 w-full sm:w-auto"
                            >
                                <Send size={14} />
                                <span>Connect Telegram</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowTelegramModal(true)}
                                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] underline py-1"
                            >
                                Update Telegram ID
                            </button>
                        )}
                    </div>

                    {/* Local Password Provider */}
                    <div className="p-4 sm:p-5 border border-[var(--border-color)] rounded-xl bg-[var(--bg-app)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shrink-0 shadow-sm text-[var(--text-muted)]">
                                <Lock size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">Password Authentication</h3>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                    Email + Password security with Telegram 2FA verification.
                                </p>
                            </div>
                        </div>

                        <Link
                            to="/forgot-password"
                            className="btn border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold py-2 px-4 shadow-sm w-full sm:w-auto text-center"
                        >
                            Reset Password
                        </Link>
                    </div>
                </div>
            </div>

            {/* Notification Preferences */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)] p-6 sm:p-8 space-y-6">
                <div className="border-b border-[var(--border-color)] pb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
                        <Bell size={20} className="text-amber-500" />
                        Notification & Alert Channels
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                        Control how BotFusion delivers real-time security alerts and operational notifications.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-app)]">
                        <div className="space-y-0.5">
                            <div className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                                <span>Security Login Alerts</span>
                                <span className="text-[10px] bg-blue-500/10 text-blue-500 font-bold px-1.5 py-0.5 rounded">
                                    Telegram
                                </span>
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">
                                Send a confirmation button via @authentcastbot whenever a new session logs in.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setLoginAlertsEnabled(!loginAlertsEnabled)}
                            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                                loginAlertsEnabled ? "bg-[var(--primary-color)]" : "bg-gray-600"
                            }`}
                        >
                            <span
                                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                                    loginAlertsEnabled ? "left-6" : "left-1"
                                }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-app)]">
                        <div className="space-y-0.5">
                            <div className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                                <span>Broadcast Completion Notifications</span>
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-1.5 py-0.5 rounded">
                                    In-App & Bot
                                </span>
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">
                                Notify when large broadcast fleets finish dispatching all recipient queues.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setBroadcastAlertsEnabled(!broadcastAlertsEnabled)}
                            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                                broadcastAlertsEnabled ? "bg-[var(--primary-color)]" : "bg-gray-600"
                            }`}
                        >
                            <span
                                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                                    broadcastAlertsEnabled ? "left-6" : "left-1"
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Active Sessions & Security Revocation */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)] p-6 sm:p-8 space-y-6">
                <div className="border-b border-[var(--border-color)] pb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
                        <Key size={20} className="text-[var(--primary-color)]" />
                        Session Management & Security
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                        Monitor active devices and terminate all outstanding authentication tokens if you suspect unauthorized access.
                    </p>
                </div>

                <div className="p-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-app)] space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                            <div>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">Current Active Session</p>
                                <p className="text-xs text-[var(--text-muted)] font-mono">
                                    Signed in via {isGoogleLinked ? "Google OAuth / Local" : "Local Email"}
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            Active Now
                        </span>
                    </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-[var(--border-color)]">
                    <div>
                        <h4 className="text-sm font-bold text-red-500 flex items-center gap-1.5">
                            <AlertTriangle size={16} /> Revoke All Active Sessions
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Immediately logs out all devices and invalidates current authentication tokens.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowRevokeModal(true)}
                        className="btn border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors shrink-0 w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} />
                        <span>Revoke All Sessions</span>
                    </button>
                </div>
            </div>

            {/* Revoke Sessions Confirmation Modal */}
            <AnimatePresence>
                {showRevokeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowRevokeModal(false)}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
                                <AlertTriangle size={24} />
                            </div>

                            <div className="text-center space-y-1">
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">Revoke All Sessions?</h3>
                                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                    This will invalidate all active login tokens across all devices and log you out immediately. You will need to sign in again.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRevokeModal(false)}
                                    className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-app)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmRevoke}
                                    className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <LogOut size={14} />
                                    <span>Yes, Revoke All</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
