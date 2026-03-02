
import { useRef, useState } from "react";
import { 
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
} from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { Feather } from "@expo/vector-icons";

const MODAL_WIDTH = 80;

export const EditNotificationTokenModal = ({
    showModal,
    onEdit,
    onClose,
}: {
    showModal: boolean,
    onEdit: (token: string) => void,
    onClose: () => void,
}) => {

    const tokenInputRef = useRef<TextInput>(null);
    const [token, setToken] = useState<string>('');

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={showModal}
            onRequestClose={onClose}
        >
            <View style={styles.editModalBackgroundShadow}>
                <View style={styles.editTokenModal}>
                    <View style={styles.modalHeader}>

                        {/* Spacer */}
                        <View />

                        {/* Close Button */}
                        <Text style={styles.editTokenTitle}>Edit Notification Token</Text>
                        <TouchableOpacity style={styles.closeEditTokenModalButton} onPress={onClose}>
                            <Feather name="x" size={24} color="#FF453A" />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={styles.editTokenInput}
                        placeholder="Enter Notification Token"
                        placeholderTextColor="#6C6C6C"
                        ref={tokenInputRef}
                        value={token}
                        onChangeText={setToken}
                    />
                    <View style={styles.editModalTokenButtonContainer}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            
                            {/* Paste from clipboard button */}
                            <TouchableOpacity
                                onPress={async () => {
                                    const text = await Clipboard.getString();
                                    setToken(text);
                                }}
                                style={{
                                    ...styles.editModalTokenButton,
                                    borderRadius: 0,
                                    borderTopLeftRadius: 12,
                                    borderBottomLeftRadius: 12,
                                }}>
                                <Feather name="clipboard" size={24} color="#E0E0E0" />
                            </TouchableOpacity>

                            {/* Clear button */}
                            <TouchableOpacity
                                onPress={() => {
                                    tokenInputRef.current?.clear();
                                    setToken("");
                                }}
                                style={{
                                    ...styles.editModalTokenButton,
                                    borderRadius: 0,
                                    borderTopRightRadius: 12,
                                    borderBottomRightRadius: 12,
                                }}>
                                <Feather name="trash" size={24} color="#FF453A" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={{ ...styles.editModalTokenButton, width: 70 }}
                            onPress={() => onEdit(token)}>
                            <Text style={styles.settingsText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginVertical: 30,
        width: "100%",
    },
    closeEditTokenModalButton: {
        paddingRight: 5,
        marginBottom: 20,
        marginTop: -20,
    },
    editTokenModal: {
        backgroundColor: "#1C1C1C",
        alignItems: "center",
        justifyContent: "space-between",
        width: `${MODAL_WIDTH}%`,
        height: "30%",
        borderRadius: 12,
    },
    editTokenTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#E0E0E0",
        marginLeft: 30,
    },
    editTokenInput: {
        backgroundColor: "#2C2C2C",
        color: "#E0E0E0",
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 12,
        height: 50,
        width: "90%",
    },
    editModalTokenButton: {
        width: 60,
        height: 50,
        backgroundColor: "#2C2C2C",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#3A3A3A",
        justifyContent: "center",
        alignItems: "center",
    },
    editModalTokenButtonContainer: {
        width: "90%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: 12,
        height: 50,
        marginVertical: 15,
    },
    settingsText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#E0E0E0",
    },
    editModalBackgroundShadow: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1000,
        position: "absolute",
    },
})