import { API_URL } from "./config";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "@/utils/userData";
import { router } from "expo-router";

async function refreshAuthTokens(): Promise<string | null> {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    try {
        const response = await fetch(`${API_URL}/refreshToken`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${refreshToken}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.status && data.accessToken && data.refreshToken) {
                await saveTokens(data.accessToken, data.refreshToken);
                return data.accessToken;
            }
        }
    } catch (error) {
        console.error("Error refreshing token:", error);
    }
    return null;
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    let accessToken = await getAccessToken();

    // Standardize headers and inject Bearer Token
    const headers = new Headers(options.headers);
    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    let response = await fetch(url, { ...options, headers });

    // Handle Token Expiration
    if (response.status === 401) {
        console.log("Access token expired, attempting refresh...");
        accessToken = await refreshAuthTokens();

        if (accessToken) {
            // Retry the original request with the new token
            headers.set("Authorization", `Bearer ${accessToken}`);
            response = await fetch(url, { ...options, headers });
        } else {
            // Refresh failed or no refresh token available --> Log out user
            console.log("Refresh failed. Logging out.");
            await clearTokens();
            router.replace('/auth');
        }
    }

    return response;
}
