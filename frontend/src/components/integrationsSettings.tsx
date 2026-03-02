import { Image, StyleSheet, Text, TouchableOpacity, View, } from "react-native";
import { API_URL } from "@/api/config";

// Google Auth and Expo Secure Storage
import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin";
import { setItemAsync } from "expo-secure-store";
import * as Linking from "expo-linking";

const returnUrl = Linking.createURL("/integrations/providers/google/auth-callback");
const startWebAuth = async () => {
    const authUrl = `${API_URL}/integrations`
}

GoogleSignin.configure({
    iosClientId: "179693221872-4re7nd7o3tr2kcoaffrlspjin68hm8ep.apps.googleusercontent.com",
    webClientId: "179693221872-rcpbqb4rfh5lrmqd17lo092244ign97r.apps.googleusercontent.com",
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    scopes: [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
    ],
});

export const IntegrationsSettings = () => {


    const triggerGoogleAuth = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            console.log(userInfo);

            if (isSuccessResponse(userInfo)) {
                const { idToken, serverAuthCode } = userInfo.data;

                await sendToPythonBackend(idToken);
            } else {
                console.log("Sign-in process cancelled.");
            }
        } catch (error) {
            console.log("Google Auth Failed:", error);
        }
    };

    const sendToPythonBackend = async (token: string | null) => {
        if (!token) return;
        const response = await fetch(`${API_URL}/integrations/providers/google/exchange`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
        });

        if (!response.ok) throw new Error("Token rejected by server.");

        const sessionData = await response.json();

        // Store backend session securely.
        await setItemAsync("sessionData", sessionData);
    }

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Integrations</Text>
            <TouchableOpacity onPress={triggerGoogleAuth}>
                <View style={styles.integration}>
                    <View style={styles.integrationText}>
                        <Text style={styles.integrationName}>Google Calendar</Text>
                        <Text style={styles.integrationDescription}>Sync your Google Calendar with PAgent</Text>
                    </View>
                    <Image source={require("@assets/Google_Calendar_Logo_512px.png")} style={styles.integrationIcon} />
                </View>
            </TouchableOpacity>

            <View style={styles.integration}>
                <View style={styles.integrationText}>
                    <Text style={styles.integrationName}>Todoist</Text>
                    <Text style={styles.integrationDescription}>Sync your To-Do List with PAgent</Text>
                </View>
                <Image source={require("@assets/todoist-icon.png")} style={styles.integrationIcon} />
            </View>
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
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    integrationText: {
        flexDirection: "column",
    },
    integrationName: {
        color: "#E0E0E0",
        fontSize: 16,
        fontWeight: "semibold",
    },
    integrationDescription: {
        color: "#E0E0E0",
        fontSize: 14,
    },
    integrationIcon: {
        width: 50,
        height: 50,
    },
})