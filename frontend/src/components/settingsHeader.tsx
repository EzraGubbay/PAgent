import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";

export const Header = () => {

    const back = () => {
        router.back();
    }

    return (
        <Stack.Screen
            options={{
                header: () => (
                    <View style={styles.header}>
                        <TouchableOpacity onPress={back} style={styles.backButton}>
                            <Feather name="arrow-left" size={24} color="#E0E0E0" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Settings</Text>
                        <View style={{ width: 24 }} />
                    </View>
                )
            }}
        />
    )
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        height: 90,
        paddingTop: 50,
        paddingHorizontal: 20,
        backgroundColor: "#1C1C1C",
        borderBottomWidth: 1,
        borderBottomColor: "#333",
        alignItems: "center",
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#E0E0E0",
    },
})