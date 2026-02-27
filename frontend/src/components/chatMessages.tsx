import { View, FlatList, Keyboard } from "react-native";
import { MessageBubble } from "@/components/messageBubble";
import { MessageType } from "@/types/messageType";
import { ChatMessage } from "@/types/chatMessage";
import React, { useRef } from "react";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity, Text } from "react-native";

interface ChatMessagesProps {
    chatHistory: ChatMessage[];
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
        const isCloseToBottom = contentOffset.y <= paddingToBottom;

        if (isCloseToBottom) {
            setShowScrollButton(false);
            setUnreadCount(0);
        } else {
            setShowScrollButton(true);
        }
    };

    const scrollToBottom = () => {
        flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
        setShowScrollButton(false);
        setUnreadCount(0);
    };

    return (
        <View style={{ flex: 1, marginBottom: -10 }}>
            <FlatList
                inverted
                ref={flatListRef}
                data={[...chatHistory].reverse()}
                keyboardDismissMode="on-drag"
                renderItem={({ item }) => (
                    <MessageBubble message={item.message} type={item.type} attachments={item.attachments} />
                )}
                keyExtractor={(_, index) => index.toString()}
                onContentSizeChange={() => {
                    if (!showScrollButton) {
                        flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
                    }
                }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={{ flex: 1 }}
            />
            {showScrollButton && (
                <TouchableOpacity
                    onPress={scrollToBottom}
                    style={{
                        position: "absolute",
                        bottom: 20,
                        right: 20,
                        backgroundColor: "#333",
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                    }}
                >
                    <Feather name="chevron-down" size={18} color="#E0E0E0" />
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