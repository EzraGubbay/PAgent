import { Pressable, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Attachment, MediaType } from "@/types";
import { handleUserAddFile, loadUserData } from "@/utils";
import { uploadAttachment } from "@/api/file";

export const AttachmentMenuButton = (
    {
        addAttachment
    }: {
        addAttachment: (attachment: Attachment) => void,
    }
) => {

    const onMenuItemSelect = async (mediaType: MediaType) => {
        const attachment = await handleUserAddFile(mediaType);
        if (attachment) {
            addAttachment(attachment);
            const userData = await loadUserData();
            const formData = new FormData();
            formData.append('uid', userData.uid);
            formData.append('file', {
                uri: `data:${attachment.mimeType};base64,${attachment.base64}`,
                name: attachment.fileName,
                type: attachment.mimeType,
            } as any);
            uploadAttachment(formData);
        }
    }

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <TouchableOpacity>
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
                </TouchableOpacity>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.Item
                    key="document"
                    onSelect={() => onMenuItemSelect(MediaType.Document)}
                >
                    <DropdownMenu.ItemTitle>File</DropdownMenu.ItemTitle>
                    <DropdownMenu.ItemIcon
                        ios={{
                            name: "doc",
                        }}
                        androidIconName="ic_menu_agenda"
                        style={{
                            alignSelf: "flex-start"
                        }}
                    >
                    </DropdownMenu.ItemIcon>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    key="gallery"
                    onSelect={() => onMenuItemSelect(MediaType.Gallery)}
                >
                    <DropdownMenu.ItemTitle>Gallery</DropdownMenu.ItemTitle>
                    <DropdownMenu.ItemIcon
                        ios={{
                            name: "photo.on.rectangle",
                        }}
                        androidIconName="ic_menu_gallery"
                        style={{
                            alignSelf: "flex-start"
                        }}
                    >
                    </DropdownMenu.ItemIcon>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    key="camera"
                    onSelect={() => onMenuItemSelect(MediaType.Camera)}
                >
                    <DropdownMenu.ItemTitle>Camera</DropdownMenu.ItemTitle>
                    <DropdownMenu.ItemIcon
                        ios={{
                            name: "camera",
                        }}
                        androidIconName="ic_menu_camera"
                        style={{
                            alignSelf: "flex-start"
                        }}
                    >
                    </DropdownMenu.ItemIcon>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}