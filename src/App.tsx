import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/store/auth-context';
import { Navbar } from '@/components/navbar';
import { VersionChecker } from '@/components/VersionChecker';
import { Loader2 } from 'lucide-react';

// Lazy loaded Pages
const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const LoginSuccess = lazy(() => import('@/pages/LoginSuccess'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const BotManagement = lazy(() => import('@/pages/BotManagement'));
const Premium = lazy(() => import('@/pages/Premium'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Settings = lazy(() => import('@/pages/Settings'));
const CryptoDashboard = lazy(() => import('@/pages/CryptoDashboard'));
const Docs = lazy(() => import('@/pages/Docs'));

import { ToastProvider } from '@/components/Toast';
import { TelegramCompletionBanner } from '@/components/TelegramCompletionBanner';
import { TelegramLinkingModal } from '@/components/TelegramLinkingModal';
import { useAuth } from '@/store/auth-context';

function AppContent() {
    const { showTelegramModal, setShowTelegramModal } = useAuth();

    return (
        <>
            <VersionChecker />
            <Navbar />
            {/* Spacer for fixed navbar + optional top banner */}
            <div className="pt-16">
                <TelegramCompletionBanner />
                <Suspense fallback={
                    <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                        <Loader2 className="animate-spin text-[var(--primary-color)]" size={48} />
                    </div>
                }>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/login-success" element={<LoginSuccess />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/manage-bots" element={<BotManagement />} />
                        <Route path="/premium" element={<Premium />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/pay" element={<CryptoDashboard />} />
                        <Route path="/docs" element={<Docs />} />
                    </Routes>
                </Suspense>
            </div>
            <TelegramLinkingModal
                isOpen={showTelegramModal}
                onClose={() => setShowTelegramModal(false)}
            />
        </>
    );
}

function App() {
    return (
        <HashRouter>
            <AuthProvider>
                <ToastProvider>
                    <AppContent />
                </ToastProvider>
            </AuthProvider>
        </HashRouter>
    );
}

export default App;

