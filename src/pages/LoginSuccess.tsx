import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/store/auth-context";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import appleTouchIcon from "/apple-touch-icon.png";

export default function LoginSuccess() {
    const { loginWithToken } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const parseAuthParams = () => {
            let token: string | null = null;
            let completeProfile = false;
            let error: string | null = null;

            // 1. Try React Router location.search (standard query string)
            const searchParams = new URLSearchParams(location.search);
            token = searchParams.get("token");
            if (searchParams.get("complete_profile") === "true") {
                completeProfile = true;
            }
            error = searchParams.get("error");

            // 2. Fallback: Parse query params embedded within window.location.hash
            if (!token && window.location.hash.includes("?")) {
                const hashQuery = window.location.hash.substring(window.location.hash.indexOf("?"));
                const hashParams = new URLSearchParams(hashQuery);
                if (!token) token = hashParams.get("token");
                if (hashParams.get("complete_profile") === "true") completeProfile = true;
                if (!error) error = hashParams.get("error");
            }

            // 3. Fallback: Parse window.location.search directly
            if (!token && window.location.search) {
                const globalParams = new URLSearchParams(window.location.search);
                if (!token) token = globalParams.get("token");
                if (globalParams.get("complete_profile") === "true") completeProfile = true;
                if (!error) error = globalParams.get("error");
            }

            return { token, completeProfile, error };
        };

        const executeLogin = async () => {
            const { token, completeProfile, error } = parseAuthParams();

            if (error) {
                setStatus("error");
                setErrorMessage(
                    error === "oauth_denied"
                        ? "Google authentication was cancelled."
                        : error === "token_exchange_failed"
                        ? "Failed to exchange authorization code with Google."
                        : `Authentication error: ${error}`
                );
                return;
            }

            if (!token) {
                setStatus("error");
                setErrorMessage("No authentication token found in callback URL.");
                return;
            }

            try {
                await loginWithToken(token, completeProfile);
                setStatus("success");
                // Clean global window.location.search if present
                if (window.location.search) {
                    const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
                    window.history.replaceState({}, document.title, cleanUrl);
                }
                // Short delay for smooth visual transition
                setTimeout(() => {
                    navigate("/dashboard", { replace: true });
                }, 800);
            } catch (err) {
                console.error("Login success handling error:", err);
                setStatus("error");
                setErrorMessage("Failed to initialize session from authentication token.");
            }
        };

        executeLogin();
    }, [location, loginWithToken, navigate]);

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card w-full max-w-md bg-[var(--bg-surface)] border-[var(--border-color)] p-8 text-center shadow-2xl space-y-6"
            >
                <div className="flex justify-center">
                    <img src={appleTouchIcon} alt="BotFusion" width={48} height={48} className="rounded-xl shadow-md" />
                </div>

                {status === "loading" && (
                    <div className="space-y-4">
                        <Loader2 size={40} className="animate-spin text-[var(--primary-color)] mx-auto" />
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Authenticating with Google</h2>
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                                Verifying your credentials and establishing a secure session...
                            </p>
                        </div>
                    </div>
                )}

                {status === "success" && (
                    <div className="space-y-4">
                        <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Authentication Successful!</h2>
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                                Redirecting to your BotFusion dashboard...
                            </p>
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="space-y-4">
                        <AlertCircle size={40} className="text-red-500 mx-auto" />
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Authentication Failed</h2>
                            <p className="text-sm text-red-500 mt-1 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                                {errorMessage}
                            </p>
                        </div>
                        <div className="pt-2">
                            <Link to="/login" className="btn btn-primary w-full py-2.5 text-sm font-bold">
                                Return to Login
                            </Link>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
