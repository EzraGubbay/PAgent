import { useEffect } from "react";
import { useKeyboardVisible, useToggle } from "@/hooks";
import {
    View,
    TextInput,
    TouchableOpacity,
    LayoutAnimation,
    Keyboard,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTextInputField } from "@/hooks";
import { Attachment, ChatMessage, MessageType, ServerSideError } from "@/types";
import { AttachmentMenuButton } from "./attachmentMenuButton";

export const InputBar = (
    {
        addChatMessage,
        addAttachment,
    }: {
        addChatMessage: (message: ChatMessage) => void,
        addAttachment: (attachment: Attachment) => void,
    }
) => {

    const [hasText, toggleHasText] = useToggle();
    const [textInputRef, updatePrompt, submitPrompt] = useTextInputField();

    useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [hasText]);

    const handleSend = async () => {
        /**
         * Clear input text from UI.
         * Reset input field UI.
         * Dismiss keyboard.
         * Create a new chat message.
         * Call API to send user message.
         * Clear current saved prompt from prompt reference.
         */

        console.log("Send Button Clicked");

        textInputRef.current?.clear();
        toggleHasText();
        Keyboard.dismiss();
        const prompt = submitPrompt();
        addChatMessage({
            message: prompt,
            type: MessageType.User,
        });
        console.log("Added message to queue: ", prompt);
        // Socket API handles the actual network request in index.tsx via handleAddChatMessage
    }

    const handleAddAttachment = (attachment: Attachment) => {
        addAttachment(attachment);
    }

    return (
    <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: useKeyboardVisible() ? 0 : 30,
        backgroundColor: "#1C1C1C"
    }}>
        {/* Add Attachment Button */}
        <AttachmentMenuButton addAttachment={handleAddAttachment} />

        {/* Text Input Field */}
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
            ref={textInputRef}
            onChangeText={(prompt) => {
                updatePrompt(prompt);
                const isNowEmpty = prompt.trim().length === 0;
                if (isNowEmpty === hasText) {
                    toggleHasText();
                }
            }}
            keyboardAppearance="dark"
        />

        {/* Send Button */}
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
                onPress={ handleSend }>
                <Feather name="send" size={14} color="black" />
            </TouchableOpacity>
        )}
    </View>
    );
}