import { View, FlatList } from "react-native"
import { MessageBubble } from "./messageBubble"
import { MessageType } from "../types/message-type";
import React, { useRef } from "react";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity, Text } from "react-native";

interface ChatMessagesProps {
    chatHistory: { message: string; type: MessageType }[];
}

export const ChatMessages = React.memo(({ chatHistory }: ChatMessagesProps) => {
    const flatListRef = useRef<FlatList>(null);
    const [showScrollButton, setShowScrollButton] = React.useState(false);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const prevHistoryLength = useRef(chatHistory.length);

    React.useEffect(() => {
        if (chatHistory.length > prevHistoryLength.current) {
            const lastMsg = chatHistory[chatHistory.length - 1];
            if (lastMsg.type === MessageType.User) {
                scrollToBottom();
            } else if (showScrollButton) {
                setUnreadCount(prev => prev + (chatHistory.length - prevHistoryLength.current));
            }
        }
        prevHistoryLength.current = chatHistory.length;
    }, [chatHistory, showScrollButton]);

    const handleScroll = (event: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 50;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

        if (isCloseToBottom) {
            setShowScrollButton(false);
            setUnreadCount(0);
        } else {
            setShowScrollButton(true);
        }
    };

    const scrollToBottom = () => {
        flatListRef.current?.scrollToEnd({ animated: true });
        setShowScrollButton(false);
        setUnreadCount(0);
    };

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                ref={flatListRef}
                data={chatHistory}
                keyboardDismissMode="on-drag"
                renderItem={({ item }) => (
                    <MessageBubble message={item.message} type={item.type} />
                )}
                keyExtractor={(_, index) => index.toString()}
                onContentSizeChange={() => {
                    if (!showScrollButton) {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }
                }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            />
            {showScrollButton && (
                <TouchableOpacity
                    onPress={scrollToBottom}
                    style={{
                        position: "absolute",
                        bottom: 20,
                        right: 20,
                        backgroundColor: "#333",
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                    }}
                >
                    <Feather name="chevron-down" size={24} color="#E0E0E0" />
                    {unreadCount > 0 && (
                        <View style={{
                            position: "absolute",
                            top: -5,
                            right: -5,
                            backgroundColor: "#27af15",
                            borderRadius: 10,
                            minWidth: 20,
                            height: 20,
                            alignItems: "center",
                            justifyContent: "center",
                            paddingHorizontal: 4,
                        }}>
                            <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
                                {unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            )}
        </View>
    )
});