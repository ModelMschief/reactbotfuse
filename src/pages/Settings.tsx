import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Settings() {
    const navigate = useNavigate();

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-[var(--bg-surface)] rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-3xl font-bold">Settings</h1>
            </div>

            <div className="card max-w-2xl mx-auto space-y-6">
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Account Settings</h2>
                    <p className="text-[var(--text-muted)]">Manage your account preferences and subscription.</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-[var(--border-color)] rounded-lg">
                        <div>
                            <h3 className="font-medium">Notifications</h3>
                            <p className="text-sm text-[var(--text-muted)]">Manage email and push notifications</p>
                        </div>
                        <button className="btn border border-[var(--border-color)] hover:bg-[var(--bg-surface)]">
                            Configure
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-[var(--border-color)] rounded-lg">
                        <div>
                            <h3 className="font-medium">API Keys</h3>
                            <p className="text-sm text-[var(--text-muted)]">Manage your API keys for integrations</p>
                        </div>
                        <button className="btn border border-[var(--border-color)] hover:bg-[var(--bg-surface)]">
                            Manage Keys
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
