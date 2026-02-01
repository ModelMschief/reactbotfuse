"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
    email: string;
    isPremium: boolean;
    telegramId?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, pass: string) => Promise<boolean>;
    signup: (email: string, pass: string, tgId: string) => Promise<boolean>;
    logout: () => void;
    redeemCode: (code: string) => boolean;
    isGlobalFireActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isGlobalFireActive, setGlobalFireActive] = useState(false);
    const router = useRouter();

    // Simulate persistent session - DISABLED for Prototype to ensure Landing Page testing
    // useEffect(() => {
    //     const savedUser = localStorage.getItem("app_user");
    //     if (savedUser) {
    //         setUser(JSON.parse(savedUser));
    //     }
    // }, []);

    const login = async (email: string, pass: string) => {
        // Mock Logic
        if (email === "s@s.com" && pass === "user") {
            const mockUser = { email, isPremium: false }; // Default standard
            setUser(mockUser);
            localStorage.setItem("app_user", JSON.stringify(mockUser));
            return true;
        }
        return false;
    };

    const signup = async (email: string, pass: string, tgId: string) => {
        if (email && pass && tgId) {
            const mockUser = { email, isPremium: false, telegramId: tgId };
            setUser(mockUser);
            localStorage.setItem("app_user", JSON.stringify(mockUser));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("app_user");
        router.push("/login");
    };

    const redeemCode = (code: string) => {
        if (code === "redeem" && user) {
            const updatedUser = { ...user, isPremium: true };
            setUser(updatedUser);
            localStorage.setItem("app_user", JSON.stringify(updatedUser));

            // Trigger Fire Effect
            setGlobalFireActive(true);
            setTimeout(() => setGlobalFireActive(false), 3000); // 3s visual effect
            return true;
        }
        return false;
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, redeemCode, isGlobalFireActive }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
