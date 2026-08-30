import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Crown, 
    Check, 
    Gift, 
    Loader2, 
    QrCode, 
    Shield, 
    Copy, 
    X,
    Sparkles,
    AlertTriangle,
    ShieldCheck,
    CheckCircle2,
    RefreshCw
} from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { api } from "@/lib/api";
import { AxiosError } from "axios";
import { QRCode } from "@/components/QRCode";
import { CryptoPaymentModal } from "@/components/CryptoPaymentModal";
import { useToast } from "@/components/Toast";

interface Plan {
    id: string;
    title: string;
    price: string;
    duration: string;
    features: string[];
    highlight: boolean;
    color?: string;
}

const PLANS: Plan[] = [
    {
        id: "1m",
        title: "Starter",
        price: "$1.00",
        duration: "1 Month",
        features: ["Unlimited Bots", "Unlimited Users", "Priority Support"],
        highlight: false
    },
    {
        id: "1y",
        title: "Best Value",
        price: "$7.00",
        duration: "1 Year",
        features: ["Unlimited Bots", "Unlimited Users", "Priority Support", "Save 40%"],
        highlight: true, // Gold style
        color: "text-yellow-600 dark:text-yellow-400"
    },
    {
        id: "3m",
        title: "Quarterly",
        price: "$2.00",
        duration: "3 Months",
        features: ["Unlimited Bots", "Unlimited Users", "Priority Support"],
        highlight: false
    }
];

const STORAGE_KEY = "bf_premium_pending_invoice";

