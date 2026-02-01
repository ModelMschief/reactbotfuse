"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/store/auth-context";
import { ThemeToggle } from "./theme-toggle";
import { Menu, X, Shield, Key, Flame } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function Navbar() {
    const { user, logout } = useAuth();
    const [isMobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    // Hide nav on login page usually, but for prototype we can keep it or conditional render
    if (pathname === "/login") return null;

    const links = [
        { href: "/dashboard", label: "Dashboard", icon: <Shield size={18} /> },
        { href: "/autoup", label: "AutoUp", icon: <Key size={18} /> },
        { href: "/premium", label: "Premium", icon: <Flame size={18} /> },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-app)]/80 backdrop-blur-md">
            <div className="container flex h-16 items-center justify-between">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[var(--primary-color)]">
                    <Image src="/apple-touch-icon.png" alt="BotFusion" width={32} height={32} className="rounded-md" />
                    <span>BotFusion</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {user && links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--primary-color)] ${pathname === link.href ? "text-[var(--primary-color)]" : "text-[var(--text-secondary)]"
                                }`}
                        >
                            {link.icon}
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <ThemeToggle />

                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] px-3 py-1.5 rounded-full">
                                <span className="font-semibold">{user.email}</span>
                                {user.isPremium && (
                                    <span title="Premium User" className="flex items-center text-lg">
                                        🔥
                                    </span>
                                )}
                            </div>
                            <button onClick={logout} className="text-sm text-[var(--text-muted)] hover:text-[var(--destructive)]">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link href="/login" className="btn btn-primary text-sm px-4 py-2 font-bold shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] transition-all">
                            Login or Sign Up
                        </Link>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-[var(--text-primary)]"
                    onClick={() => setMobileOpen(true)}
                >
                    <Menu />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 20 }}
                        className="fixed inset-0 z-50 bg-[var(--bg-app)] flex flex-col p-6 md:hidden"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-2xl font-bold flex items-center gap-2">
                                <Image src="/apple-touch-icon.png" alt="Menu" width={32} height={32} className="rounded-md" /> Menu
                            </span>
                            <button onClick={() => setMobileOpen(false)} className="p-2 bg-[var(--bg-surface)] rounded-full border border-[var(--border-color)]">
                                <X />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {user && links.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="p-4 text-lg font-medium border border-[var(--border-color)] rounded-xl bg-[var(--bg-surface)] flex items-center gap-3 active:scale-95 transition-transform"
                                >
                                    <span className="text-[var(--primary-color)]">{link.icon}</span>
                                    {link.label}
                                </Link>
                            ))}

                            {!user && (
                                <Link
                                    href="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="p-4 text-lg font-medium border border-[var(--border-color)] rounded-xl bg-[var(--primary-color)] text-white flex items-center justify-center gap-3 active:scale-95 transition-transform"
                                >
                                    Login or Sign Up
                                </Link>
                            )}

                            <div className="mt-8 border-t border-[var(--border-color)] pt-8 flex justify-between items-center">
                                <span className="text-[var(--text-muted)]">Theme</span>
                                <ThemeToggle />
                            </div>

                            {user && (
                                <button onClick={() => { logout(); setMobileOpen(false); }} className="mt-4 btn btn-ghost w-full border border-[var(--border-color)] text-[var(--text-muted)]">
                                    Logout
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
