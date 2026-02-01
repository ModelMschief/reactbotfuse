"use client";

import { useState } from "react";
import { useAuth } from "@/store/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";

export default function PremiumPage() {
    const { user, redeemCode, isGlobalFireActive } = useAuth();
    const [code, setCode] = useState("");
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const handleRedeem = (e: React.FormEvent) => {
        e.preventDefault();
        const success = redeemCode(code);
        if (success) {
            setStatus("success");
            setCode("");
        } else {
            setStatus("error");
        }
        setTimeout(() => setStatus("idle"), 3000);
    };

    return (
        <div className="container py-12 relative overflow-hidden">
            {/* Fire Effect Overlay */}
            <AnimatePresence>
                {isGlobalFireActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] pointer-events-none flex items-end justify-center"
                    >
                        <div className="w-full h-full bg-gradient-to-t from-[var(--fire-red)]/40 via-[var(--fire-orange)]/20 to-transparent absolute bottom-0" />
                        <motion.div
                            initial={{ y: 100, scale: 0.8 }}
                            animate={{ y: 0, scale: 1.2 }}
                            className="text-9xl mb-20 drop-shadow-[0_0_50px_rgba(220,38,38,0.8)] filter blur-sm"
                        >
                            🔥
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-2xl mx-auto text-center space-y-8">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-[var(--fire-red)]/10 to-[var(--fire-orange)]/10 mb-4 border border-[var(--primary-color)]/20"
                >
                    <Image src="/android-chrome-192x192.png" alt="BotFusion Premium" width={80} height={80} className="drop-shadow-lg" />
                </motion.div>

                <h1 className="text-4xl font-bold">Unleash the Fire</h1>
                <p className="text-lg text-[var(--text-muted)]">
                    Upgrade to Premium to unlock advanced analytics, unlimited broadcasts, and priority support.
                </p>

                <div className="card max-w-md mx-auto mt-10">
                    <h3 className="font-bold mb-4">Have a Redemption Code?</h3>
                    <form onSubmit={handleRedeem} className="flex gap-3">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter code (e.g. redeem)"
                            className="input-field flex-1"
                        />
                        <button type="submit" className="btn btn-primary">
                            Apply
                        </button>
                    </form>

                    <AnimatePresence>
                        {status === "success" && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg flex items-center gap-2 justify-center text-sm font-semibold"
                            >
                                <CheckCircle size={16} /> Code Redeemed! Fire Mode Activated.
                            </motion.div>
                        )}
                        {status === "error" && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2 justify-center text-sm font-semibold"
                            >
                                <XCircle size={16} /> Invalid Code. Try 'redeem'.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-12">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]/50">
                            <div className="w-8 h-8 rounded-full bg-[var(--primary-color)]/10 flex items-center justify-center text-[var(--primary-color)] mb-3">
                                <CheckCircle size={16} />
                            </div>
                            <h4 className="font-bold text-sm mb-1">Feature {i}</h4>
                            <p className="text-xs text-[var(--text-muted)]">Enhanced capabilities for your automated workflow.</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
