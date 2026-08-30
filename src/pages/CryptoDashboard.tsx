import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
    Download, 
    RefreshCw, 
    Key, 
    ShieldCheck, 
    Eye, 
    EyeOff, 
    Terminal, 
    Activity, 
    FileText, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    Crown, 
    Loader2, 
    QrCode, 
    Copy, 
    X,
    Sparkles,
    Search,
    Wallet,
    Radio,
    ArrowUpRight,
    Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCode } from '@/components/QRCode';
import { CryptoPaymentModal } from '@/components/CryptoPaymentModal';
import { useToast } from '@/components/Toast';

const GATEWAY_PLANS = [
    { id: "1m", title: "1 Month", price: "$1.99", limits: "2 req/s, 400 inv/day, 100 pending", highlight: false },
    { id: "6m", title: "6 Months", price: "$9.99", limits: "2 req/s, 400 inv/day, 100 pending", highlight: false },
    { id: "1y", title: "1 Year", price: "$17.99", limits: "2 req/s, 400 inv/day, 100 pending", highlight: true },
];

const STORAGE_KEY = "bf_gateway_pending_invoice";

export default function CryptoDashboard() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [account, setAccount] = useState<any>(null);
    const [stats, setStats] = useState<any>({ total_calls: 0, balance: {} });
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [invoiceSearch, setInvoiceSearch] = useState('');
    
    // Form State
    const [name, setName] = useState('');
    const [botToken, setBotToken] = useState('');
    const [telegramId, setTelegramId] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');

    // UI State
    const [showSeed, setShowSeed] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedMasterAddr, setCopiedMasterAddr] = useState(false);
    const [bnbPrice, setBnbPrice] = useState<string>('...');

    // Modals
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedGatewayPlan, setSelectedGatewayPlan] = useState<any>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isGeneratingGateway, setIsGeneratingGateway] = useState(false);
    const [gatewayInvoice, setGatewayInvoice] = useState<any>(null);
    const [isVerified, setIsVerified] = useState(false);

    // Revoke Key Modal
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);

    // Update Token Modal
    const [showTokenModal, setShowTokenModal] = useState(false);
    const [newTokenValue, setNewTokenValue] = useState('');
    const [isUpdatingToken, setIsUpdatingToken] = useState(false);
    
    // Poll for premium status when waiting for invoice
    useEffect(() => {
        if (gatewayInvoice && account?.plan !== 'premium') {
            const interval = setInterval(() => {
                fetchAccount(true);
            }, 5000);
            return () => clearInterval(interval);
        }
        if (gatewayInvoice && account?.plan === 'premium') {
            setIsVerified(true);
            toast.success('Payment Received! API Limits Upgraded to Premium.', 'Upgraded!');
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [gatewayInvoice, account?.plan]);

    // Restore persistent invoice on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                const now = Date.now();
                // Check if less than 10 minutes (600,000 ms) old
                if (now - data.timestamp < 600000) {
                    const plan = GATEWAY_PLANS.find(p => p.id === data.selectedPlanId);
                    if (plan) {
                        setSelectedGatewayPlan(plan);
                        setTermsAccepted(true);
                        setGatewayInvoice(data.invoice);
                        setShowUpgradeModal(true);
                    }
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                }
            } catch (e) {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    useEffect(() => {
        fetchAccount();
        fetchBnbPrice();
    }, []);

    const fetchBnbPrice = async () => {
        try {
            const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
            const data = await res.json();
            if (data.price) {
                setBnbPrice(parseFloat(data.price).toFixed(2));
            }
        } catch (e) {
            console.error('Failed to fetch BNB price', e);
        }
    };

    const fetchAccount = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await api.get('/crypto/account');
            setAccount(res.data.account);
            setStats({ total_calls: res.data.total_calls, balance: res.data.balance });
            fetchAnalytics();
            fetchInvoices();
        } catch (err: any) {
            if (err.response?.status === 404) {
                setAccount(null);
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/crypto/analytics');
            setAnalytics(res.data);
        } catch (e) {
            console.error('Failed to fetch analytics');
        }
    };

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/crypto/invoices');
            setInvoices(res.data);
        } catch (e) {
            console.error('Failed to fetch invoices');
        }
    };

    const handleProvision = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setError('');
        try {
            await api.post('/crypto/provision', {
                name,
                developerBotToken: botToken,
                developerTelegramId: telegramId
            });
            toast.success('Merchant profile created successfully!', 'Store Setup');
            await fetchAccount();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to setup account');
            toast.error(err.response?.data?.error || 'Failed to setup account', 'Setup Failed');
        } finally {
            setFormLoading(false);
        }
    };

    const confirmRevoke = async () => {
        setIsRevoking(true);
        try {
            await api.post('/crypto/revoke');
            toast.success('API Key revoked and regenerated successfully!', 'Key Revoked');
            setShowRevokeModal(false);
            await fetchAccount();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to revoke key', 'Error');
        } finally {
            setIsRevoking(false);
        }
    };

    const confirmUpdateBotToken = async () => {
        if (!newTokenValue.trim()) {
            toast.warning('Please enter a valid Telegram Bot Token', 'Validation Error');
            return;
        }
        setIsUpdatingToken(true);
        try {
            await api.put('/crypto/developer/token', { developerBotToken: newTokenValue.trim() });
            toast.success('Telegram Bot Token updated successfully!', 'Token Updated');
            setShowTokenModal(false);
            setNewTokenValue('');
            await fetchAccount();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update token', 'Error');
        } finally {
            setIsUpdatingToken(false);
        }
    };

    const handleCopy = (text: string, setter: (val: boolean) => void, label = 'Copied') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setter(true);
        toast.copy(`${label} copied to clipboard!`);
        setTimeout(() => setter(false), 2000);
    };

    const downloadSeed = () => {
        if (!account?.seedPhrase) return;
        const blob = new Blob([`BotFusion Pay Recovery Phrase\nStore: ${account.name}\n\n${account.seedPhrase}\n\nKEEP THIS SECRET!`], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'botfusion_pay_seed.txt';
        a.click();
        toast.info('Seed phrase file downloaded. Store it securely offline.', 'Backup Saved');
    };

    const handleGenerateGatewayInvoice = async () => {
        if (!selectedGatewayPlan || !termsAccepted) return;
        setIsGeneratingGateway(true);
        try {
            const res = await api.post("/crypto/upgrade/gateway", { package: selectedGatewayPlan.id });
            const newInvoice = {
                tempAddress: res.data.tempWallet.address,
                amount: res.data.invoice.amount,
                invoiceId: res.data.invoice.invoiceId
            };
            setGatewayInvoice(newInvoice);
            setIsVerified(false);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                timestamp: Date.now(),
                selectedPlanId: selectedGatewayPlan.id,
                invoice: newInvoice
            }));
            toast.info(`Invoice generated: ${newInvoice.amount} USDT on BEP-20`, 'Invoice Ready');
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Payment gateway unavailable", "Error");
        } finally {
            setIsGeneratingGateway(false);
        }
    };

    const handleCheckPaymentStatus = async () => {
        try {
            const res = await api.get('/crypto/account');
            setAccount(res.data.account);
            if (res.data.account?.plan === 'premium') {
                setIsVerified(true);
                return true;
            }
        } catch (e) {
            console.error('Status check error:', e);
        }
        return false;
    };

    const filteredInvoices = invoices.filter((inv) => {
        if (!invoiceSearch) return true;
        const s = invoiceSearch.toLowerCase();
        return (
            inv.invoiceId?.toLowerCase().includes(s) ||
            inv.paymentStatus?.toLowerCase().includes(s) ||
            inv.collectionStatus?.toLowerCase().includes(s) ||
            String(inv.amount).includes(s)
        );
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <RefreshCw className="animate-spin text-[var(--primary-color)]" size={36} />
                <p className="text-sm text-[var(--text-muted)] font-medium">Loading BotFusion Pay dashboard...</p>
            </div>
        );
    }

    if (!account) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
                <div className="text-center space-y-3">
                    <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                        <Wallet size={36} className="text-amber-500" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Welcome to BotFusion Pay</h1>
                    <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">
                        Provision your non-custodial merchant profile to generate API keys, manage master wallets, and accept automated BEP-20 USDT payments.
                    </p>
                </div>
                
                <form onSubmit={handleProvision} className="card bg-[var(--bg-surface)] border-[var(--border-color)] space-y-5 p-6 sm:p-8 rounded-2xl shadow-xl">
                    {error && (
                        <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
                            <AlertTriangle size={18} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                            Store / Project Name
                        </label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required 
                            className="input-field" 
                            placeholder="e.g. My Telegram Bot Store" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                            Telegram Bot Token (For Instant Payment Alerts)
                        </label>
                        <input 
                            type="text" 
                            value={botToken} 
                            onChange={e => setBotToken(e.target.value)} 
                            required 
                            className="input-field font-mono text-sm" 
                            placeholder="123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                            Your Telegram Chat ID (For Notifications)
                        </label>
                        <input 
                            type="text" 
                            value={telegramId} 
                            onChange={e => setTelegramId(e.target.value)} 
                            required 
                            className="input-field font-mono text-sm" 
                            placeholder="e.g. 987654321" 
                        />
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-xs text-amber-200/90 flex items-start gap-2.5">
                        <ShieldCheck className="text-amber-400 shrink-0 mt-0.5" size={16} />
                        <span>
                            A non-custodial HD seed phrase and master wallet will be cryptographically derived for your store. Only you control the private keys.
                        </span>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={formLoading} 
                        className="w-full btn btn-primary flex justify-center items-center py-3 rounded-xl font-bold shadow-lg"
                    >
                        {formLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Complete Setup & Generate Keys'}
                    </button>
                </form>
            </div>
        );
    }

    const bnbBalance = stats.balance?.bnb?.bnb || '0.00';
    const isLowGas = parseFloat(bnbBalance) < 0.0005;

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
            {/* Top Network Ticker & Status Bar */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 text-sm shadow-sm">
                <div className="flex items-center gap-2.5 text-[var(--text-muted)] font-medium">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[var(--text-primary)] font-semibold">BNB Smart Chain (BEP-20)</span>
                    <span className="text-xs text-slate-400 font-mono">ChainID: 56</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono font-medium">
                    <div className="px-2.5 py-1 rounded-md bg-[var(--bg-app)] border border-[var(--border-color)]">
                        BNB/USDT: <span className="text-emerald-500 font-bold">${bnbPrice}</span>
                    </div>
                    <div className="hidden sm:inline px-2.5 py-1 rounded-md bg-[var(--bg-app)] border border-[var(--border-color)]">
                        AVG GAS: <span className="text-emerald-500 font-bold">~3 Gwei</span>
                    </div>
                    <button 
                        onClick={() => { fetchAccount(false); fetchBnbPrice(); toast.info('Data refreshed', 'Sync'); }} 
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded transition-colors"
                        title="Refresh All"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Low Gas Warning Banner */}
            {isLowGas && (
                <div className="bg-red-500/10 border border-red-500/25 text-red-400 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                    <AlertTriangle className="shrink-0 mt-0.5 text-red-500" size={20} />
                    <div className="text-sm">
                        <h4 className="font-bold text-red-300">Low Gas Alert (BNB Required)</h4>
                        <p className="opacity-90 mt-0.5 text-xs sm:text-sm leading-relaxed">
                            Your Master Funding Wallet has less than <strong>0.0005 BNB</strong>. Automated on-chain sweeps of customer USDT payments will pause until BNB gas is deposited to your Master Wallet address.
                        </p>
                    </div>
                </div>
            )}

            {/* Master Wallet & Credentials Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Master Wallet Card */}
                <div className="card bg-[var(--bg-surface)] border-[var(--border-color)] lg:col-span-1 rounded-2xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                                <ShieldCheck className="text-emerald-500" size={19} /> Master Funding Wallet
                            </h3>
                            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                                Non-Custodial
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center text-xs text-[var(--text-muted)] mb-1">
                                    <span>Master Address (Deposit Gas)</span>
                                    <span className="text-[11px] text-amber-500/90 font-mono">BEP-20</span>
                                </div>
                                <div className="bg-[var(--bg-app)] border border-[var(--border-color)] p-2.5 rounded-xl flex items-center justify-between gap-2">
                                    <code className="text-xs font-mono text-[var(--text-primary)] break-all truncate">
                                        {account.index0Wallet?.address}
                                    </code>
                                    <button 
                                        type="button"
                                        onClick={() => handleCopy(account.index0Wallet?.address, setCopiedMasterAddr, 'Master Address')} 
                                        className="shrink-0 p-1.5 hover:bg-[var(--bg-surface-hover)] rounded-md text-[var(--text-muted)] hover:text-white transition-colors"
                                        title="Copy Address"
                                    >
                                        {copiedMasterAddr ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Copy size={15} />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div className="p-3 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl">
                                    <div className="text-xs text-[var(--text-muted)] font-medium">BNB (Gas)</div>
                                    <div className={`text-lg font-bold font-mono mt-0.5 truncate ${isLowGas ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
                                        {bnbBalance}
                                    </div>
                                </div>
                                <div className="p-3 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl">
                                    <div className="text-xs text-[var(--text-muted)] font-medium">USDT Balance</div>
                                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5 truncate">
                                        {stats.balance?.usdt?.amount || '0.00'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span>Store: <strong className="text-[var(--text-primary)]">{account.name}</strong></span>
                        <span className="font-mono text-[11px] opacity-80">Derivation: m/44'/60'/0'/0</span>
                    </div>
                </div>

                {/* API Credentials & Seed Phrase Card */}
                <div className="card bg-[var(--bg-surface)] border-[var(--border-color)] lg:col-span-2 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                        <div>
                            <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                                <Terminal className="text-amber-500" size={19} /> API Credentials & Security
                            </h3>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">Manage merchant access tokens and private key backup.</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                            {account.plan !== 'premium' && (
                                <button 
                                    onClick={() => setShowUpgradeModal(true)} 
                                    className="btn bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-3 py-1.5 text-xs rounded-lg shadow-sm"
                                >
                                    <Crown size={14} /> Upgrade Plan
                                </button>
                            )}
                            <button 
                                onClick={() => setShowTokenModal(true)} 
                                className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors font-medium border border-blue-500/20"
                            >
                                Update Bot Token
                            </button>
                            <button 
                                onClick={() => setShowRevokeModal(true)} 
                                className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors font-medium border border-red-500/20"
                            >
                                Revoke & Regenerate
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Plan & Limits Bar */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--bg-app)] border border-[var(--border-color)] p-3.5 rounded-xl">
                            <div>
                                <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Current Gateway Tier</div>
                                <div className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2 mt-0.5">
                                    {account.plan === 'premium' ? (
                                        <span className="inline-flex items-center gap-1.5 text-amber-400">
                                            <Crown size={17} className="text-amber-400" /> Premium Merchant
                                        </span>
                                    ) : (
                                        <span className="text-slate-300">Free Tier</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-left sm:text-right">
                                <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Throughput Limits</div>
                                <div className="text-xs font-mono font-medium text-[var(--text-secondary)] mt-0.5">
                                    {account.plan === 'premium' ? '2 req/s · 400 invoices/day · 100 pending' : '1 req/s · 100 invoices/day · 20 pending'}
                                </div>
                            </div>
                        </div>

                        {/* API Key Box */}
                        <div>
                            <div className="flex justify-between items-center text-xs text-[var(--text-muted)] mb-1">
                                <span>Merchant API Key (Header: <code className="text-amber-400">x-api-key</code>)</span>
                                <button 
                                    onClick={() => setShowApiKey(!showApiKey)} 
                                    className="text-[11px] text-[var(--text-muted)] hover:text-white flex items-center gap-1"
                                >
                                    {showApiKey ? <EyeOff size={12} /> : <Eye size={12} />} {showApiKey ? 'Hide' : 'Reveal'}
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-[var(--bg-app)] border border-[var(--border-color)] p-2.5 rounded-xl text-xs font-mono text-[var(--text-primary)] truncate">
                                    {showApiKey ? account.apiKey : '•'.repeat(32) + (account.apiKey ? account.apiKey.slice(-6) : '')}
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => handleCopy(account.apiKey, setCopiedKey, 'API Key')} 
                                    className="btn btn-secondary px-3.5 py-1.5 text-xs whitespace-nowrap rounded-xl"
                                >
                                    {copiedKey ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>
                        
                        {/* Seed Phrase Box */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                                    <Lock size={12} className="text-red-400" />
                                    <span>Master Seed Phrase (Never Share!)</span>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowSeed(!showSeed)} 
                                        className="text-xs text-[var(--text-muted)] hover:text-white flex items-center gap-1 font-medium"
                                    >
                                        {showSeed ? <EyeOff size={13}/> : <Eye size={13}/>} {showSeed ? 'Hide Phrase' : 'Reveal Phrase'}
                                    </button>
                                    <button 
                                        onClick={downloadSeed} 
                                        className="text-xs text-[var(--primary-color)] hover:text-[var(--primary-hover)] flex items-center gap-1 font-medium"
                                    >
                                        <Download size={13}/> Download .txt
                                    </button>
                                </div>
                            </div>
                            <div 
                                className={`bg-[var(--bg-app)] border border-[var(--border-color)] p-3 rounded-xl font-mono text-xs leading-relaxed transition-all ${
                                    showSeed 
                                        ? 'text-red-400 border-red-500/30 select-all' 
                                        : 'blur-sm select-none text-transparent opacity-60'
                                }`}
                            >
                                {account.seedPhrase}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics Graph Card */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)] rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                            <Activity className="text-emerald-500" size={19} /> API Usage & Request Volume (30 Days)
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Real-time telemetry of requests processed through your merchant API key.</p>
                    </div>
                    <div className="text-xs bg-[var(--bg-app)] border border-[var(--border-color)] px-3 py-1.5 rounded-full text-[var(--text-muted)]">
                        Total Calls: <strong className="text-[var(--text-primary)] font-mono">{stats.total_calls}</strong>
                    </div>
                </div>
                
                <div className="h-[280px] w-full">
                    {analytics.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fafafa', fontSize: '12px' }}
                                    itemStyle={{ color: '#10b981' }}
                                />
                                <Line type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] text-sm space-y-2">
                            <Activity size={32} className="opacity-30" />
                            <span>No API usage telemetry recorded yet. Start making merchant requests!</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Invoices Table Card */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)] rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                    <div>
                        <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                            <FileText className="text-amber-500" size={19} /> Live Merchant Invoices
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Real-time status of payment sessions generated through your store.</p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-60">
                            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                            <input 
                                type="text"
                                value={invoiceSearch}
                                onChange={(e) => setInvoiceSearch(e.target.value)}
                                placeholder="Search invoices..."
                                className="input-field pl-8 py-1.5 text-xs rounded-lg"
                            />
                        </div>
                        <button 
                            onClick={fetchInvoices} 
                            className="btn btn-secondary text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 shrink-0"
                            title="Refresh Invoices"
                        >
                            <RefreshCw size={13}/> Refresh
                        </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
                    <table className="w-full text-xs text-left">
                        <thead className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-app)] border-b border-[var(--border-color)]">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Invoice ID</th>
                                <th className="px-4 py-3 font-semibold">Amount</th>
                                <th className="px-4 py-3 font-semibold">Network</th>
                                <th className="px-4 py-3 font-semibold">Payment Status</th>
                                <th className="px-4 py-3 font-semibold">Sweep Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-[var(--text-muted)]">
                                        {invoiceSearch ? 'No matching invoices found.' : 'No invoices generated yet.'}
                                    </td>
                                </tr>
                            ) : filteredInvoices.map((inv: any) => (
                                <tr key={inv.invoiceId} className="hover:bg-[var(--bg-app)]/50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-[var(--text-primary)] font-medium">
                                        {inv.invoiceId}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-[var(--text-primary)] font-mono">
                                        {inv.amount} <span className="text-amber-400 font-sans font-semibold text-[11px]">USDT</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                                            BEP-20
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                            inv.paymentStatus === 'verified' 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            inv.paymentStatus === 'pending' 
                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                inv.paymentStatus === 'verified' ? 'bg-emerald-400' :
                                                inv.paymentStatus === 'pending' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'
                                            }`} />
                                            {inv.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-[var(--text-muted)] capitalize">
                                        {inv.collectionStatus ? inv.collectionStatus.replace('_', ' ') : 'Pending'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Gateway Upgrade Plan Modal (Step 1: Selection) */}
            <AnimatePresence>
                {showUpgradeModal && !gatewayInvoice && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative text-slate-100 my-auto"
                        >
                            <button 
                                onClick={() => {
                                    setShowUpgradeModal(false);
                                    setSelectedGatewayPlan(null);
                                    setTermsAccepted(false);
                                }} 
                                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors z-10"
                            >
                                <X size={20} />
                            </button>

                            <div className="p-6 border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                    <Crown className="text-amber-400" size={24} />
                                    <h2 className="text-2xl font-bold text-white">Upgrade API Limits</h2>
                                </div>
                                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                                    Boost your merchant throughput, invoice generation quota, and pending queue capacity.
                                </p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {GATEWAY_PLANS.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedGatewayPlan(p)}
                                            className={`p-4 rounded-xl border text-left transition-all ${
                                                selectedGatewayPlan?.id === p.id 
                                                    ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/50' 
                                                    : p.highlight 
                                                        ? 'bg-slate-800/80 border-amber-500/40 hover:border-amber-500'
                                                        : 'bg-slate-800/40 border-slate-700 hover:border-amber-500/50'
                                            }`}
                                        >
                                            <div className={`font-bold text-sm mb-1 ${p.highlight ? 'text-amber-400' : 'text-slate-200'}`}>
                                                {p.title}
                                            </div>
                                            <div className="text-2xl font-extrabold text-white mb-2">{p.price}</div>
                                            <div className="text-[11px] text-slate-400 leading-snug">{p.limits}</div>
                                        </button>
                                    ))}
                                </div>
                                
                                {selectedGatewayPlan && (
                                    <div className="space-y-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                                        <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
                                            <AlertTriangle size={17} className="shrink-0 mt-0.5 text-amber-400" />
                                            <span>
                                                <strong>Payment Instructions:</strong> You will receive a unique single-use deposit address. Send exactly <strong>{selectedGatewayPlan.price.replace('$', '')} USDT</strong> on the <strong>BNB Smart Chain (BEP-20)</strong>.
                                            </span>
                                        </div>
                                        <label className="flex items-start gap-3 cursor-pointer select-none">
                                            <input 
                                                type="checkbox" 
                                                className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500" 
                                                checked={termsAccepted} 
                                                onChange={e => setTermsAccepted(e.target.checked)} 
                                            />
                                            <span className="text-xs text-slate-300">
                                                I understand that I am sending crypto on the <strong>BEP-20 (Binance Smart Chain)</strong> network.
                                            </span>
                                        </label>
                                        <button 
                                            onClick={handleGenerateGatewayInvoice} 
                                            disabled={!termsAccepted || isGeneratingGateway} 
                                            className="btn w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold py-3 rounded-xl text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isGeneratingGateway ? <Loader2 className="animate-spin" size={18} /> : `Pay ${selectedGatewayPlan.price} with BEP-20 USDT`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* High-Trust Crypto Payment Modal for Gateway Upgrade */}
            <CryptoPaymentModal
                isOpen={showUpgradeModal && !!gatewayInvoice}
                onClose={() => {
                    setShowUpgradeModal(false);
                    setGatewayInvoice(null);
                    setSelectedGatewayPlan(null);
                    setTermsAccepted(false);
                    localStorage.removeItem(STORAGE_KEY);
                }}
                title="Upgrade API Limits"
                subtitle={`Payment session for ${selectedGatewayPlan?.title || 'Gateway Upgrade'}`}
                invoice={gatewayInvoice}
                isVerified={isVerified}
                onSuccessDismiss={() => {
                    setShowUpgradeModal(false);
                    setGatewayInvoice(null);
                    setSelectedGatewayPlan(null);
                    setIsVerified(false);
                    localStorage.removeItem(STORAGE_KEY);
                    fetchAccount(false);
                }}
                onCheckStatus={handleCheckPaymentStatus}
                onToast={(msg, type) => toast.showToast(msg, type)}
            />

            {/* Revoke API Key Modal */}
            <AnimatePresence>
                {showRevokeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 text-slate-100 shadow-2xl"
                        >
                            <div className="flex items-center gap-3 text-red-400">
                                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">Revoke & Regenerate Key?</h3>
                                    <p className="text-xs text-slate-400">This action is irreversible.</p>
                                </div>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                                Revoking will immediately destroy your existing API key. All existing bot scripts, webhooks, and payment integrations using the current key will stop functioning until updated.
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRevokeModal(false)}
                                    disabled={isRevoking}
                                    className="btn btn-secondary px-4 py-2 text-xs rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmRevoke}
                                    disabled={isRevoking}
                                    className="btn bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 text-xs rounded-xl shadow-lg shadow-red-950/50 flex items-center gap-1.5"
                                >
                                    {isRevoking ? <Loader2 className="animate-spin" size={14} /> : 'Revoke & Generate New'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Update Bot Token Modal */}
            <AnimatePresence>
                {showTokenModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 text-slate-100 shadow-2xl"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                                        <Radio size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white">Update Telegram Bot Token</h3>
                                        <p className="text-xs text-slate-400">Used to send payment alerts to your chat</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowTokenModal(false)} 
                                    className="text-slate-400 hover:text-white p-1"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    New Telegram Bot Token
                                </label>
                                <input
                                    type="text"
                                    value={newTokenValue}
                                    onChange={(e) => setNewTokenValue(e.target.value)}
                                    placeholder="123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ"
                                    className="input-field font-mono text-xs rounded-xl"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTokenModal(false)}
                                    disabled={isUpdatingToken}
                                    className="btn btn-secondary px-4 py-2 text-xs rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmUpdateBotToken}
                                    disabled={isUpdatingToken}
                                    className="btn bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 text-xs rounded-xl shadow-lg shadow-blue-950/50 flex items-center gap-1.5"
                                >
                                    {isUpdatingToken ? <Loader2 className="animate-spin" size={14} /> : 'Save Token'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
