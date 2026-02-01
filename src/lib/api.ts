import axios, { AxiosError } from "axios";

// Dynamic API URL detection for cross-device development
// In production, use NEXT_PUBLIC_API_URL. In development, detect the host dynamically.
const getBaseUrl = () => {
    // Server-side: use environment variable or default
    if (typeof window === "undefined") {
        return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    }

    // Client-side: If env variable is set, use it
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // Client-side development: Use the same host as frontend, but on port 8080
    // This allows testing from phones/other devices on the same network
    const { hostname, protocol } = window.location;
    return `${protocol}//${hostname}:8080`;
};

const BASE_URL = getBaseUrl();

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("jwtToken");
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response Interceptor: Handle Errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response) {
            const { status } = error.response;

            // 401 Unauthorized -> Clear Session & Redirect
            if (status === 401 && typeof window !== "undefined") {
                console.warn("Session expired or invalid. Logging out.");
                localStorage.removeItem("jwtToken");
                // Optional: Trigger a custom event or redirect
                if (!window.location.pathname.includes("/login")) {
                    window.location.href = "/login";
                }
            }

            // 429 Rate Limit
            if (status === 429) {
                console.error("Too many requests. Please slow down.");
                // We could implement auto-retry here if needed
            }
        }
        // IMPORTANT: Return the full error object so callers can access error.response.data
        return Promise.reject(error);
    }
);
