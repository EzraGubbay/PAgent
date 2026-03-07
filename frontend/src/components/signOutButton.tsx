import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useAuthService } from "@/context/AuthContext";

export const SignOutButton = () => {
    
    const { logout } = useAuthService();

    return (
        <View
            style={styles.signOutContainer}>
            <TouchableOpacity style={styles.signOutButton} onPress={logout}>
                <Text style={styles.signOutText}>
                    Sign Out
                </Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    signOutContainer: {
        width: "60%",
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        paddingVertical: 15,
        alignSelf: "center",
        alignItems: "center"
        
    },
    signOutButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2C2C2C",
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#3A3A3A",
    },
    signOutText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#FF453A",
        width: "100%",
        textAlign: "center"
    },
})