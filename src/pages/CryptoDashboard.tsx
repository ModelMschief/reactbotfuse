import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Download, RefreshCw, Key, ShieldCheck, Eye, EyeOff, Terminal, Activity, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CryptoDashboard() {
    const [loading, setLoading] = useState(true);
    const [account, setAccount] = useState<any>(null);
    const [stats, setStats] = useState<any>({ total_calls: 0, balance: {} });
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    
    // Form State
    const [name, setName] = useState('');
    const [botToken, setBotToken] = useState('');
    const [telegramId, setTelegramId] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');

    // UI State
    const [showSeed, setShowSeed] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);
    const [bnbPrice, setBnbPrice] = useState<string>('...');

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

    const fetchAccount = async () => {
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
            setLoading(false);
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
            await fetchAccount();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to setup account');
        } finally {
            setFormLoading(false);
        }
    };

    const handleRevoke = async () => {
        if (!confirm("Are you sure? This will instantly destroy your current API key and generate a new one. Existing integrations will break!")) return;
        setLoading(true);
        try {
            await api.post('/crypto/revoke');
            await fetchAccount();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to revoke key');
            setLoading(false);
        }
    };

    const handleCopy = (text: string, setter: any) => {
        navigator.clipboard.writeText(text);
        setter(true);
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
    };

    if (loading) {
        return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-[var(--primary-color)]" size={32} /></div>;
    }

    if (!account) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Welcome to BotFusion Pay</h1>
                    <p className="text-[var(--text-muted)]">Setup your non-custodial merchant profile to generate your keys.</p>
                </div>
                
                <form onSubmit={handleProvision} className="card bg-[var(--bg-surface)] border-[var(--border-color)] space-y-5">
                    {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm">{error}</div>}
                    
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Store / Project Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-4 py-2 text-[var(--text-primary)]" placeholder="My Awesome Store" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Telegram Bot Token (For Alerts)</label>
                        <input type="text" value={botToken} onChange={e => setBotToken(e.target.value)} required className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-4 py-2 text-[var(--text-primary)]" placeholder="123456:ABC-DEF..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Your Telegram Chat ID</label>
                        <input type="text" value={telegramId} onChange={e => setTelegramId(e.target.value)} required className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-4 py-2 text-[var(--text-primary)]" placeholder="987654321" />
                    </div>
                    
                    <button type="submit" disabled={formLoading} className="w-full btn-primary flex justify-center items-center py-2.5 rounded-md">
                        {formLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Complete Setup & Generate Keys'}
                    </button>
                </form>
            </div>
        );
    }

    const bnbBalance = stats.balance?.bnb?.bnb || '0.00';
    const isLowGas = parseFloat(bnbBalance) < 0.0005;

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0">
            {/* Ticker */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-3 flex justify-between items-center text-sm shadow-sm">
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <Activity size={16} className="text-emerald-500" /> Network Status
                </div>
                <div className="flex items-center gap-4 text-xs font-mono font-medium">
                    <span>BNB/USDT: <span className="text-emerald-400">${bnbPrice}</span></span>
                    <span className="hidden sm:inline">AVG GAS: <span className="text-emerald-400">~3 Gwei</span></span>
                </div>
            </div>

            {isLowGas && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold">Low Gas Warning</h4>
                        <p className="text-sm opacity-90 mt-1">Your Master Funding Wallet has less than 0.0005 BNB. Automated sweeps will fail if this reaches zero. Please deposit BNB.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Master Wallet */}
                <div className="card bg-[var(--bg-surface)] border-[var(--border-color)] md:col-span-1">
                    <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <ShieldCheck className="text-emerald-500" size={18} /> Master Wallet
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="text-xs text-[var(--text-muted)] mb-1">Address (Deposit Gas Here)</div>
                            <code className="block bg-[var(--bg-app)] border border-[var(--border-color)] p-2 rounded text-xs break-all">{account.index0Wallet?.address}</code>
                        </div>
                        <div className="flex gap-4">
                            <div>
                                <div className="text-xs text-[var(--text-muted)]">BNB Balance</div>
                                <div className="text-lg font-bold text-[var(--text-primary)] font-mono">{bnbBalance}</div>
                            </div>
                            <div>
                                <div className="text-xs text-[var(--text-muted)]">USDT Balance</div>
                                <div className="text-lg font-bold text-[var(--text-primary)] font-mono">{stats.balance?.usdt?.amount || '0.00'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* API Credentials */}
                <div className="card bg-[var(--bg-surface)] border-[var(--border-color)] md:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                            <Terminal className="text-emerald-500" size={18} /> Credentials
                        </h3>
                        <button onClick={handleRevoke} className="text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1 rounded transition-colors font-medium">
                            Revoke & Regenerate
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <div className="text-xs text-[var(--text-muted)] mb-1">API Key</div>
                            <div className="flex gap-2">
                                <code className="flex-1 bg-[var(--bg-app)] border border-[var(--border-color)] p-2 rounded text-xs truncate">
                                    {account.apiKey}
                                </code>
                                <button onClick={() => handleCopy(account.apiKey, setCopiedKey)} className="btn-secondary px-3 py-1 text-xs whitespace-nowrap">
                                    {copiedKey ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <div className="text-xs text-[var(--text-muted)]">Seed Phrase (Keep Offline!)</div>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowSeed(!showSeed)} className="text-xs text-[var(--text-muted)] hover:text-white flex items-center gap-1 font-medium">
                                        {showSeed ? <EyeOff size={12}/> : <Eye size={12}/>} {showSeed ? 'Hide' : 'Reveal'}
                                    </button>
                                    <button onClick={downloadSeed} className="text-xs text-[var(--primary-color)] hover:text-[var(--primary-hover)] flex items-center gap-1 font-medium">
                                        <Download size={12}/> Download .txt
                                    </button>
                                </div>
                            </div>
                            <div className={`bg-[var(--bg-app)] border border-[var(--border-color)] p-3 rounded font-mono text-sm leading-relaxed ${showSeed ? 'text-red-400' : 'blur-sm select-none text-transparent transition-all'}`}>
                                {account.seedPhrase}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics Graph */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Activity className="text-emerald-500" size={18} /> API Usage (30 Days)
                    </h3>
                    <div className="text-xs bg-[var(--bg-app)] px-3 py-1 rounded-full text-[var(--text-muted)]">
                        Total Calls: <strong className="text-white">{stats.total_calls}</strong>
                    </div>
                </div>
                
                <div className="h-[300px] w-full">
                    {analytics.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                                    itemStyle={{ color: '#10b981' }}
                                />
                                <Line type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-sm">
                            No API usage data available yet. Start making requests!
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Invoices */}
            <div className="card bg-[var(--bg-surface)] border-[var(--border-color)]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <FileText className="text-emerald-500" size={18} /> Recent Invoices (Live)
                    </h3>
                    <button onClick={fetchInvoices} className="text-xs text-[var(--text-muted)] hover:text-white flex items-center gap-1 font-medium">
                        <RefreshCw size={12}/> Refresh
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-[var(--text-muted)] uppercase bg-[var(--bg-app)]">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">ID</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Payment Status</th>
                                <th className="px-4 py-3 rounded-r-lg">Sweep Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">No invoices found.</td>
                                </tr>
                            ) : invoices.map((inv: any) => (
                                <tr key={inv.invoiceId} className="border-b border-[var(--border-color)] last:border-0">
                                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{inv.invoiceId}</td>
                                    <td className="px-4 py-3 font-medium text-white">{inv.amount} USDT</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                            inv.paymentStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-500' :
                                            inv.paymentStatus === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                            'bg-red-500/10 text-red-500'
                                        }`}>
                                            {inv.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-[var(--text-muted)] text-xs capitalize">{inv.collectionStatus?.replace('_', ' ')}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
