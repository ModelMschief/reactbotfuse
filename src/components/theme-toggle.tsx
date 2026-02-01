"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const [theme, setTheme] = useState("dark");

    useEffect(() => {
        // Check initial preference
        const isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "dark" : "light");
    }, []);

    const toggleTheme = () => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.remove("dark");
            setTheme("light");
        } else {
            root.classList.add("dark");
            setTheme("dark");
        }
    };

    return (
        <button onClick={toggleTheme} className="btn btn-ghost" aria-label="Toggle Theme">
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
}
