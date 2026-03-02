import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useAuthService } from "@/context/AuthContext";

export const SignOutButton = () => {
    
    const { logout } = useAuthService();

    return (
        <View
            style={{
                width: "85%",
                borderTopLeftRadius: 12,
                borderBottomLeftRadius: 12,
                paddingVertical: 15,
                paddingLeft: 15,
        }}>
            <TouchableOpacity onPress={logout}>
                <Text style={styles.settingsText}>
                    Sign Out
                </Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    settingsText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#E0E0E0",
    },
})