"use client";

import { useState } from "react";
import { useAuth } from "@/store/auth-context";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
    const [isSignup, setIsSignup] = useState(false);

    // Form State
    const [email, setEmail] = useState("s@s.com");
    const [password, setPassword] = useState("user");
    const [telegramId, setTelegramId] = useState("123");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const { login, signup } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        try {
            let success;

            if (isSignup) {
                if (!telegramId) {
                    setError("Telegram ID is required for signup.");
                    setIsLoading(false);
                    return;
                }
                // Mock Signup (usually we'd validate, but for prototype we just pass through)
                await signup(email, password, telegramId);
                success = true; // signup in auth-context mock always succeeds or we assume so
            } else {
                success = await login(email, password);
            }

            if (success) {
                router.push("/dashboard");
            } else {
                setError("Invalid credentials. Try s@s.com / user");
                setIsLoading(false);
            }
        } catch (err) {
            setError("An unexpected error occurred.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card w-full max-w-md bg-[var(--bg-surface)] border-[var(--border-color)] overflow-hidden"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--bg-app)] mb-4 shadow-sm border border-[var(--border-color)]">
                        <Image src="/apple-touch-icon.png" alt="BotFusion" width={60} height={60} className="rounded-xl" />
                    </div>
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
                                        placeholder="e.g. 123456789"
                                        required={isSignup}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn btn-primary mt-4"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                {isSignup ? "Sign Up" : "Sign In"} <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
                    {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button
                        type="button"
                        onClick={() => { setIsSignup(!isSignup); setError(""); }}
                        className="text-[var(--primary-color)] font-semibold hover:underline"
                    >
                        {isSignup ? "Log In" : "Sign up"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
