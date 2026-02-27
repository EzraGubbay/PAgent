import { useEffect } from "react";
import {
    View,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from "react-native";
import { ChatMessages } from "@/components/chatMessages";
import { ChatMessage } from "@/types/chatMessage";
import React from "react";

import { Header } from "@/components/chatHeader";
import { AttachmentsBar } from "@/components/attachmentsBar";
import { ChatBackgroundPattern } from "@/components/chatBackground";
import { useAttachments } from "@/hooks/useAttachments";
import { InputBar } from "@/components/inputBar";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useSocketAPI } from "@/context/SocketContext";
import { Attachment } from "@/types";
import { deleteAttachment } from "@/api/file";
import { loadUserData } from "@/utils";

export default function MainScreen({ route }: { route: any }) {

    const [chatHistory, addChatMessage] = useChatHistory();
    const { socket, sendMessage: socketSendMessage, isConnected, messageQueueFlushed } = useSocketAPI();
    const [showAttachments, attachments, closeAttachmentsBar, addAttachment, removeAttachment] = useAttachments();
    
    useEffect(() => {
        if (!socket) return;
        
        const handleLLMResponse = (data: { response: ChatMessage }) => {
            console.log("Socket received llm_response:", data);
            addChatMessage({
                message: data.response.message,
                type: data.response.type,
            });
        };

        socket.on("llm_response", handleLLMResponse);

        return () => {
            socket.off("llm_response", handleLLMResponse);
        };
    }, [socket, addChatMessage]);

    const handleRemoveAttachment = async (index: number, attachment: Attachment) => {
        removeAttachment(index);

        const userData = await loadUserData();
        const formData = new FormData();
        formData.append('uid', userData.uid);
        formData.append('filename', attachment.fileName);
        deleteAttachment(formData);
    }

    const handleAddChatMessage = (message: ChatMessage) => {
        addChatMessage({...message, attachments: attachments});
        closeAttachmentsBar();
        socketSendMessage(message.message);
    };

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: "#1C1C1C",
            }}
        >
            {/* Background Pattern */}
            <ChatBackgroundPattern />

            {/* Custom Header */}
            <Header connectionStatus={isConnected} messageQueueFlushed={messageQueueFlushed} />
            <View style={{borderBottomWidth: 1, borderColor: "#333"}} />
            
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

                    {/* Scrollable Chat Messages */}
                    <ChatMessages chatHistory={chatHistory} />

                    {/* Attachments Bar */}
                    { showAttachments && (<AttachmentsBar attachments={attachments} onClose={closeAttachmentsBar} removeAttachment={handleRemoveAttachment} />) }

                    {/* Input Area */}
                    <InputBar addChatMessage={handleAddChatMessage} addAttachment={addAttachment}/>

                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
}