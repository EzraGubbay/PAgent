import { loadUserData } from "@/utils/userData";
import { SOCKET_URL } from "@/api/config";
import { authenticatedFetch } from "@/api/fetch";

const API_URL = SOCKET_URL.endsWith('/') ? SOCKET_URL.slice(0, -1) : SOCKET_URL;

export const sendMessage = async (prompt: string) => {
    const userData = await loadUserData();
    
    const response = await authenticatedFetch(`${API_URL}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            prompt: prompt,
            notificationToken: userData?.notificationToken || null,
        })
    });

    if (!response.ok) {
        throw new Error("Failed to send message via HTTP");
    }

    return await response.json();
}

export const remoteEraseAssistantChat = async () => {
    const userData = await loadUserData();
    
    const response = await authenticatedFetch(`${API_URL}/loadNewChat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    });

    if (!response.ok) {
        throw new Error("Failed to clear chat via HTTP");
    }

    return await response.json();
}