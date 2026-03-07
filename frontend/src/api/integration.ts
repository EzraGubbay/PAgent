import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./config";
import { loadUserData, dataKeys } from "@/utils";
import { authenticatedFetch } from "./fetch";

export const removeIntegration = async (provider: string): Promise<boolean> => {
    const integrations = await AsyncStorage.getItem(dataKeys.integrations);
    if (!integrations) return false;

    const userData = await loadUserData();

    // Revoke Integration remotely
    const response = await authenticatedFetch(`${API_URL}/integrations/providers/${provider}/revoke`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            provider: provider,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to revoke integration");
    }

    const parsedIntegrations = JSON.parse(integrations);
    delete parsedIntegrations[provider];
    await AsyncStorage.setItem(dataKeys.integrations, JSON.stringify(parsedIntegrations));
    return true;
}

export const hasIntegrationRemote = async (provider: string): Promise<boolean> => {
    const integrations = await AsyncStorage.getItem(dataKeys.integrations);
    if (!integrations) return false;

    const userData = await loadUserData();

    // Check Integration remotely
    const response = await authenticatedFetch(`${API_URL}/integrations/providers/${provider}/validate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            provider: provider,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to validate integration");
    }

    const parsedIntegrations = JSON.parse(integrations);
    return parsedIntegrations[provider] ?? false;
}