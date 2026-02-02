import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Check, Gift, Loader2 } from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { api } from "@/lib/api";
import { AxiosError } from "axios";

interface Plan {
    id: string;
    title: string;
    price: string;
    duration: string;
    features: string[];
    highlight: boolean;
    color?: string;
}

export default function Premium() {
    const { plan, refresh } = useDashboard();

    const [redeemCode, setRedeemCode] = useState("");
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [requestingPackage, setRequestingPackage] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const isPremium = plan.type === 'premium';

    // Exact plans as requested
    const PLANS: Plan[] = [
        {
            id: "1m",
            title: "Starter",
            price: "₹79",
            duration: "1 Month",
            features: ["Unlimited Bots", "Unlimited Users", "Priority Support"],
            highlight: false
        },
        {
            id: "1y",
            title: "Best Value",
            price: "₹559",
            duration: "1 Year",
            features: ["Unlimited Bots", "Unlimited Users", "Priority Support", "Save 40%"],
            highlight: true, // Gold style
            color: "text-yellow-400"
        },
        {
            id: "3m",
            title: "Quarterly",
            price: "₹160",
            duration: "3 Months",
            features: ["Unlimited Bots", "Unlimited Users", "Priority Support"],
            highlight: false
        }
    ];

    const handleRedeem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!redeemCode) return;
        setIsRedeeming(true);
        setFeedback(null);

        try {
            await api.post("/redeem-code", { code: redeemCode.trim().toUpperCase() });
            setFeedback({ type: 'success', message: 'Premium activated! Redirecting...' });
            setRedeemCode("");
            refresh();
        } catch (err: unknown) {
            const axiosErr = err as AxiosError<{ error?: string }>;
            setFeedback({ type: 'error', message: axiosErr.response?.data?.error || "Invalid Code" });
        } finally {
            setIsRedeeming(false);
        }
    };

    const handleRequestPremium = async (pkgCode: string) => {
        if (!confirm(`Request the ${pkgCode} plan? Admin will contact you.`)) return;

        setRequestingPackage(pkgCode);
        setFeedback(null);
        try {
            // Sending simple code as requested: 1m, 1y, 3m
            await api.post("/request-premium", { package: pkgCode });
            setFeedback({ type: 'success', message: `Request sent! Check your Telegram/Email.` });
        } catch (err: unknown) {
            const axiosErr = err as AxiosError<{ error?: string }>;
            setFeedback({ type: 'error', message: axiosErr.response?.data?.error || "Error requesting plan" });
        } finally {
            setRequestingPackage(null);
        }
    };

    return (
        <div className="container max-w-5xl py-12 space-y-12">

            {/* Hero Section */}
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-block p-4 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-yellow-500/30 mb-4"
                >
                    <Crown size={48} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-600">
                    Unlock Full Power
                </h1>
                <p className="text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
                    Scale your operation with unlimited broadcasts, faster speeds, and priority support.
                </p>
            </div>

            {feedback && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl text-center font-bold border ${feedback.type === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-500'
                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}
                >
                    {feedback.message}
                </motion.div>
            )}

            {/* Plan Status */}
            {isPremium ? (
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Crown size={120} />
                    </div>
                    <h2 className="text-2xl font-bold text-yellow-400 mb-2">You are a Premium Member</h2>
                    <p className="text-[var(--text-muted)]">Your plan is active and valid.</p>
                    {plan.expiry && <p className="text-sm mt-2 font-mono">Expires: {new Date(plan.expiry).toLocaleDateString()}</p>}
                </div>
            ) : (
                /* Pricing Cards - Custom Order: Starter, Best Value, Quarterly */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Starter */}
                    <PricingCard plan={PLANS[0]} onRequest={handleRequestPremium} loadingId={requestingPackage} />

                    {/* Best Value (Middle, Gold) */}
                    <PricingCard plan={PLANS[1]} onRequest={handleRequestPremium} loadingId={requestingPackage} />

                    {/* Quarterly */}
                    <PricingCard plan={PLANS[2]} onRequest={handleRequestPremium} loadingId={requestingPackage} />
                </div>
            )}

            {/* Redeem Section */}
            <div className="max-w-md mx-auto">
                <div className="card bg-[var(--bg-surface)] border-[var(--border-color)] p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Gift className="text-[var(--primary-color)]" />
                        <h3 className="text-lg font-bold">Have a Promo Code?</h3>
                    </div>
                    <form onSubmit={handleRedeem} className="flex gap-2">
                        <input
                            type="text"
                            id="redeem-code"
                            placeholder="ENTER CODE"
                            className="input-field font-mono uppercase"
                            value={redeemCode}
                            onChange={(e) => setRedeemCode(e.target.value)}
                        />
                        <button type="submit" disabled={isRedeeming} className="btn btn-primary min-w-[100px]">
                            {isRedeeming ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Redeem"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function PricingCard({ plan, onRequest, loadingId }: { plan: Plan, onRequest: (id: string) => void, loadingId: string | null }) {
    const isGold = plan.highlight;

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`relative p-6 rounded-2xl border flex flex-col ${isGold
                ? 'bg-[var(--bg-surface)] border-yellow-500/50 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                : 'bg-[var(--bg-surface)] border-[var(--border-color)]'
                }`}
        >
            <h3 className={`text-xl font-bold mb-2 ${isGold ? 'text-yellow-400' : ''}`}>
                {plan.title}
            </h3>
            <div className="text-3xl font-bold mb-1">{plan.price}</div>
            <div className="text-[var(--text-muted)] text-sm font-bold uppercase tracking-wider mb-6">{plan.duration}</div>

            <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                        <Check size={16} className={isGold ? "text-yellow-400" : "text-[var(--primary-color)]"} />
                        {f}
                    </li>
                ))}
            </ul>

            <button
                onClick={() => onRequest(plan.id)}
                disabled={loadingId !== null}
                className={`btn w-full font-bold ${isGold
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-none hover:shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                    : 'bg-[var(--bg-app)] border border-[var(--border-color)] hover:border-[var(--primary-color)]'
                    }`}
            >
                {loadingId === plan.id ? <Loader2 className="animate-spin mx-auto" /> : "Request Plan"}
            </button>
        </motion.div>
    )
}
