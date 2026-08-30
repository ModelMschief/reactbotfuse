import axios, { AxiosError } from "axios";

// Dynamic API URL detection for Vite
const getBaseUrl = () => {
    // Check for Vite environment variable
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
        return envUrl;
    }

    // Default: Use production backend
    return "https://botfusion.onrender.com";
};

export const API_BASE_URL = getBaseUrl();

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("jwtToken");
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
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
            if (status === 401) {
                console.warn("Session expired or invalid. Logging out.");
                localStorage.removeItem("jwtToken");
                // For HashRouter, we need to use hash-based redirect
                if (!window.location.hash.includes("/login")) {
                    window.location.hash = "#/login";
                }
            }

            // 429 Rate Limit
            if (status === 429) {
                console.error("Too many requests. Please slow down.");
            }
        }
        // IMPORTANT: Return the full error object so callers can access error.response.data
        return Promise.reject(error);
    }
);
