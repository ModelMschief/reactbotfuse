import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Zap } from "lucide-react";

export function VersionChecker() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [newVersion, setNewVersion] = useState<string | null>(null);

    useEffect(() => {
        const checkVersion = async () => {
            try {
                // Fetch the version file with a cache-busting timestamp
                const timestamp = new Date().getTime();
                const res = await fetch(`/version.json?t=${timestamp}`, {
                    cache: 'no-store'
                });

                if (!res.ok) return;

                const data = await res.json();
                const fetchedVersion = data.version;
                if (!fetchedVersion) return;

                const localVersion = localStorage.getItem("app_version");

                if (!localVersion) {
                    // First time load or missing version, set it and continue
                    localStorage.setItem("app_version", fetchedVersion);
                } else if (localVersion !== fetchedVersion) {
                    // Mismatch means a new version is available
                    setNewVersion(fetchedVersion);
                    setUpdateAvailable(true);
                }
            } catch (err) {
                console.error("Failed to check app version:", err);
            }
        };

        // Check immediately on mount
        checkVersion();

        // Check every 60 seconds
        const interval = setInterval(checkVersion, 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleRefresh = () => {
        // Explicitly set the new version so the prompt clears
        if (newVersion) {
            localStorage.setItem("app_version", newVersion);
        }

        // Force fresh load of index.html by appending a query timestamp.
        // We carefully append it before the hash to protect HashRouter state, 
        // completely bypassing aggressive mobile HTML disk caches.
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("v", new Date().getTime().toString());
        window.location.replace(currentUrl.toString());
    };

    return (
        <AnimatePresence>
            {updateAvailable && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999]"
                >
                    <div
                        onClick={handleRefresh}
                        className="bg-[#050505] border border-[var(--primary-color)]/30 shadow-[0_0_30px_rgba(255,69,0,0.4)] rounded-full pl-5 pr-2 py-2 flex items-center gap-6 cursor-pointer hover:border-[var(--primary-color)] transition-colors group"
                    >
                        <div className="flex items-center gap-3 text-white font-semibold text-sm">
                            <Zap size={18} className="text-[var(--primary-color)] animate-pulse" />
                            New version available
                        </div>
                        <button className="bg-[var(--primary-color)] hover:bg-[var(--primary-dark)] text-black font-bold text-xs uppercase tracking-wider rounded-full px-4 py-2 transition-colors flex items-center gap-2">
                            Refresh <RefreshCw size={14} className="group-hover:animate-spin" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
