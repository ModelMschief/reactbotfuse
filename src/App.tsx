import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/store/auth-context';
import { Navbar } from '@/components/navbar';
import { VersionChecker } from '@/components/VersionChecker';
import { Loader2 } from 'lucide-react';

// Lazy loaded Pages
const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const BotManagement = lazy(() => import('@/pages/BotManagement'));
const Premium = lazy(() => import('@/pages/Premium'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Settings = lazy(() => import('@/pages/Settings'));

function App() {
    return (
        <HashRouter>
            <AuthProvider>
                <VersionChecker />
                <Navbar />
                {/* Spacer for fixed navbar */}
                <div className="pt-20">
                    <Suspense fallback={
                        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                            <Loader2 className="animate-spin text-[var(--primary-color)]" size={48} />
                        </div>
                    }>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/manage-bots" element={<BotManagement />} />
                            <Route path="/premium" element={<Premium />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                        </Routes>
                    </Suspense>
                </div>
            </AuthProvider>
        </HashRouter>
    );
}

export default App;

