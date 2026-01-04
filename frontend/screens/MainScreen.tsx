import { useState, useEffect, useRef, useCallback } from "react";
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
    AppState,
    ActivityIndicator,
    Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Svg, { Defs, Pattern, Circle, Rect } from "react-native-svg";
import { ChatMessages } from "../components/chatMessages";
import { ServerSideError, sendMessage, Attachment } from "../networking";
import { ChatMessage } from "../types/chat-message";
import { MessageType } from "../types/message-type";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import io, { Socket } from "socket.io-client";
import { loadUserData } from "../types/data";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "react-native-popup-menu";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

const Stack = createNativeStackNavigator();

import { SOCKET_URL } from "../config";

export default function MainScreen({ navigation }: { navigation: any }) {

    const [hasText, setHasText] = useState(false);
    const messageRef = useRef("");
    const inputRef = useRef<TextInput>(null);

    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

    const [isChatHistoryLoaded, setIsChatHistoryLoaded] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const [status, setStatus] = useState("disconnected");

    const socketRef = useRef<Socket | null>(null);
    const appState = useRef(AppState.currentState);

    const [finishedLoadingMessageQueue, setFinishedLoadingMessageQueue] = useState(true);

    useEffect(() => {
        let socket: Socket;

        const initSocket = async () => {
            // 1. Await the data FIRST
            const userData = await loadUserData();
            const uid = userData?.uid;
            console.log("userData", userData);

            if (!uid) {
                console.error("No User ID found, cannot connect socket.");
                return;
            }

            // 2. Initialize Socket with the REAL string ID
            socketRef.current = io(SOCKET_URL, {
                transports: ["websocket"],
                autoConnect: false, // We connect manually below
                auth: {
                    uid: uid, // Pass it simply here
                }
            });

            socket = socketRef.current;

            socket.on("connect", () => {
                setStatus("connected");
                console.log("Socket connected:", socket.id);
            });

            socket.on("connect_error", (err) => {
                console.error("Socket Connection Error:", err.message);
            });

            socket.on("disconnect", (reason) => {
                setStatus("disconnected");
                console.log("Socket disconnected:", reason);
            });

            socket.on("llm_response", (data) => {
                console.log("Socket received llm_response:", data);
                setChatHistory(prev => [...prev, { message: data.response.message, type: data.response.type }]);
            });

            socket.on("message_queue_loading_start", () => {
                setFinishedLoadingMessageQueue(false);
            })

            socket.on("message_queue_loading_end", () => {
                setFinishedLoadingMessageQueue(true);
            })

            // 3. Connect
            socket.connect();
        };

        initSocket();

        // AppState Listener Logic
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                console.log('App active: Connecting socket...');
                socketRef.current?.connect();
            } else if (nextAppState.match(/inactive|background/)) {
                console.log('App background: Disconnecting socket...');
                socketRef.current?.disconnect();
            }
            appState.current = nextAppState;
        });

        return () => {
            socketRef.current?.disconnect();
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        loadChatHistory();
    }, []);

    useEffect(() => {
        if (isChatHistoryLoaded) {
            AsyncStorage.setItem("@chatHistory", JSON.stringify(chatHistory)).catch((error) => {
                console.error("Error saving message history:", error);
            });
        }
    }, [chatHistory, isChatHistoryLoaded]);

    const loadChatHistory = async () => {
        try {
            const storedHistory = await AsyncStorage.getItem("@chatHistory");
            if (storedHistory) {
                setChatHistory(JSON.parse(storedHistory));
            }
        } catch (error) {
            console.error("Error loading message history:", error);
        } finally {
            setIsChatHistoryLoaded(true);
        }
    };

    const upload = async () => {
        const userData = await loadUserData();
        const userMessageContent = messageRef.current;
        setHasText(false); // Clear state
        messageRef.current = ""; // Clear ref
        inputRef.current?.clear(); // Clear input UI


        // Optimistically add user message
        setChatHistory(prev => [...prev, { message: userMessageContent, type: MessageType.User, attachments: attachments }]);

        // Clear inputs immediately
        setAttachments([]);
        setShowAttachments(false);

        Keyboard.dismiss();
        try {
            const reply = await sendMessage({
                uid: userData.uid,
                prompt: userMessageContent,
                notificationToken: userData.notificationToken,
                notify: userData.receiveNotifications,
                attachments: attachments,
            });

            if (reply.status == "success") {
                console.log("LLM finished processing");
                console.log(reply.response);
            } else {
                console.log(reply.error);
            }
        } catch (error) {
            if (error instanceof ServerSideError) {
                setChatHistory(prev => [...prev, { message: error.message, type: MessageType.Error }]);
            }
        }

    }

    const showSendButton = isFocused || hasText;

    const useKeyboardVisible = () => {
        const [visible, setVisible] = useState(false);

        useEffect(() => {
            const show = Keyboard.addListener("keyboardWillShow", () => setVisible(true));
            const hide = Keyboard.addListener("keyboardWillHide", () => setVisible(false));

            return () => {
                show.remove();
                hide.remove();
            }
        }, []);

        return visible;
    };

    useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [showSendButton]);

    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [showAttachments, setShowAttachments] = useState(false);
    const handleAddFile = async (type: 'camera' | 'gallery' | 'document') => {
        if (type === 'camera') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access camera was denied');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
                base64: true,
            });
            if (!result.canceled && result.assets[0].base64) {
                setShowAttachments(true);
                const fileName = result.assets[0].fileName || `camera_image_${Date.now()}.jpg`;
                setAttachments([...attachments, { mimeType: 'image/jpeg', base64: result.assets[0].base64, fileName: fileName }]);
            }
        } else if (type === 'gallery') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access camera was denied');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
                base64: true,
            });
            console.log(result);
            if (!result.canceled && result.assets[0].base64) {
                setShowAttachments(true);
                const fileName = result.assets[0].fileName || `gallery_image_${Date.now()}.jpg`;
                setAttachments([...attachments, { mimeType: 'image/jpeg', base64: result.assets[0].base64, fileName: fileName }]);
            }
        } else if (type === 'document') {
            const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
            });
            if (!result.canceled) {
                try {
                    const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    setShowAttachments(true);
                    const mimeType = result.assets[0].mimeType || "application/octet-stream";
                    const fileName = result.assets[0].name;
                    setAttachments([...attachments, { mimeType: mimeType, base64: base64, fileName: fileName }]);
                } catch (error) {
                    console.error("Error reading document:", error);
                    alert("Failed to read document");
                }
            }
        }
    };

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: "#1C1C1C",
            }}
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
                height: 90,
                paddingTop: 50,
                paddingHorizontal: 20,
                backgroundColor: "#1C1C1C",
            }}>
                {/* <View /> */}
                <View style={{
                    backgroundColor: status === "connected" ? "#00FF00" : "#FF0000",
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
                    {status === "connected"
                        ? finishedLoadingMessageQueue
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
                    navigation.navigate("Settings", {
                        onChatErased: () => {
                            setChatHistory([]);
                            AsyncStorage.removeItem("@chatHistory"); // Ensure it's cleared in storage too if not already
                        }
                    });
                }}>
                    <Feather name="settings" size={24} color="#E0E0E0" />
                </TouchableOpacity>
            </View>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <Animated.View
                    style={{
                        flex: 1,
                        position: "relative"
                    }}
                >
                    <ChatMessages chatHistory={chatHistory} />

                    {showAttachments && (
                        <View style={{
                            position: "relative",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: "#151515",
                            padding: 10,
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            marginTop: 10
                        }}>
                            <View style={{
                                flexDirection: "row",
                                alignItems: "flex-end",
                                justifyContent: "space-between",
                            }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowAttachments(false);
                                        setAttachments([]);
                                    }}
                                    style={{
                                        marginLeft: "auto"
                                    }}>
                                    <Feather name="x" size={20} color="#E0E0E0" />
                                </TouchableOpacity>
                            </View>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    paddingHorizontal: 15,
                                }}
                            >
                                {attachments.map((attachment, index) => (
                                    <View key={index}>
                                        <Image
                                            source={{ uri: `data:${attachment.mimeType};base64,${attachment.base64}` }}
                                            style={{ width: 60, height: 90, marginHorizontal: 5, borderRadius: 12 }}
                                        />
                                        <TouchableOpacity
                                            onPress={() => {
                                                setAttachments(attachments.filter((_, i) => i !== index));
                                            }}
                                            style={{
                                                position: "absolute",
                                                top: -5,
                                                right: -2,
                                                backgroundColor: "#3C3C3C",
                                                borderRadius: 20
                                            }}
                                        >
                                            <Feather name="x" size={14} color="#E0E0E0" />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                {/* Spacer to align all files to the left */}
                                <View style={{ flex: 1 }} />
                            </View>
                        </View>
                    )}

                    {/* Input Area */}
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: useKeyboardVisible() ? 0 : 30,
                        backgroundColor: "#1C1C1C"
                    }}>
                        <Menu>
                            <MenuTrigger>
                                <Feather
                                    name="plus"
                                    size={26}
                                    color="#E0E0E0"
                                    style={{
                                        alignItems: "center",
                                        justifyContent: "center",
                                        paddingLeft: 20
                                    }}
                                />
                            </MenuTrigger>
                            <MenuOptions optionsContainerStyle={{
                                backgroundColor: "#2C2C2C",
                                borderRadius: 12,
                                padding: 5,
                                width: 220,
                                marginTop: useKeyboardVisible() ? -150 : -50, // Adjust position if needed
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}>
                                <MenuOption onSelect={() => handleAddFile('camera')} style={{ padding: 10 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Feather name="camera" size={20} color="#E0E0E0" style={{ marginRight: 10 }} />
                                        <Text style={{ color: "#E0E0E0", fontSize: 16 }}>Take Photo</Text>
                                    </View>
                                </MenuOption>
                                <View style={{ height: 1, backgroundColor: "#3A3A3A", marginHorizontal: 10 }} />
                                <MenuOption onSelect={() => handleAddFile('gallery')} style={{ padding: 10 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Feather name="image" size={20} color="#E0E0E0" style={{ marginRight: 10 }} />
                                        <Text style={{ color: "#E0E0E0", fontSize: 16 }}>Choose from Gallery</Text>
                                    </View>
                                </MenuOption>
                                <View style={{ height: 1, backgroundColor: "#3A3A3A", marginHorizontal: 10 }} />
                                <MenuOption onSelect={() => handleAddFile('document')} style={{ padding: 10 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Feather name="file-text" size={20} color="#E0E0E0" style={{ marginRight: 10 }} />
                                        <Text style={{ color: "#E0E0E0", fontSize: 16 }}>Browse Files</Text>
                                    </View>
                                </MenuOption>
                            </MenuOptions>
                        </Menu>
                        <TextInput
                            style={{
                                height: 30,
                                backgroundColor: "#333333",
                                borderRadius: 20,
                                paddingHorizontal: 15,
                                margin: 10,
                                marginLeft: 10,
                                marginRight: hasText ? 0 : 20,
                                flex: 1,
                                color: "#E0E0E0",
                                fontSize: 16,
                                fontWeight: "400",
                            }}
                            ref={inputRef}
                            onChangeText={(text) => {
                                messageRef.current = text;
                                const isNowEmpty = text.trim().length === 0;
                                if (isNowEmpty === hasText) {
                                    setHasText(!isNowEmpty);
                                }
                            }}
                            keyboardAppearance="dark"
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                        {hasText && (
                            <TouchableOpacity
                                disabled={!hasText}
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
                                    opacity: !hasText ? 0.5 : 1
                                }}
                                onPress={() => { upload() }}>
                                <Feather name="send" size={14} color="black" />
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
}