import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

export interface User {
    id: string; // From 'sub'
    email?: string;
    isPremium: boolean;
    telegramId?: string;
    telegramVerified?: boolean;
    authProviders?: string[];
    profilePicture?: string;
    displayName?: string;
    planExpiry?: string;
}

interface DecodedToken {
    sub: string;
    exp: number;
    ver?: number;
    email?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<boolean>;
    loginWithToken: (token: string, completeProfile?: boolean) => Promise<void>;
    signupInit: (email: string, pass: string, tgId: string) => Promise<boolean>; // Returns true if OTP sent
    verifyOtp: (email: string, otp: string) => Promise<boolean>;
    logout: () => void;
    checkSession: () => Promise<void>;
    updateUserTelegram: (telegramId: string, verified: boolean) => void;
    showTelegramModal: boolean;
    setShowTelegramModal: (open: boolean) => void;
    isGlobalFireActive: boolean;
    setGlobalFireActive: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showTelegramModal, setShowTelegramModal] = useState(false);
    const [isGlobalFireActive, setGlobalFireActive] = useState(false);
    const navigate = useNavigate();

    // Define logout first (needed by checkSession)
    const logout = useCallback(() => {
        setUser(null);
        setShowTelegramModal(false);
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userEmail");
        sessionStorage.removeItem("tg_banner_dismissed");
        navigate("/login");
    }, [navigate]);

    // Define checkSession (depends on logout)
    const checkSession = useCallback(async () => {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            const decoded = jwtDecode<DecodedToken>(token);
            // Check expiry
            if (decoded.exp * 1000 < Date.now()) {
                logout();
                setIsLoading(false);
                return;
            }

            const savedEmail = localStorage.getItem("userEmail") || decoded.email || undefined;
            const initialUser: User = {
                id: decoded.sub,
                email: savedEmail,
                isPremium: false,
                telegramVerified: false,
                authProviders: ["local"]
            };
            setUser(initialUser);

            // Fetch live profile from /dashboard
            try {
                const res = await api.get("/dashboard");
                if (res.data?.user) {
                    const u = res.data.user;
                    const isPrem = u.plan === "premium" || (typeof res.data.plan === "object" && res.data.plan?.type === "premium");
                    setUser({
                        id: u.id || decoded.sub,
                        email: u.email || savedEmail,
                        isPremium: isPrem,
                        telegramId: u.telegram_id || undefined,
                        telegramVerified: u.telegram_verified ?? Boolean(u.telegram_id),
                        authProviders: u.auth_providers || ["local"],
                        profilePicture: u.profile_picture || undefined,
                        displayName: u.display_name || undefined,
                        planExpiry: u.plan_expiry || (typeof res.data.plan === "object" ? res.data.plan?.expiry : undefined)
                    });
                    if (u.email) {
                        localStorage.setItem("userEmail", u.email);
                    }
                }
            } catch (profileErr) {
                console.warn("Could not fetch extended profile info", profileErr);
            }
        } catch (e) {
            console.error("Invalid token", e);
            logout();
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    // Check session on load
    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const loginWithToken = useCallback(async (token: string, completeProfile?: boolean) => {
        localStorage.setItem("jwtToken", token);
        await checkSession();
        if (completeProfile) {
            setShowTelegramModal(true);
        }
    }, [checkSession]);

    const updateUserTelegram = useCallback((telegramId: string, verified: boolean) => {
        setUser((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                telegramId,
                telegramVerified: verified
            };
        });
        setShowTelegramModal(false);
    }, []);

    const login = async (email: string, pass: string) => {
        try {
            const res = await api.post("/login", { email, password: pass });
            if (res.data.token) {
                localStorage.setItem("jwtToken", res.data.token);
                localStorage.setItem("userEmail", email);
                await checkSession(); // Decode and set user
                return true;
            }
        } catch (e) {
            console.error("Login failed", e);
            throw e;
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
                localStorage.setItem("userEmail", email);
                await checkSession();
                return true;
            }
        } catch (e) {
            console.error("OTP Verify failed", e);
            throw e;
        }
        return false;
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            loginWithToken,
            signupInit,
            verifyOtp,
            logout,
            checkSession,
            updateUserTelegram,
            showTelegramModal,
            setShowTelegramModal,
            isGlobalFireActive,
            setGlobalFireActive
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
