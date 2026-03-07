import { useState } from "react";
import { View, Text, TouchableOpacity, Switch, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { UserData } from "@/types/data";
import { saveUserData, loadUserData } from "@/utils";
import { useToggle } from "@/hooks";

export const NotificationsSettings = ({
    updatedNotificationToken,
    openModal,
}: {
    updatedNotificationToken: string,
    openModal: () => void,
}) => {

    const [userData, setUserData] = useState<UserData>({
            uid: "",
            email: "",
            notificationToken: "",
            receiveNotifications: false,
    });

    const updateReceiveNotificationsSetting = async (value: boolean) => {
        if (userData) {
            const updatedUserData: UserData = { ...userData, receiveNotifications: value };
            setUserData(updatedUserData);
            await saveUserData(updatedUserData);
        }
    };

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#2C2C2C",
                    borderRadius: 12,
                }}>

                {/* Preview Notification Token */}
                <View
                    style={{
                        width: "85%",
                        borderTopLeftRadius: 12,
                        borderBottomLeftRadius: 12,
                        paddingVertical: 15,
                        paddingLeft: 15,
                    }}>
                    <Text style={{ color: "#E0E0E0", fontSize: 16 }}>
                        {updatedNotificationToken.length > 30
                            ? updatedNotificationToken.substring(0, 30) + "..."
                            : updatedNotificationToken}
                    </Text>
                </View>

                {/* Edit Token Button */}
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
                    <TouchableOpacity onPress={openModal}>
                        <Feather name="edit" size={18} color="#E0E0E0" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Receive Notifications Toggle */}
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
})