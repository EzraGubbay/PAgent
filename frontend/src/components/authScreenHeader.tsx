import { View } from "react-native";
import { Stack } from "expo-router";

export const Header = () => (
    <Stack.Screen
        options={{
            animation: 'fade',
            animationDuration: 0.2,
            header: () => (
                <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    height: 90,
                    paddingTop: 50,
                    paddingHorizontal: 20,
                    backgroundColor: "#1C1C1C",
                }} />
            )
        }}
    />
)