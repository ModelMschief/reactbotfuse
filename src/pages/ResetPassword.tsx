import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const token = searchParams.get("token");

    // Check if token exists
    useEffect(() => {
        if (!token) {
            setError("Invalid reset link. Please request a new password reset.");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        // Validate password length
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            await api.post("/reset-password", {
                token,
                new_password: newPassword
            });
            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            const message = axiosErr?.response?.data?.error || "Failed to reset password";
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
                        <h2 className="text-2xl font-bold mb-4">Password Reset Successful!</h2>
                        <p className="text-[var(--text-muted)] mb-6">
                            Your password has been changed. Redirecting to login...
                        </p>
                        <div className="flex items-center justify-center gap-2 text-[var(--primary-color)]">
                            <Loader2 className="animate-spin" size={18} />
                            <span>Redirecting...</span>
                        </div>
                    </div>
                ) : !token ? (
                    /* No Token Error State */
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8 text-center">
                        <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Invalid Reset Link</h2>
                        <p className="text-[var(--text-muted)] mb-6">
                            This reset link is invalid or has expired. Please request a new password reset.
                        </p>
                        <Link
                            to="/forgot-password"
                            className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
                        >
                            Request New Reset Link
                        </Link>
                    </div>
                ) : (
                    /* Reset Form */
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8">
                        <div className="text-center mb-8">
                            <div className="w-12 h-12 bg-[var(--primary-color)]/10 text-[var(--primary-color)] rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock size={24} />
                            </div>
                            <h1 className="text-2xl font-bold mb-2">Reset Your Password</h1>
                            <p className="text-[var(--text-muted)]">
                                Enter your new password below
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 ml-1">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 ml-1">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1 ml-1">
                                    Enter the same password again
                                </p>
                            </div>

                            {/* Password match indicator */}
                            {confirmPassword && (
                                <div className={`text-sm flex items-center gap-2 ${newPassword === confirmPassword
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }`}>
                                    {newPassword === confirmPassword ? (
                                        <>
                                            <CheckCircle size={16} />
                                            Passwords match
                                        </>
                                    ) : (
                                        <>
                                            <XCircle size={16} />
                                            Passwords do not match
                                        </>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="text-red-500 text-sm text-center font-medium bg-red-500/10 p-2 rounded">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || newPassword !== confirmPassword}
                                className="btn btn-primary w-full py-3 text-base font-bold flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        <Lock size={18} />
                                        Reset Password
                                    </>
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
