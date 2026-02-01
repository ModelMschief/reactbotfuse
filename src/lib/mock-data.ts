
// --- Types ---
export interface BotData {
    id: string;
    name: string;
    username: string;
    userCount: number;
    status: "active" | "maintenance";
}

export interface KeyData {
    id: string;
    key: string;
    createdAt: string;
    status: "active" | "revoked";
}

// --- Data ---

export const MOCK_BOTS: BotData[] = [
    { id: "1", name: "Support Bot", username: "@support_help_bot", userCount: 12450, status: "active" },
    { id: "2", name: "Sales Agent", username: "@sales_fire_bot", userCount: 890, status: "active" },
    { id: "3", name: "Moderator", username: "@mod_shield_bot", userCount: 4500, status: "active" },
    { id: "4", name: "Testing Unit", username: "@test_v2_bot", userCount: 12, status: "maintenance" },
];

export const MOCK_KEYS: KeyData[] = [
    { id: "k1", key: "sk_live_982374928374", createdAt: "2024-01-15", status: "active" },
    { id: "k2", key: "sk_test_293847293847", createdAt: "2024-01-20", status: "revoked" },
];

export const DASHBOARD_STATS = [
    {
        title: "Active Bots",
        value: "4",
        change: "+1 new",
        trend: "up" as const,
        iconName: "Bot",
    },
    {
        title: "Total Users",
        value: "17,852",
        change: "+12% vs last week",
        trend: "up" as const,
        iconName: "Users",
    },
    {
        title: "API Keys",
        value: "2",
        change: "1 revoked",
        trend: "neutral" as const,
        iconName: "Key",
    },
];
