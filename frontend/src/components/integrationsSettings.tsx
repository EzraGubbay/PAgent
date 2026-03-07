import { Image, StyleSheet, Text, TouchableOpacity, View, Alert, Platform } from "react-native";
import { API_URL, GOOGLE_OAUTH_CLIENT_ID_IOS, GOOGLE_OAUTH_CLIENT_ID_WEB } from "@/api/config";
import { authenticatedFetch } from "@/api/fetch";

// Google Auth and Expo Secure Storage
import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin";
import { setItemAsync } from "expo-secure-store";
import { addIntegration, hasIntegration, loadUserData, dataKeys } from "@/utils";
import { removeIntegration } from "@/api/integration";
import { useEffect, useState } from "react";

GoogleSignin.configure({
    iosClientId: GOOGLE_OAUTH_CLIENT_ID_IOS,
    webClientId: GOOGLE_OAUTH_CLIENT_ID_WEB,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    scopes: [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
    ],
});

export const IntegrationsSettings = () => {

    const [integrationActive, setIntegrationActive] = useState(false);

    useEffect(() => {
        const checkIntegration = async () => {
            setIntegrationActive(await hasIntegration("google"));
        }
        checkIntegration();
    }, []);

    const handleIntegrationPress = () => {
        if (integrationActive) {
            promptRevokeIntegration();
        } else {
            triggerGoogleAuth();
        }
    };

    const promptRevokeIntegration = () => {
        Alert.alert(
            "Revoke Integration",
            "Are you sure you want to disconnect Google Calendar? PAgent will no longer be able to schedule or read your events.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Disconnect",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const success = await removeIntegration("google");
                            if (success) {
                                setIntegrationActive(false);
                            } else {
                                Alert.alert("Error", "Could not remove integration right now.");
                            }
                        } catch (e) {
                            Alert.alert("Error", "Failed to disconnect integration.");
                            console.error(e);
                        }
                    },
                },
            ]
        );
    };

    const triggerGoogleAuth = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            console.log(userInfo);

            if (isSuccessResponse(userInfo)) {
                const { idToken, serverAuthCode } = userInfo.data;

                await sendToPythonBackend(serverAuthCode);
            } else {
                console.log("Sign-in process cancelled.");
            }
        } catch (error) {
            console.log("Google Auth Failed:", error);
        }
    };

    const sendToPythonBackend = async (code: string | null) => {
        if (!code) return;
        const response = await authenticatedFetch(`${API_URL}/integrations/providers/google/exchange`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
                code: code,
             }),
        });

        console.log(response);
        if (!response.ok) throw new Error("Token rejected by server.");

        const sessionData = await response.json();

        // Store backend session securely.
        await setItemAsync(dataKeys.integrationData.google, JSON.stringify(sessionData));
        await addIntegration("google");
        setIntegrationActive(true);
    }

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Integrations</Text>
            <TouchableOpacity onPress={handleIntegrationPress} activeOpacity={0.7}>
                <View style={[styles.integration, styles.poppedOut]}>
                    <View style={styles.integrationText}>
                        <Text style={styles.integrationName}>Google Calendar</Text>
                        <Text style={[
                            styles.integrationDescription,
                            integrationActive ? { color: "#4cd137", fontWeight: '600' } : null
                        ]}>
                            {integrationActive ? "Active" : "Sync your Google Calendar with PAgent"}
                        </Text>
                    </View>
                    <Image source={require("@assets/Google_Calendar_Logo_512px.png")} style={styles.integrationIcon} />
                </View>
                {integrationActive && (
                    <Text style={styles.removeText}>Tap to remove</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7}>
                <View style={[styles.integration, styles.poppedOut, { opacity: 0.6 }]}>
                    <View style={styles.integrationText}>
                        <Text style={styles.integrationName}>Todoist</Text>
                        <Text style={styles.integrationDescription}>Sync your To-Do List with PAgent</Text>
                    </View>
                    <Image source={require("@assets/todoist-icon.png")} style={styles.integrationIcon} />
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#888",
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    integration: {
        backgroundColor: "#2C2C2C",
        borderRadius: 12,
        padding: 15,
        marginBottom: 6,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    poppedOut: {
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
            },
            android: {
                elevation: 6,
            },
            web: {
                boxShadow: "0px 4px 5px rgba(0, 0, 0, 0.3)",
            }
        })
    },
    integrationText: {
        flexDirection: "column",
    },
    integrationName: {
        color: "#E0E0E0",
        fontSize: 16,
        fontWeight: "600",
    },
    integrationDescription: {
        color: "#E0E0E0",
        fontSize: 14,
        marginTop: 4,
    },
    integrationIcon: {
        width: 44,
        height: 44,
    },
    removeText: {
        color: "#ff4d4d",
        fontSize: 12,
        fontWeight: "500",
        textAlign: "center",
        marginBottom: 16,
        marginTop: 2,
    }
})