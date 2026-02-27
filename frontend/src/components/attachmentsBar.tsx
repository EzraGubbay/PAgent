import {
    View,
    TouchableOpacity,
    Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Attachment } from "@/types";

export const AttachmentsBar = (
    {
        attachments,
        removeAttachment,
        onClose,
    }: {
        attachments: Attachment[],
        removeAttachment: (index: number, attachment: Attachment) => void,
        onClose: () => void,
    }
) => (
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
                onPress={onClose}
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
                        onPress={() => removeAttachment(index, attachments[index])}
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
);