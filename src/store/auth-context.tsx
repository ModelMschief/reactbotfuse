import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

interface User {
    id: string; // From 'sub'
    email?: string;
    isPremium: boolean;
    telegramId?: string;
    planExpiry?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, pass: string) => Promise<boolean>;
    signupInit: (email: string, pass: string, tgId: string) => Promise<boolean>; // Returns true if OTP sent
    verifyOtp: (email: string, otp: string) => Promise<boolean>;
    logout: () => void;
    checkSession: () => Promise<void>;
    isGlobalFireActive: boolean;
    setGlobalFireActive: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isGlobalFireActive, setGlobalFireActive] = useState(false);
    const navigate = useNavigate();

    // Define logout first (needed by checkSession)
    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem("jwtToken");
        navigate("/login");
    }, [navigate]);

    // Define checkSession (depends on logout)
    const checkSession = useCallback(async () => {
        const token = localStorage.getItem("jwtToken");
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                // Check expiry
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                    return;
                }

                // For now, we only get ID from token. 
                // To get full User object (email, plan), we need a creating '/me' endpoint or store it in localstorage too.
                // For this architecture, we will fetch full dashboard data later, 
                // here we just restore the session ID.
                setUser({
                    id: decoded.sub,
                    isPremium: false // Will be updated by Dashboard fetch 
                });

            } catch (e) {
                console.error("Invalid token", e);
                logout();
            }
        }
    }, [logout]);

    // Check session on load
    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const login = async (email: string, pass: string) => {
        try {
            const res = await api.post("/login", { email, password: pass });
            if (res.data.token) {
                localStorage.setItem("jwtToken", res.data.token);
                await checkSession(); // Decode and set user
                return true;
            }
        } catch (e) {
            console.error("Login failed", e);
        }
        return false;
    };

    const signupInit = async (email: string, pass: string, tgId: string) => {
        try {
            await api.post("/signup", { email, password: pass, telegram_id: tgId });
            return true; // OTP Sent
        } catch (e) {
            console.error("Signup Init failed", e);
            throw e; // Let UI handle error message
        }
    };

    const verifyOtp = async (email: string, otp: string) => {
        try {
            const res = await api.post("/verify-otp", { email, otp });
            if (res.data.token) {
                localStorage.setItem("jwtToken", res.data.token);
                await checkSession();
                return true;
            }
        } catch (e) {
            console.error("OTP Verify failed", e);
        }
        return false;
    };

    return (
        <AuthContext.Provider value={{ user, login, signupInit, verifyOtp, logout, checkSession, isGlobalFireActive, setGlobalFireActive }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
