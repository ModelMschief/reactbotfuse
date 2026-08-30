import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Copy, 
    CheckCircle2, 
    Loader2, 
    ShieldCheck, 
    AlertTriangle, 
    Activity, 
    ArrowRight, 
    ExternalLink, 
    Sparkles, 
    RefreshCw,
    Radio
} from 'lucide-react';
import { QRCode } from './QRCode';

export type PaymentStep = 'awaiting' | 'detecting' | 'confirming' | 'verified';

interface CryptoPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    invoice: {
        tempAddress: string;
        amount: string;
        invoiceId?: string;
    } | null;
    isVerified?: boolean;
    onSuccessDismiss?: () => void;
    onCheckStatus?: () => Promise<boolean> | void;
    onToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info' | 'copy') => void;
}

export const CryptoPaymentModal: React.FC<CryptoPaymentModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle = 'Instant activation via BNB Smart Chain (BEP-20)',
    invoice,
    isVerified = false,
    onSuccessDismiss,
    onCheckStatus,
    onToast,
}) => {
    const [currentStep, setCurrentStep] = useState<PaymentStep>('awaiting');
    const [copied, setCopied] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);

    // Sync external isVerified with step
    useEffect(() => {
        if (isVerified) {
            setCurrentStep('verified');
        }
    }, [isVerified]);

    // Timer & Status Simulation if waiting
    useEffect(() => {
        if (!isOpen || !invoice || isVerified) return;

        setTimeElapsed(0);
        setCurrentStep('awaiting');

        const timer = setInterval(() => {
            setTimeElapsed((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, invoice, isVerified]);

    const handleCopy = (text: string, label = 'Address') => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        if (onToast) {
            onToast(`${label} copied to clipboard!`, 'copy');
        }
        setTimeout(() => setCopied(false), 2000);
    };

    const handleManualCheck = async () => {
        if (isChecking) return;
        setIsChecking(true);
        if (onToast) {
            onToast('Checking Binance Smart Chain mempool & confirmations...', 'info');
        }
        try {
            if (onCheckStatus) {
                const verified = await onCheckStatus();
                if (verified) {
                    setCurrentStep('verified');
                }
            }
        } catch (e) {
            console.error('Check status error:', e);
        } finally {
            setTimeout(() => setIsChecking(false), 800);
        }
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!isOpen) return null;

    const steps = [
        { id: 'awaiting', label: '1. Awaiting Deposit', desc: 'Scan QR or copy address' },
        { id: 'detecting', label: '2. Detecting Deposit', desc: 'Mempool broadcast' },
        { id: 'confirming', label: '3. Sweeping & Confirming', desc: 'BSC block finality' },
        { id: 'verified', label: '4. Activated', desc: 'Instant upgrade' },
    ];

    const getStepIndex = (step: PaymentStep) => {
        switch (step) {
            case 'awaiting': return 0;
            case 'detecting': return 1;
            case 'confirming': return 2;
            case 'verified': return 3;
        }
    };

    const activeIndex = getStepIndex(currentStep);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.25 }}
                className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative my-auto text-slate-100"
            >
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/90 relative">
                    <div className="pr-8">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                BEP-20 USDT
                            </span>
                            <span className="text-xs text-slate-400">BNB Smart Chain</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5 flex items-center gap-2">
                            {title}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{subtitle}</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Stepper Indicator */}
                <div className="bg-slate-950/60 px-4 sm:px-6 py-3.5 border-b border-slate-800">
                    <div className="grid grid-cols-4 gap-1 sm:gap-2">
                        {steps.map((step, idx) => {
                            const isCurrent = idx === activeIndex;
                            const isPast = idx < activeIndex;
                            return (
                                <div key={step.id} className="flex flex-col items-center text-center">
                                    <div className="flex items-center w-full mb-1.5">
                                        <div
                                            className={`w-full h-1 rounded-full transition-all duration-300 ${
                                                isPast
                                                    ? 'bg-emerald-500'
                                                    : isCurrent
                                                    ? 'bg-amber-400'
                                                    : 'bg-slate-800'
                                            }`}
                                        />
                                    </div>
                                    <span
                                        className={`text-[10px] sm:text-xs font-semibold truncate max-w-[80px] sm:max-w-none ${
                                            isCurrent
                                                ? 'text-amber-400'
                                                : isPast
                                                ? 'text-emerald-400'
                                                : 'text-slate-500'
                                        }`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 space-y-6">
                    {invoice ? (
                        <>
                            {/* Step 4: Verified */}
                            {currentStep === 'verified' ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-6 space-y-5"
                                >
                                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                                        <CheckCircle2 size={44} className="text-emerald-400" />
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-1">
                                            Payment Verified & Activated!
                                        </h3>
                                        <p className="text-sm text-slate-300 max-w-sm mx-auto">
                                            Your transaction of <span className="text-emerald-400 font-semibold">{invoice.amount} USDT</span> has been confirmed on the BNB Smart Chain.
                                        </p>
                                    </div>

                                    {invoice.invoiceId && (
                                        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 max-w-xs mx-auto text-xs font-mono text-slate-400">
                                            Invoice ID: <span className="text-slate-200">{invoice.invoiceId}</span>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (onSuccessDismiss) onSuccessDismiss();
                                            else onClose();
                                        }}
                                        className="btn bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-emerald-950/50 mx-auto inline-flex items-center gap-2"
                                    >
                                        <Sparkles size={18} />
                                        Continue to Dashboard
                                    </button>
                                </motion.div>
                            ) : (
                                /* Step 1-3: Active Payment Details */
                                <div className="space-y-5">
                                    {/* Amount Card */}
                                    <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                                        <div>
                                            <div className="text-xs uppercase tracking-wider font-bold text-amber-400/90">
                                                Send Exact Amount
                                            </div>
                                            <div className="text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline justify-center sm:justify-start gap-1.5 mt-0.5">
                                                <span>{invoice.amount}</span>
                                                <span className="text-base text-amber-400 font-sans font-bold">USDT</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="px-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-xs font-mono text-slate-300">
                                                <span className="text-slate-400">Network:</span> <strong className="text-amber-400">BEP-20 (BSC)</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* QR Code & Instructions */}
                                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950/70 border border-slate-800 p-5 rounded-2xl">
                                        <div className="shrink-0 flex flex-col items-center">
                                            <QRCode
                                                value={invoice.tempAddress}
                                                size={160}
                                                showActions={true}
                                                onCopy={() => {
                                                    if (onToast) onToast('Address copied to clipboard!', 'copy');
                                                }}
                                            />
                                            <span className="text-[11px] text-slate-500 mt-1">Scan with any BEP-20 wallet</span>
                                        </div>

                                        <div className="space-y-3.5 flex-1 min-w-0 w-full">
                                            <div>
                                                <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                                                    <span>Deposit Address (BEP-20)</span>
                                                    <span className="text-[11px] text-amber-400/80 font-medium">Single-Use Temporary Wallet</span>
                                                </div>
                                                <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-inner">
                                                    <code className="text-xs font-mono text-amber-200/90 break-all select-all leading-relaxed">
                                                        {invoice.tempAddress}
                                                    </code>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(invoice.tempAddress, 'Deposit Address')}
                                                        className="shrink-0 p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors"
                                                        title="Copy Address"
                                                    >
                                                        {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Instructions Box */}
                                            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                                                <div className="flex items-start gap-2">
                                                    <ShieldCheck size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                                                    <span>Send only <strong>USDT</strong> via <strong>BNB Smart Chain (BEP20)</strong>.</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <Radio size={15} className="text-amber-400 shrink-0 mt-0.5" />
                                                    <span>Activation triggers automatically within <strong>~15-30 seconds</strong> of deposit.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Real-time Status Pulse Bar */}
                                    <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2.5 text-slate-300">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                            </span>
                                            <span>
                                                {currentStep === 'awaiting' && 'Listening for on-chain deposit on BNB Smart Chain...'}
                                                {currentStep === 'detecting' && 'Deposit detected! Confirming block finality...'}
                                                {currentStep === 'confirming' && 'Sweeping to master wallet & finalizing...'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-slate-400">{formatTime(timeElapsed)}</span>
                                            <button
                                                type="button"
                                                onClick={handleManualCheck}
                                                disabled={isChecking}
                                                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 font-medium text-xs border border-slate-700"
                                            >
                                                <RefreshCw size={12} className={isChecking ? 'animate-spin text-amber-400' : ''} />
                                                Check Status
                                            </button>
                                        </div>
                                    </div>

                                    {/* Network Safety Banner */}
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs flex items-start gap-2">
                                        <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
                                        <span>
                                            <strong>CRITICAL:</strong> Do NOT send USDT from other networks (ERC-20, TRC-20, Solana, Polygon). Cross-chain transfers cannot be recovered.
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
                            <Loader2 className="animate-spin text-amber-500" size={32} />
                            <p className="text-sm">Preparing cryptographic invoice...</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default CryptoPaymentModal;
