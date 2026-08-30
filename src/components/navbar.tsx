import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth-context";
import { ThemeToggle } from "./theme-toggle";
import { Shield, Key, Crown, Menu, X, LogOut, Bot, BookOpen } from "lucide-react";
import { useState } from "react";

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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const pathname = location.pathname;

    // Hide nav on login/forgot/reset pages
    if (pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password") return null;

    const links = [
        { href: "/dashboard", label: "Dashboard (API)", icon: <Key size={20} /> },
        { href: "/manage-bots", label: "Manage & Broadcast (Bot)", icon: <Bot size={20} /> },
    ];

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-app)]/80 backdrop-blur-md">
                <div className="container flex h-16 items-center justify-between">

                    {/* Left: Burger (mobile only) + Brand */}
                    <div className="flex items-center gap-1">
                        {user && (
                            <button
                                className="md:hidden p-2 -ml-2 text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors"
                                onClick={() => setSidebarOpen(true)}
                                aria-label="Open menu"
                            >
                                <Menu size={22} />
                            </button>
                        )}
                        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-[var(--primary-color)]">
                            <img src={appleTouchIcon} alt="BotFusion" width={32} height={32} className="rounded-md" />
                            <span>BotFusion</span>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        {user && pathname !== "/" && (
                            <>
                                {links.map((link) => (
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
                                <Link
                                    to="/pay"
                                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--primary-color)] ${pathname === "/pay" ? "text-[var(--primary-color)]" : "text-[var(--text-secondary)]"}`}
                                >
                                    <Shield size={20} />
                                    Payment Gateway
                                </Link>
                                <Link
                                    to="/docs"
                                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--primary-color)] ${pathname === "/docs" ? "text-[var(--primary-color)]" : "text-[var(--text-secondary)]"}`}
                                >
                                    <BookOpen size={20} />
                                    Docs
                                </Link>
                                <Link
                                    to="/premium"
                                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80 ${pathname === "/premium" ? "underline underline-offset-4" : ""}`}
                                    style={{
                                        color: "#f59e0b",
                                        textShadow: "0 0 10px rgba(245, 158, 11, 0.5)",
                                    }}
                                >
                                    <Crown size={20} style={{ filter: "drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))" }} />
                                    Get Premium
                                </Link>
                            </>
                        )}
                        {!user && (
                            <Link
                                to="/docs"
                                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--primary-color)] ${pathname === "/docs" ? "text-[var(--primary-color)]" : "text-[var(--text-secondary)]"}`}
                            >
                                <BookOpen size={20} />
                                Documentation
                            </Link>
                        )}
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
                </div>
            </header>

            {/* Mobile Sidebar — rendered always when logged in, animated via CSS translate */}
            {user && (
                <>
                    {/* Backdrop */}
                    <div
                        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                            }`}
                        onClick={() => setSidebarOpen(false)}
                    />

                    {/* Sidebar Panel */}
                    <div
                        className={`fixed top-0 left-0 bottom-0 z-[70] w-72 bg-[var(--bg-surface)] border-r border-[var(--border-color)] shadow-2xl md:hidden flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                            }`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                            <div className="flex items-center gap-2">
                                <img src={appleTouchIcon} alt="BotFusion" width={28} height={28} className="rounded-md" />
                                <span className="font-bold text-lg text-[var(--primary-color)]">BotFusion</span>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors"
                                aria-label="Close menu"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                            <Link
                                to="/dashboard"
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === "/dashboard"
                                    ? "bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-semibold"
                                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                                    }`}
                            >
                                <Key size={20} />
                                <span>Dashboard (API)</span>
                            </Link>

                            <Link
                                to="/manage-bots"
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === "/manage-bots"
                                    ? "bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-semibold"
                                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                                    }`}
                            >
                                <Bot size={20} />
                                <span>Manage & Broadcast (Bot)</span>
                            </Link>

                            <Link
                                to="/pay"
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === "/pay" ? "bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-semibold" : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"}`}
                            >
                                <Shield size={20} />
                                <span>Payment Gateway</span>
                            </Link>

                            <Link
                                to="/docs"
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === "/docs" ? "bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-semibold" : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"}`}
                            >
                                <BookOpen size={20} />
                                <span>Documentation</span>
                            </Link>

                            <Link
                                to="/premium"
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-semibold ${pathname === "/premium" ? "bg-yellow-500/10" : "hover:bg-yellow-500/5"
                                    }`}
                                style={{
                                    color: "#f59e0b",
                                    textShadow: "0 0 10px rgba(245, 158, 11, 0.5), 0 0 20px rgba(245, 158, 11, 0.3)",
                                }}
                            >
                                <Crown size={20} style={{ filter: "drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))" }} />
                                <span>Get Premium</span>
                            </Link>
                        </nav>

                        {/* Footer */}
                        <div className="border-t border-[var(--border-color)] p-4 space-y-3">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-sm text-[var(--text-muted)]">Theme</span>
                                <ThemeToggle />
                            </div>
                            <button
                                onClick={() => {
                                    logout();
                                    setSidebarOpen(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-[var(--border-color)]"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
