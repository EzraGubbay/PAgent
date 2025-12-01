import { useState, useEffect, useRef } from "react";
import {
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Keyboard,
    Animated,
    LayoutAnimation,
    UIManager
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Svg, { Defs, Pattern, Circle, Rect } from "react-native-svg";
import { ChatMessages } from "../components/chatMessages";
import { ServerSideError, sendMessage } from "../networking";
import { MessageType } from "../types/message-type";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

export default function MainScreen({ navigation }: { navigation: any }) {
    const [message, setMessage] = useState("");
    const [chatHistory, setChatHistory] = useState<{ message: string; type: MessageType }[]>([]);

    const [isLoaded, setIsLoaded] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const paddingAnim = useRef(new Animated.Value(20)).current;

    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    useEffect(() => {
        loadChatHistory();

        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const keyboardWillShowSub = Keyboard.addListener(showEvent, () => {
            Animated.timing(paddingAnim, {
                toValue: 2,
                duration: 250,
                useNativeDriver: false,
            }).start();
        });
        const keyboardWillHideSub = Keyboard.addListener(hideEvent, () => {
            Animated.timing(paddingAnim, {
                toValue: 20,
                duration: 250,
                useNativeDriver: false,
            }).start();
        });

        return () => {
            keyboardWillShowSub.remove();
            keyboardWillHideSub.remove();
        };
    }, []);

    useEffect(() => {
        if (isLoaded) {
            AsyncStorage.setItem("@chatHistory", JSON.stringify(chatHistory)).catch((error) => {
                console.error("Error saving message history:", error);
            });
        }
    }, [chatHistory, isLoaded]);

    const loadChatHistory = async () => {
        try {
            const storedHistory = await AsyncStorage.getItem("@chatHistory");
            if (storedHistory) {
                setChatHistory(JSON.parse(storedHistory));
            }
        } catch (error) {
            console.error("Error loading message history:", error);
        } finally {
            setIsLoaded(true);
        }
    };

    const upload = async () => {
        const userMessageContent = message;
        setMessage(""); // Clear input immediately

        // Optimistically add user message
        setChatHistory(prev => [...prev, { message: userMessageContent, type: MessageType.User }]);

        try {
            const reply = await sendMessage(userMessageContent);
            // Add assistant response
            setChatHistory(prev => [...prev, { message: reply.reply, type: MessageType.Assistant }]);
        } catch (error) {
            if (error instanceof ServerSideError) {
                setChatHistory(prev => [...prev, { message: error.message, type: MessageType.Error }]);
            }
        }

    }

    const showSendButton = isFocused || message.trim().length > 0;

    useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [showSendButton]);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: "#0f0e0eff" }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
            {/* Background Pattern */}
            <View style={StyleSheet.absoluteFillObject}>
                <Svg height="100%" width="100%">
                    <Defs>
                        <Pattern
                            id="dotPattern"
                            x="0"
                            y="0"
                            width="20"
                            height="20"
                            patternUnits="userSpaceOnUse"
                        >
                            <Circle cx="2" cy="2" r="1" fill="#333" opacity="0.3" />
                        </Pattern>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#dotPattern)" />
                </Svg>
            </View>

            {/* Custom Header */}
            <View style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingTop: 45,
                paddingHorizontal: 20,
                paddingBottom: 10,
                backgroundColor: "#1C1C1C",
            }}>
                <View />
                <Text style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#E0E0E0",
                }}>
                    Assistant
                </Text>
                <TouchableOpacity onPress={() => {
                    navigation.navigate("Settings");
                }}>
                    <Feather name="settings" size={24} color="#E0E0E0" />
                </TouchableOpacity>
            </View>

            <ChatMessages chatHistory={chatHistory} />

            {/* Input Area */}
            <Animated.View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: paddingAnim,
                paddingTop: 2,
                backgroundColor: "#1C1C1C"
            }}>
                <TextInput
                    style={{
                        height: 30,
                        backgroundColor: "#333333",
                        borderRadius: 20,
                        paddingHorizontal: 15,
                        margin: 10,
                        marginLeft: 20,
                        marginRight: message.trim().length > 0 ? 0 : 20,
                        flex: 1,
                        color: "#E0E0E0",
                        fontSize: 16,
                        fontWeight: "600",
                    }}
                    onChangeText={(text) => { setMessage(text) }}
                    value={message}
                    keyboardAppearance="dark"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                {(message.trim().length > 0) && (
                    <TouchableOpacity
                        disabled={!message.trim()}
                        style={{
                            margin: 10,
                            marginRight: 20,
                            borderRadius: 20,
                            backgroundColor: "#4cd137",
                            padding: 10,
                            alignItems: "center",
                            justifyContent: "center",
                            width: 34,
                            height: 34,
                            opacity: !message.trim() ? 0.5 : 1
                        }}
                        onPress={() => { upload() }}>
                        <Feather name="send" size={14} color="black" />
                    </TouchableOpacity>
                )}
            </Animated.View>
        </KeyboardAvoidingView>
    );
}