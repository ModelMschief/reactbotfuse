import { useState } from "react";
import { Send, AlertTriangle, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/store/auth-context";

export function TelegramCompletionBanner() {
    const { user, setShowTelegramModal } = useAuth();
    const [dismissed, setDismissed] = useState(() => {
        return sessionStorage.getItem("tg_banner_dismissed") === "true";
    });

    if (!user || user.telegramVerified || dismissed) {
        return null;
    }

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem("tg_banner_dismissed", "true");
    };

    return (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-red-500/15 border-b border-amber-500/30 text-[var(--text-primary)] px-4 py-3 relative z-30">
            <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3 text-center sm:text-left">
                    <div className="p-1.5 bg-amber-500/20 text-amber-500 rounded-lg shrink-0 hidden sm:flex">
                        <AlertTriangle size={18} />
                    </div>
                    <div>
                        <span className="font-semibold text-amber-500 mr-2">Complete your profile:</span>
                        <span className="text-[var(--text-secondary)]">
                            Connect your Telegram account to enable bot fleet management, security alerts, and broadcasts.
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowTelegramModal(true)}
                        className="btn text-xs py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                    >
                        <Send size={13} />
                        <span>Connect Telegram</span>
                        <ChevronRight size={13} />
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md hover:bg-white/10 transition-colors"
                        aria-label="Dismiss banner"
                        title="Dismiss notification"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TelegramCompletionBanner;
