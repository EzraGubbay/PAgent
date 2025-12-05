import { View, Text, StyleSheet } from "react-native";
import { MessageType } from "../types/message-type";
import { Dimensions } from "react-native";
import Svg, { Path } from "react-native-svg";

interface MessageBubbleProps {
    message: string;
    type: MessageType;
}

export const MessageBubble = ({
    message,
    type,
}: {
    message: string;
    type: MessageType;
}) => {
    const formatMessage = (text: string) => {
        // Split by formatting markers: *bold*, _italic_, ~strike~
        const parts = text.split(/(\*[^*]+\*|_[^_]+_|~[^~]+~)/g);

        return parts.map((part, index) => {
            if (part.startsWith("*") && part.endsWith("*")) {
                return <Text key={index} style={{ fontWeight: "bold" }}>{part.slice(1, -1)}</Text>;
            } else if (part.startsWith("_") && part.endsWith("_")) {
                return <Text key={index} style={{ fontStyle: "italic" }}>{part.slice(1, -1)}</Text>;
            } else if (part.startsWith("~") && part.endsWith("~")) {
                return <Text key={index} style={{ textDecorationLine: "line-through" }}>{part.slice(1, -1)}</Text>;
            }
            return <Text key={index}>{part}</Text>;
        });
    };

    return (
        <View style={
            type === MessageType.User ? userMessageStyle
                : type === MessageType.Assistant ? assistantMessageStyle
                    : systemMessageStyle
        }>
            <Text style={{
                fontSize: 16,
                fontWeight: "400",
                color: type === MessageType.User || type === MessageType.Assistant ? "#E0E0E0" : "#f5b505ff"
            }}>
                {formatMessage(message)}
            </Text>

            {/* User Tail */}
            {type === MessageType.User && (
                <View style={{
                    position: "absolute",
                    right: -20,
                    bottom: 0,
                    width: 20,
                    height: 20,
                }}>
                    <Svg width={12} height={20} viewBox="0 0 12 20">
                        <Path
                            d="M0 0 Q0 10 12 20 Q0 18 0 14 Z"
                            fill="#134d37"
                        />
                    </Svg>
                </View>
            )}

            {/* Assistant Tail */}
            {type === MessageType.Assistant && (
                <View style={{
                    position: "absolute",
                    left: -20,
                    bottom: 0,
                    width: 20,
                    height: 20,
                    transform: [{ scaleX: -1 }] // Mirror the user tail
                }}>
                    <Svg width={20} height={20} viewBox="0 0 20 20">
                        <Path
                            d="M0 0 Q0 10 12 20 Q0 18 0 14 Z"
                            fill="#55545457"
                        />
                    </Svg>
                </View>
            )}
        </View>
    );
}

type MessageBubbleStyle = {
    backgroundColor: string;
    padding: number;
    borderRadius: number;
    marginBottom: number;
    alignSelf: "flex-end" | "flex-start" | "center";
    margin: number;
    minWidth: number;
    alignItems: "center" | "flex-start" | "flex-end";
    marginLeft?: number;
    marginRight?: number;
    borderBottomRightRadius?: number;
    borderBottomLeftRadius?: number;
}

const userMessageStyle: MessageBubbleStyle = {
    backgroundColor: "#134d37",
    padding: 10,
    borderRadius: 10,
    borderBottomRightRadius: 5, // Remove corner for tail
    marginBottom: 10,
    alignSelf: "flex-end",
    margin: 10,
    marginRight: 15, // Extra margin for tail
    marginLeft: 50, // Large margin on the left to distinguish from assistant messages
    minWidth: Dimensions.get("window").width * 0.15,
    alignItems: "flex-start",
};

const assistantMessageStyle: MessageBubbleStyle = {
    backgroundColor: "#55545457",
    padding: 10,
    borderRadius: 10,
    borderBottomLeftRadius: 5, // Remove corner for tail
    marginBottom: 10,
    alignSelf: "flex-start",
    margin: 10,
    marginLeft: 15, // Extra margin for tail
    marginRight: 50, // Large margin on the right to distinguish from user messages
    minWidth: Dimensions.get("window").width * 0.15,
    alignItems: "flex-start",
};

const systemMessageStyle: MessageBubbleStyle = {
    backgroundColor: "#1f1e1d6a",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignSelf: "center",
    margin: 10,
    minWidth: Dimensions.get("window").width - 20,
    alignItems: "center",
};