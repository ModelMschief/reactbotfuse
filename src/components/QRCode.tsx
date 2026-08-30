import React, { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';
import { Loader2, Download, Copy, CheckCircle2 } from 'lucide-react';

interface QRCodeProps {
    value: string;
    size?: number;
    level?: 'L' | 'M' | 'Q' | 'H';
    bgColor?: string;
    fgColor?: string;
    includeMargin?: boolean;
    className?: string;
    showActions?: boolean;
    onCopy?: () => void;
}

export const QRCode: React.FC<QRCodeProps> = ({
    value,
    size = 200,
    level = 'M',
    bgColor = '#FFFFFF',
    fgColor = '#000000',
    includeMargin = true,
    className = '',
    showActions = false,
    onCopy,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!value) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        setLoading(true);
        setError(null);

        const canvas = canvasRef.current;
        if (!canvas) return;

        QRCodeLib.toCanvas(canvas, value, {
            width: size,
            margin: includeMargin ? 2 : 0,
            errorCorrectionLevel: level,
            color: {
                dark: fgColor,
                light: bgColor,
            },
        })
            .then(() => {
                if (isMounted) {
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    console.error('QR code generation failed:', err);
                    setError('Failed to generate QR code');
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [value, size, level, bgColor, fgColor, includeMargin]);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        try {
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = `bep20-payment-qr-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error('Failed to download QR image', e);
        }
    };

    const handleCopyAddress = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        if (onCopy) onCopy();
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`inline-flex flex-col items-center justify-center ${className}`}>
            <div
                className="relative p-3 bg-white rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 transition-all"
                style={{ width: size + 24, height: size + 24 }}
            >
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-2xl z-10">
                        <Loader2 className="animate-spin text-amber-500" size={32} />
                        <span className="text-xs text-slate-500 mt-2 font-medium">Generating QR...</span>
                    </div>
                )}
                {error ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-xs text-red-500">
                        <span>{error}</span>
                    </div>
                ) : (
                    <canvas
                        ref={canvasRef}
                        className="rounded-lg w-full h-full block"
                        style={{ display: loading ? 'none' : 'block' }}
                    />
                )}
            </div>

            {showActions && !loading && !error && (
                <div className="flex items-center gap-2 mt-2">
                    <button
                        type="button"
                        onClick={handleCopyAddress}
                        className="text-xs text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 transition-colors font-medium border border-slate-200 dark:border-slate-700/60"
                        title="Copy Address"
                    >
                        {copied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="text-xs text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 transition-colors font-medium border border-slate-200 dark:border-slate-700/60"
                        title="Download QR as PNG"
                    >
                        <Download size={13} />
                        Save QR
                    </button>
                </div>
            )}
        </div>
    );
};

export default QRCode;
