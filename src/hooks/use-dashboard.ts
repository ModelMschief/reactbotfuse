
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface Bot {
    token: string;
    username: string;
    user_count: number;
}

export interface Task {
    _id: string;
    id: string; // Frontend compatibility
    type: "broadcast" | "file_parse";
    status: "pending" | "running" | "stopped" | "complete" | "failed";
    progress: {
        total?: number;
        sent?: number;
        failed?: number;
        found?: number;
        added?: number;
    };
    created_at: string;
}

export interface Plan {
    type: "free" | "premium" | "free (expired)";
    expiry?: string;
}

export function useDashboard() {
    const [bots, setBots] = useState<Bot[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [plan, setPlan] = useState<Plan>({ type: "free" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDashboard = useCallback(async () => {
        try {
            const res = await api.get("/dashboard");
            setBots(res.data.bots);
            // Ensure tasks map _id to id if missing
            const mappedTasks = res.data.tasks.map((t: any) => ({
                ...t,
                id: t.id || t._id
            }));
            setTasks(mappedTasks.reverse()); // Newest first
            setPlan(res.data.plan);
            setError("");
        } catch (err) {
            console.error("Failed to fetch dashboard", err);
            // Don't set global error to avoid blocking UI, just log it
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const addBot = async (token: string) => {
        try {
            const res = await api.post("/add-bot", { bot_token: token });
            await fetchDashboard(); // Refresh list
            return { success: true, message: res.data.message };
        } catch (err: any) {
            return { success: false, message: err.response?.data?.error || "Failed to add bot" };
        }
    };

    const deleteBot = async (token: string) => {
        try {
            await api.post("/delete-bot", { bot_token: token });
            setBots(prev => prev.filter(b => b.token !== token));
            return true;
        } catch (err) {
            console.error("Failed to delete bot", err);
            return false;
        }
    };

    return {
        bots,
        tasks,
        plan,
        loading,
        error,
        refresh: fetchDashboard,
        addBot,
        deleteBot,
        uploadUsers: async (botToken: string, file: File) => {
            const formData = new FormData();
            formData.append("bot_token", botToken);
            formData.append("file", file);

            try {
                const res = await api.post("/upload-users", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                });
                fetchDashboard();
                return { success: true, message: res.data.message };
            } catch (err: any) {
                return { success: false, message: err.response?.data?.error || err.message || "Upload failed" };
            }
        }
    };
}
