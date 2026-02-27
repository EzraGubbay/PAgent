import {
    View,
    Text,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { Stack, Link, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export const Header = (
    {
        connectionStatus,
        messageQueueFlushed
    }: {
        connectionStatus: boolean,
        messageQueueFlushed: boolean,
    }) => {

    return (
        <Stack.Screen
            options={{ 
                header: () => (
                <View style={{
                flexDirection: "row",
                justifyContent: "space-between",
                height: 90,
                paddingTop: 50,
                paddingHorizontal: 20,
                backgroundColor: "#1C1C1C",
            }}>
                {/* <View /> */}
                <View style={{
                    backgroundColor: connectionStatus ? "#00FF00" : "#FF0000",
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                }}>

                </View>
                <Text style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#E0E0E0",
                }}>
                    {connectionStatus
                        ? messageQueueFlushed
                            ? "Assistant"
                            : <>
                                <ActivityIndicator size="small" color="#E0E0E0" style={{
                                    marginRight: 15,
                                }} />
                                <Text style={{
                                    fontSize: 12,
                                    fontWeight: "400",
                                    color: "#E0E0E0",
                                }}>
                                    Connecting...
                                </Text>
                            </>
                        : <>
                            <ActivityIndicator size="small" color="#E0E0E0" style={{
                                marginRight: 15,
                            }} />
                            <Text style={{
                                fontSize: 12,
                                fontWeight: "400",
                                color: "#E0E0E0",
                            }}>
                                Waiting for Network...
                            </Text>
                        </>
                    }
                </Text>
                <TouchableOpacity onPress={() => {
                    router.push("/settings");
                }}>
                    <Feather name="settings" size={24} color="#E0E0E0" />
                </TouchableOpacity>
            </View>
    )}}
        />
    )
}