import { View, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { remoteEraseAssistantChat } from "@/api/ai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dataKeys } from "@/utils";

export const DataManagementSettings = ({ route }: { route: any }) => {

    const eraseAssistantChat = async () => {
        Alert.alert(
            "Confirm",
            "Are you sure you want to erase your chat history?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "OK", onPress: async () => {
                        try {
                            const response = await remoteEraseAssistantChat();
                            console.log(response);
                            if (response.status == 'success') {
                                await AsyncStorage.removeItem(dataKeys.chatHistory);
                                if (route.params?.onChatErased) {
                                    route.params.onChatErased();
                                }
                                alert("Chat history erased successfully!");
                            }
                        } catch (error) {
                            console.error("Error erasing assistant chat:", error);
                        }
                    }
                },
            ],
            { cancelable: false }
        );
    }

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            <TouchableOpacity style={styles.dangerButton} onPress={() => eraseAssistantChat()}>
                <Feather name="trash-2" size={20} color="#FF453A" style={{ marginRight: 10 }} />
                <Text style={styles.dangerButtonText}>Erase Assistant Chat</Text>
            </TouchableOpacity>
        </View>
    )
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
    dangerButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2C2C2C",
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#3A3A3A",
    },
    dangerButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FF453A",
    },
})