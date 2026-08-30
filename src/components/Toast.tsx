import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Copy } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'copy';

export interface ToastMessage {
    id: string;
    title?: string;
    message: string;
    type?: ToastType;
    duration?: number;
}

interface ToastContextValue {
    toasts: ToastMessage[];
    showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    copy: (message?: string) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        (message: string, type: ToastType = 'info', title?: string, duration = 4000) => {
            const id = Math.random().toString(36).substring(2, 9);
            const newToast: ToastMessage = { id, title, message, type, duration };

            setToasts((prev) => [...prev.slice(-4), newToast]); // keep at most 5

            if (duration > 0) {
                setTimeout(() => {
                    removeToast(id);
                }, duration);
            }
        },
        [removeToast]
    );

    const success = useCallback((message: string, title?: string) => showToast(message, 'success', title), [showToast]);
    const error = useCallback((message: string, title?: string) => showToast(message, 'error', title), [showToast]);
    const warning = useCallback((message: string, title?: string) => showToast(message, 'warning', title), [showToast]);
    const info = useCallback((message: string, title?: string) => showToast(message, 'info', title), [showToast]);
    const copy = useCallback((message = 'Copied to clipboard!') => showToast(message, 'copy', 'Copied'), [showToast]);

    return (
        <ToastContext.Provider value={{ toasts, showToast, success, error, warning, info, copy, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        // Fallback if rendered outside ToastProvider
        return {
            toasts: [],
            showToast: (msg: string) => console.log('Toast:', msg),
            success: (msg: string) => console.log('Success:', msg),
            error: (msg: string) => console.error('Error:', msg),
            warning: (msg: string) => console.warn('Warning:', msg),
            info: (msg: string) => console.log('Info:', msg),
            copy: (msg = 'Copied!') => console.log('Copy:', msg),
            removeToast: () => {},
        };
    }
    return context;
};

const ToastContainer: React.FC<{ toasts: ToastMessage[]; removeToast: (id: string) => void }> = ({
    toasts,
    removeToast,
}) => {
    return (
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`pointer-events-auto rounded-xl border p-4 shadow-xl backdrop-blur-md flex items-start gap-3 text-sm transition-all ${
                            toast.type === 'success'
                                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40'
                                : toast.type === 'error'
                                ? 'bg-red-950/90 border-red-500/40 text-red-100 shadow-red-950/40'
                                : toast.type === 'warning'
                                ? 'bg-amber-950/90 border-amber-500/40 text-amber-100 shadow-amber-950/40'
                                : toast.type === 'copy'
                                ? 'bg-slate-900/95 border-amber-500/40 text-slate-100 shadow-slate-950/50'
                                : 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-950/50'
                        }`}
                    >
                        <div className="shrink-0 mt-0.5">
                            {toast.type === 'success' && <CheckCircle2 className="text-emerald-400" size={18} />}
                            {toast.type === 'error' && <AlertCircle className="text-red-400" size={18} />}
                            {toast.type === 'warning' && <AlertTriangle className="text-amber-400" size={18} />}
                            {toast.type === 'copy' && <Copy className="text-amber-400" size={18} />}
                            {toast.type === 'info' && <Info className="text-blue-400" size={18} />}
                        </div>

                        <div className="flex-1 min-w-0">
                            {toast.title && <h4 className="font-semibold text-xs uppercase tracking-wider mb-0.5 opacity-90">{toast.title}</h4>}
                            <p className="text-xs leading-relaxed break-words">{toast.message}</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => removeToast(toast.id)}
                            className="shrink-0 text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-md"
                            aria-label="Close toast"
                        >
                            <X size={14} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastProvider;
