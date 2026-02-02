import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/store/auth-context';
import { Navbar } from '@/components/navbar';

// Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Autoup from '@/pages/Autoup';
import Premium from '@/pages/Premium';

function App() {
    return (
        <HashRouter>
            <AuthProvider>
                <Navbar />
                {/* Spacer for fixed navbar */}
                <div className="pt-20">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/autoup" element={<Autoup />} />
                        <Route path="/premium" element={<Premium />} />
                    </Routes>
                </div>
            </AuthProvider>
        </HashRouter>
    );
}

export default App;
