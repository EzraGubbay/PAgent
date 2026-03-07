import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { UserData } from "@/types";
import { hasIntegrationRemote } from "@/api/integration";

export const loadUserData = async (): Promise<UserData | null> => {
    try {
        const storedData = await AsyncStorage.getItem(dataKeys.userData);
        if (storedData) {
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error("Error loading user data:", error);
    }
    return null;
}

export const saveUserData = async (userData: UserData) => {
    try {
        await AsyncStorage.setItem(dataKeys.userData, JSON.stringify(userData));
    } catch (error) {
        console.error("Error saving user data:", error);
    }
}

export const clearUserData = async () => {
    try {
        await AsyncStorage.removeItem(dataKeys.userData);
    } catch (error) {
        console.error("Error clearing user data:", error);
    }
}

export const saveTokens = async (accessToken: string, refreshToken: string) => {
    try {
        await SecureStore.setItemAsync(dataKeys.tokens.access, accessToken);
        await SecureStore.setItemAsync(dataKeys.tokens.refresh, refreshToken);
    } catch (error) {
        console.error("Error saving secure tokens:", error)
    }
}

export const getAccessToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(dataKeys.tokens.access);
    } catch (error) {
        console.error("Error retrieving access token:", error)
        return null;
    }
}

export const getRefreshToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(dataKeys.tokens.refresh);
    } catch (error) {
        console.error("Error retrieving refresh token:", error)
        return null;
    }
}

export const clearTokens = async () => {
    try {
        await SecureStore.deleteItemAsync(dataKeys.tokens.access);
        await SecureStore.deleteItemAsync(dataKeys.tokens.refresh);
    } catch (error) {
        console.error("Error clearing secure tokens:", error)
    }
}

export const addIntegration = async (provider: string) => {
    await AsyncStorage.mergeItem(dataKeys.integrations, JSON.stringify({
        [provider]: true
    }));
}

export const hasIntegrationLocal = async (provider: string): Promise<boolean> => {
    const integrations = await AsyncStorage.getItem(dataKeys.integrations);
    if (!integrations) return false;
    return JSON.parse(integrations)[provider] ?? false;
}

export const hasIntegration = async (provider: string): Promise<boolean> => {
    /**
     * Validate and synchronize integration information between
     * local data and what's on the backend.
     * 
     * Returns true if the integration exists (on the backend),
     * false if it doesn't (on the backend).
     * 
     * Note: The backend is the single source of truth in this case.
     */
    const local = await hasIntegrationLocal(provider);
    const remote = await hasIntegrationRemote(provider);

    // Handle discrepancies between local and remote integrations.
    if (!remote && local) {
        // Remove integration locally.
        await AsyncStorage.mergeItem(dataKeys.integrations, JSON.stringify({
            [provider]: false
        }));
        return false;
    } else if (remote && !local) {
        // Add integration locally.
        await AsyncStorage.mergeItem(dataKeys.integrations, JSON.stringify({
            [provider]: true
        }));
        return true;
    }
    return local && remote;
}

export const showAllStoredData = async () => {
    // Retrieve actual keys as listed from AsyncStorage
    console.log("AsyncStorage Keys:");
    console.log(await AsyncStorage.getAllKeys());
}

export const dataKeys = {
    userData: "@UserData",
    chatHistory: "@ChatHistory",
    integrations: "@Integrations",
    tokens: {
        access: "secure_access_token",
        refresh: "secure_refresh_token"
    },
    integrationData: {
        google: "GoogleSessionData",
        todoist: "TodoistSessionData"
    }
}
