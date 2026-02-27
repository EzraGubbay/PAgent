import React, { useState, useEffect } from "react";
import {
    Text,
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Platform,
    StatusBar,
    Modal,
    Switch,
    Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { remoteEraseAssistantChat } from "@/api/ai";
import { loadUserData, saveUserData } from "@/utils/userData";
import { UserData } from "@/types/data";
import * as Clipboard from 'expo-clipboard';
import { Header } from "@/components/settingsHeader";
import { useAuthService } from "@/context/AuthContext";

const MODAL_WIDTH = 80;

export default function SettingsScreen({ navigation, route }: { navigation: any, route: any }) {
    const [userData, setUserData] = useState<UserData>({
        uid: "",
        username: "",
        notificationToken: "",
        receiveNotifications: false,
    })

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
                                await AsyncStorage.removeItem("@chatHistory");
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

    const updateReceiveNotificationsSetting = async (value: boolean) => {
        const updatedUserData = { ...userData, receiveNotifications: value };
        setUserData(updatedUserData);
        await saveUserData(updatedUserData);
    }

    useEffect(() => {
        loadUserData().then((data) => {
            setUserData(data);
        });
    }, []);

    const [notificationUpdateToken, setNotificationUpdateToken] = useState('');

    const [showEditTokenModal, setShowEditTokenModal] = useState(false);

    const { logout } = useAuthService();

    const closeEditTokenModal = async () => {
        setShowEditTokenModal(false);
        const updatedUserData = { ...userData, notificationToken: notificationUpdateToken };
        console.log(updatedUserData);
        setUserData(updatedUserData);
        await saveUserData(updatedUserData);
        console.log("User data after saving:", await loadUserData());
        setNotificationUpdateToken('');
    };

    const signOut = () => {
        logout();
    }

    return (
        <SafeAreaView style={styles.container}>

            {/* Header */}
            <Header />

            <View style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data Management</Text>
                    <TouchableOpacity style={styles.dangerButton} onPress={() => eraseAssistantChat()}>
                        <Feather name="trash-2" size={20} color="#FF453A" style={{ marginRight: 10 }} />
                        <Text style={styles.dangerButtonText}>Erase Assistant Chat</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#2C2C2C",
                            borderRadius: 12,
                        }}>
                        <View
                            style={{
                                width: "85%",
                                borderTopLeftRadius: 12,
                                borderBottomLeftRadius: 12,
                                paddingVertical: 15,
                                paddingLeft: 15,
                            }}>
                            <Text style={{ color: "#E0E0E0", fontSize: 16 }}>
                                {userData.notificationToken.length > 30
                                    ? userData.notificationToken.substring(0, 30) + "..."
                                    : userData.notificationToken}
                            </Text>
                        </View>
                        <View
                            style={{
                                width: "15%",
                                borderTopRightRadius: 12,
                                borderBottomRightRadius: 12,
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: 1,
                                borderColor: "#3A3A3A",
                                paddingVertical: 15,
                            }}>
                            <TouchableOpacity onPress={() => setShowEditTokenModal(true)}>
                                <Feather name="edit" size={18} color="#E0E0E0" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
                        <Text style={{
                            color: "#E0E0E0",
                            fontSize: 16,
                            fontWeight: "semibold",
                            marginLeft: 15,
                        }}>Receive Notifications</Text>
                        <Switch
                            trackColor={{ false: "#3A3A3A", true: "#36c54bff" }}
                            thumbColor="#E0E0E0"
                            ios_backgroundColor="#3A3A3A"
                            style={{ marginRight: 15 }}
                            onValueChange={(value) => updateReceiveNotificationsSetting(value)}
                            value={userData.receiveNotifications ?? false}
                        />
                    </View>
                </View>
                <TouchableOpacity onPress={signOut}>
                    <View
                    style={{
                        width: "85%",
                        borderTopLeftRadius: 12,
                        borderBottomLeftRadius: 12,
                        paddingVertical: 15,
                        paddingLeft: 15,
                    }}>
                            <Text style={styles.settingsText}>
                                Sign Out
                            </Text>
                    </View>
                </TouchableOpacity>
            </View>
            {showEditTokenModal &&
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showEditTokenModal}
                    onRequestClose={() => {
                        setShowEditTokenModal(false);
                    }}
                >
                    <View style={styles.editModalBackgroundShadow}>
                        <View style={styles.editTokenModal}>
                            <View style={styles.modalHeader}>

                                {/* Spacer */}
                                <View />
                                <Text style={styles.editTokenTitle}>Edit Notification Token</Text>
                                <TouchableOpacity style={styles.closeEditTokenModalButton} onPress={() => setShowEditTokenModal(false)}>
                                    <Feather name="x" size={24} color="#FF453A" />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.editTokenInput}
                                placeholder="Enter Notification Token"
                                placeholderTextColor="#6C6C6C"
                                value={notificationUpdateToken}
                                onChangeText={setNotificationUpdateToken}
                            />
                            <View style={styles.editModalTokenButtonContainer}>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            const text = await Clipboard.getStringAsync();
                                            setNotificationUpdateToken(text);
                                        }}
                                        style={{
                                            ...styles.editModalTokenButton,
                                            borderRadius: 0,
                                            borderTopLeftRadius: 12,
                                            borderBottomLeftRadius: 12,
                                        }}>
                                        <Feather name="clipboard" size={24} color="#E0E0E0" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setNotificationUpdateToken("");
                                        }}
                                        style={{
                                            ...styles.editModalTokenButton,
                                            borderRadius: 0,
                                            borderTopRightRadius: 12,
                                            borderBottomRightRadius: 12,
                                        }}>
                                        <Feather name="trash" size={24} color="#FF453A" />
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    style={{ ...styles.editModalTokenButton, width: 70 }}
                                    onPress={() => closeEditTokenModal()}>
                                    <Text style={styles.settingsText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            }
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1C1C1C",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#333",
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#E0E0E0",
    },
    content: {
        flex: 1,
        padding: 20,
    },
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
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginVertical: 30,
        width: "100%",
    },
    closeEditTokenModalButton: {
        paddingRight: 5,
        marginBottom: 20,
        marginTop: -20,
    },
    editTokenModal: {
        backgroundColor: "#1C1C1C",
        alignItems: "center",
        justifyContent: "space-between",
        width: `${MODAL_WIDTH}%`,
        height: "30%",
        borderRadius: 12,
    },
    editTokenTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#E0E0E0",
        marginLeft: 30,
    },
    editTokenInput: {
        backgroundColor: "#2C2C2C",
        color: "#E0E0E0",
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 12,
        height: 50,
        width: "90%",
    },
    editModalTokenButton: {
        width: 60,
        height: 50,
        backgroundColor: "#2C2C2C",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#3A3A3A",
        justifyContent: "center",
        alignItems: "center",
    },
    editModalTokenButtonContainer: {
        width: "90%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: 12,
        height: 50,
        marginVertical: 15,
    },
    settingsText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#E0E0E0",
    },
    editModalBackgroundShadow: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1000,
        position: "absolute",
    },
});