export default function Premium() {
    const { plan, refresh } = useDashboard();
    const toast = useToast();

    const [redeemCode, setRedeemCode] = useState("");
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Modal State
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'admin' | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    
    // Invoice State
    const [isGenerating, setIsGenerating] = useState(false);
    const [invoice, setInvoice] = useState<{ tempAddress: string, amount: string, invoiceId: string } | null>(null);
    const [isVerified, setIsVerified] = useState(false);

    const isPremium = plan.type === 'premium';

    // Poll for premium status when waiting for invoice
    useEffect(() => {
        if (invoice && !isPremium) {
            const interval = setInterval(() => {
                refresh();
            }, 5000);
            return () => clearInterval(interval);
        }
        if (invoice && isPremium) {
            setIsVerified(true);
            toast.success('Payment Received! Premium Membership Activated.', 'Upgraded!');
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [invoice, isPremium, refresh]);

    // Restore persistent invoice on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                const now = Date.now();
                // Check if less than 10 minutes (600,000 ms) old
                if (now - data.timestamp < 600000) {
                    const foundPlan = PLANS.find(p => p.id === data.selectedPlanId);
                    if (foundPlan) {
                        setSelectedPlan(foundPlan);
                        setPaymentMethod('crypto');
                        setTermsAccepted(true);
                        setInvoice(data.invoice);
                    }
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                }
            } catch (e) {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    const handleRedeem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!redeemCode.trim()) return;
        setIsRedeeming(true);
        setFeedback(null);

        try {
            await api.post("/redeem-code", { code: redeemCode.trim().toUpperCase() });
            toast.success('Premium activated! Welcome to BotFusion Premium.', 'Code Redeemed');
            setFeedback({ type: 'success', message: 'Premium activated! Refreshing...' });
            setRedeemCode("");
            refresh();
        } catch (err: unknown) {
            const axiosErr = err as AxiosError<{ error?: string }>;
            const msg = axiosErr.response?.data?.error || "Invalid Promo Code";
            toast.error(msg, 'Redemption Failed');
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsRedeeming(false);
        }
    };

    const handleRequestAdmin = async () => {
        if (!selectedPlan) return;
        setIsGenerating(true);
        try {
            await api.post("/request-premium", { package: selectedPlan.id });
            toast.success(`Request sent! Check your Telegram for manual instructions.`, 'Request Dispatched');
            setFeedback({ type: 'success', message: `Request sent! Check your Telegram Account.` });
            setSelectedPlan(null);
            setPaymentMethod(null);
        } catch (err: unknown) {
            const axiosErr = err as AxiosError<{ error?: string }>;
            const msg = axiosErr.response?.data?.error || "Error requesting plan";
            toast.error(msg, 'Request Error');
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateCryptoInvoice = async () => {
        if (!selectedPlan || !termsAccepted) return;
        setIsGenerating(true);
        try {
            const res = await api.post("/crypto/upgrade/botfusion", { package: selectedPlan.id });
            const newInvoice = {
                tempAddress: res.data.tempWallet.address,
                amount: res.data.invoice.amount,
                invoiceId: res.data.invoice.invoiceId
            };
            setInvoice(newInvoice);
            setIsVerified(false);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                timestamp: Date.now(),
                selectedPlanId: selectedPlan.id,
                invoice: newInvoice
            }));
            toast.info(`Invoice ready: ${newInvoice.amount} USDT on BEP-20`, 'Payment Session');
        } catch (err: unknown) {
            const axiosErr = err as AxiosError<{ error?: string }>;
            const msg = axiosErr.response?.data?.error || "Payment gateway unavailable";
            toast.error(msg, 'Gateway Error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCheckStatus = async () => {
        try {
            await refresh();
            return isPremium;
        } catch (e) {
            console.error('Status poll error:', e);
        }
        return false;
    };

    const closeModal = () => {
        setSelectedPlan(null);
        setPaymentMethod(null);
        setTermsAccepted(false);
        setInvoice(null);
        setIsVerified(false);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <div className="container max-w-5xl py-8 sm:py-12 space-y-10 sm:space-y-12 relative px-4">

            {/* Hero Section */}
            <div className="text-center space-y-3 sm:space-y-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-block p-4 rounded-3xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-yellow-500/30 mb-2 shadow-lg shadow-yellow-500/10"
                >
                    <Crown size={44} className="text-yellow-500 dark:text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                </motion.div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-600">
                    Unlock Full Power
                </h1>
                <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
                    Scale your bot operations with unlimited broadcasts, high-speed delivery, priority support, and non-custodial crypto checkout.
                </p>
            </div>

            {feedback && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl text-center text-sm font-semibold border ${feedback.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}
                >
                    {feedback.message}
                </motion.div>
            )}

            {/* Plan Status */}
            {isPremium ? (
                <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-500/30 rounded-3xl p-8 text-center relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Crown size={120} />
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold uppercase tracking-wider mb-3">
                        <Sparkles size={14} /> Active Subscription
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-yellow-500 dark:text-yellow-400 mb-2">
                        You are a Premium Member
                    </h2>
                    <p className="text-[var(--text-muted)] text-sm">Your account has full access to all unlimited features and priority pipelines.</p>
                    {plan.expiry && (
                        <p className="text-xs sm:text-sm mt-3 font-mono text-slate-300">
                            Expires: <strong>{new Date(plan.expiry).toLocaleDateString(undefined, { dateStyle: 'long' })}</strong>
                        </p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
                    <PricingCard plan={PLANS[0]} onSelect={() => { setSelectedPlan(PLANS[0]); setPaymentMethod(null); }} />
                    <PricingCard plan={PLANS[1]} onSelect={() => { setSelectedPlan(PLANS[1]); setPaymentMethod(null); }} />
                    <PricingCard plan={PLANS[2]} onSelect={() => { setSelectedPlan(PLANS[2]); setPaymentMethod(null); }} />
                </div>
            )}

            {/* Redeem Promo Code Section */}
            <div className="max-w-md mx-auto">
                <div className="card bg-[var(--bg-surface)] border-[var(--border-color)] p-6 space-y-4 rounded-2xl shadow-md">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
                            <Gift size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-[var(--text-primary)]">Have a Promo Code?</h3>
                            <p className="text-xs text-[var(--text-muted)]">Redeem gifted subscriptions or voucher keys.</p>
                        </div>
                    </div>
                    <form onSubmit={handleRedeem} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="ENTER CODE"
                            className="input-field font-mono uppercase text-sm rounded-xl"
                            value={redeemCode}
                            onChange={(e) => setRedeemCode(e.target.value)}
                        />
                        <button type="submit" disabled={isRedeeming} className="btn btn-primary min-w-[100px] text-xs font-bold rounded-xl">
                            {isRedeeming ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Redeem"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Payment Method Selection & Checkout Modal */}
            <AnimatePresence>
                {selectedPlan && !invoice && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-slate-100 my-auto"
                        >
                            <button 
                                onClick={closeModal} 
                                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="p-6 border-b border-slate-800">
                                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                                    <Crown size={15} /> Checkout
                                </div>
                                <h2 className="text-2xl font-extrabold text-white">Get {selectedPlan.title}</h2>
                                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                                    {selectedPlan.price} · {selectedPlan.duration} subscription
                                </p>
                            </div>

                            <div className="p-6 space-y-6">
                                {!paymentMethod && (
                                    <div className="space-y-3.5">
                                        <button
                                            onClick={() => setPaymentMethod('crypto')}
                                            className="w-full p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/80 text-left flex items-center gap-4 transition-all group"
                                        >
                                            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl group-hover:scale-105 transition-transform border border-amber-500/20">
                                                <QrCode size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-base text-white">Pay with Crypto (Automated)</h3>
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        Instant
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Instant activation via BNB Smart Chain (BEP-20 USDT)
                                                </p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setPaymentMethod('admin')}
                                            className="w-full p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/80 text-left flex items-center gap-4 transition-all group"
                                        >
                                            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl group-hover:scale-105 transition-transform border border-blue-500/20">
                                                <Shield size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-base text-white">Contact Admin (Manual)</h3>
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                        Support
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Request bank transfer, UPI, or customized merchant billing
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {paymentMethod === 'admin' && (
                                    <div className="space-y-4 text-center">
                                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
                                            A support request ticket will be created. You will receive a direct message on your connected Telegram account with manual transfer details.
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setPaymentMethod(null)}
                                                className="btn btn-secondary flex-1 text-xs rounded-xl"
                                            >
                                                Back
                                            </button>
                                            <button 
                                                onClick={handleRequestAdmin} 
                                                disabled={isGenerating} 
                                                className="btn btn-primary flex-1 text-xs font-bold rounded-xl"
                                            >
                                                {isGenerating ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Dispatch Request"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'crypto' && (
                                    <div className="space-y-5">
                                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
                                            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                                            <span>
                                                <strong>BEP-20 Network Requirement:</strong> Send exactly the specified amount in <strong>USDT on the Binance Smart Chain (BEP20)</strong>. Sending via Tron, Ethereum, or other chains will result in lost funds.
                                            </span>
                                        </div>
                                        
                                        <label className="flex items-start gap-3 cursor-pointer select-none bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                                            <input 
                                                type="checkbox" 
                                                className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500" 
                                                checked={termsAccepted} 
                                                onChange={e => setTermsAccepted(e.target.checked)} 
                                            />
                                            <span className="text-xs text-slate-300">
                                                I understand that I am sending crypto on the <strong>BEP20 network</strong> to a generated temporary wallet.
                                            </span>
                                        </label>

                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setPaymentMethod(null)}
                                                className="btn btn-secondary flex-1 text-xs rounded-xl"
                                            >
                                                Back
                                            </button>
                                            <button 
                                                onClick={handleGenerateCryptoInvoice} 
                                                disabled={!termsAccepted || isGenerating} 
                                                className="btn bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold flex-1 text-xs rounded-xl shadow-lg disabled:opacity-50"
                                            >
                                                {isGenerating ? <Loader2 className="animate-spin mx-auto" size={16} /> : `Pay ${selectedPlan.price} with USDT`}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Reusable High-Trust Crypto Payment Flow Modal */}
            <CryptoPaymentModal
                isOpen={!!selectedPlan && !!invoice}
                onClose={closeModal}
                title={`Upgrade to ${selectedPlan?.title || 'Premium'}`}
                subtitle={`Payment session for ${selectedPlan?.duration || '1 Month'} Premium Subscription`}
                invoice={invoice}
                isVerified={isVerified}
                onSuccessDismiss={() => {
                    closeModal();
                    refresh();
                }}
                onCheckStatus={handleCheckStatus}
                onToast={(msg, type) => toast.showToast(msg, type)}
            />
        </div>
    );
}

function PricingCard({ plan, onSelect }: { plan: Plan, onSelect: () => void }) {
    const isGold = plan.highlight;

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`relative p-6 sm:p-8 rounded-3xl border flex flex-col transition-all ${isGold
                ? 'bg-gradient-to-b from-yellow-500/10 via-[var(--bg-surface)] to-[var(--bg-surface)] border-yellow-500/50 shadow-[0_0_30px_rgba(251,191,36,0.15)] ring-1 ring-yellow-500/30'
                : 'bg-[var(--bg-surface)] border-[var(--border-color)] shadow-sm'
                }`}
        >
            {isGold && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 text-xs font-extrabold uppercase tracking-wider shadow-md">
                    Most Popular
                </div>
            )}

            <h3 className={`text-xl font-bold mb-2 ${isGold ? 'text-yellow-500 dark:text-yellow-400' : 'text-[var(--text-primary)]'}`}>
                {plan.title}
            </h3>
            <div className="text-3xl sm:text-4xl font-extrabold mb-1 font-mono text-[var(--text-primary)]">
                {plan.price}
            </div>
            <div className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-6">
                {plan.duration}
            </div>

            <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-xs sm:text-sm text-[var(--text-secondary)]">
                        <Check size={16} className={isGold ? "text-yellow-500 shrink-0" : "text-[var(--primary-color)] shrink-0"} />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>

            <button
                onClick={onSelect}
                className={`btn w-full font-bold text-xs sm:text-sm py-3 rounded-xl transition-all ${isGold
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-slate-950 border-none shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                    : 'bg-[var(--bg-app)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-[var(--text-primary)]'
                    }`}
            >
                Choose Plan
            </button>
        </motion.div>
    );
}
