import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth-context";
import { ThemeToggle } from "./theme-toggle";
import { Menu, X, Shield, Key, Flame, BarChart3, LogOut, Sun, Home, User, Send, Zap, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import logo image
import appleTouchIcon from "/apple-touch-icon.png";

// Custom event for opening stats modal on mobile
export const openStatsModal = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("openStatsModal"));
    }
};

export function Navbar() {
    const { user, logout } = useAuth();
    const [isMobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const pathname = location.pathname;
    const drawerRef = useRef<HTMLDivElement>(null);

    // Close drawer when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
                setMobileOpen(false);
            }
        };

        if (isMobileOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            // Prevent body scroll when drawer is open
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = "";
        };
    }, [isMobileOpen]);

    // Close drawer on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Hide nav on login/forgot/reset pages
    if (pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password") return null;

    const links = [
        { href: "/dashboard", label: "Dashboard", icon: <Shield size={20} /> },
        { href: "/autoup", label: "AutoUp", icon: <Key size={20} /> },
        { href: "/premium", label: "Premium", icon: <Flame size={20} /> },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-app)]/80 backdrop-blur-md">
            <div className="container flex h-16 items-center justify-between">
                {/* Brand */}
                <Link to="/" className="flex items-center gap-2 font-bold text-xl text-[var(--primary-color)]">
                    <img src={appleTouchIcon} alt="BotFusion" width={32} height={32} className="rounded-md" />
                    <span>BotFusion</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {user && links.map((link) => (
                        <Link
                            key={link.href}
                            to={link.href}
                            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--primary-color)] ${pathname === link.href ? "text-[var(--primary-color)]" : "text-[var(--text-secondary)]"
                                }`}
                        >
                            {link.icon}
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Desktop Actions */}
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
                        <Link to="/login" className="btn btn-primary text-sm px-4 py-2 font-bold shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] transition-all">
                            Login or Sign Up
                        </Link>
                    )}
                </div>

                {/* Mobile Actions */}
                {user && (
                    <div className="md:hidden flex items-center gap-2">
                        {/* AutoUp Shortcut for Mobile */}
                        <Link
                            to="/autoup"
                            className="p-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                            title="AutoUp API"
                        >
                            <Key size={24} />
                        </Link>

                        <button
                            className="p-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            onClick={() => setMobileOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                            onClick={() => setMobileOpen(false)}
                        />

                        {/* Drawer Panel */}
                        <motion.div
                            ref={drawerRef}
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed top-0 right-0 bottom-0 z-50 w-[80%] max-w-xs bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-2xl md:hidden flex flex-col text-gray-900 dark:text-gray-100"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <img src={appleTouchIcon} alt="Menu" width={28} height={28} className="rounded-md" />
                                    <span className="font-bold text-lg">Menu</span>
                                </div>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                    aria-label="Close menu"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Navigation Links */}
                            <nav className="flex-1 overflow-y-auto p-2">
                                <ul className="space-y-1">
                                    <li>
                                        <Link
                                            to="/dashboard"
                                            onClick={() => setMobileOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === "/dashboard"
                                                ? "bg-orange-500/10 text-orange-600 dark:text-orange-500 font-semibold"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                                }`}
                                        >
                                            <Shield size={20} className={pathname === "/dashboard" ? "text-orange-500" : "text-gray-400"} />
                                            <span>Dashboard</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/premium"
                                            onClick={() => setMobileOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === "/premium"
                                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                                }`}
                                        >
                                            <Flame size={20} className={pathname === "/premium" ? "text-purple-500" : "text-gray-400"} />
                                            <span>Premium</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/autoup"
                                            onClick={() => setMobileOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === "/autoup"
                                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                                }`}
                                        >
                                            <Key size={20} className={pathname === "/autoup" ? "text-blue-500" : "text-gray-400"} />
                                            <span>AutoUp API</span>
                                        </Link>
                                    </li>
                                </ul>
                            </nav>

                            {/* Drawer Footer */}
                            <div className="border-t border-gray-200 dark:border-zinc-800 p-4 space-y-3 bg-gray-50 dark:bg-zinc-900/50">
                                {/* Theme Toggle Row */}
                                <div className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                        <Sun size={18} />
                                        <span className="text-sm">Theme</span>
                                    </div>
                                    <ThemeToggle />
                                </div>

                                {/* Logout Button */}
                                {user && (
                                    <button
                                        onClick={() => {
                                            logout();
                                            setMobileOpen(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--destructive)] hover:bg-red-500/10 rounded-lg transition-colors border border-[var(--border-color)]"
                                    >
                                        <LogOut size={18} />
                                        Logout
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}

