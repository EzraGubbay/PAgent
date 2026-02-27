import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

import { MediaType } from "@/types/mediaType";

const mediaPostprocess = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets[0].base64) {
        const fileName = result.assets[0].fileName || `camera_image_${Date.now()}.jpg`;
        return {
            mimeType: 'image/jpeg',
            base64: result.assets[0].base64,
            fileName:fileName,
        }
    }
}

const documentPostprocess = async (result: DocumentPicker.DocumentPickerResult) => {
    if (!result.canceled) {
        try {
            const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const mimeType = result.assets[0].mimeType || "application/octet-stream";
            const fileName = result.assets[0].name;
            return {
                mimeType: mimeType,
                base64: base64,
                fileName: fileName,
            }
        } catch (error) {
            console.error("Error reading document:", error);
            alert("Failed to read document");
        }
    }
}

const requestPermissions = {
    [MediaType.Camera]: ImagePicker.requestCameraPermissionsAsync,
    [MediaType.Gallery]: ImagePicker.requestMediaLibraryPermissionsAsync,
    [MediaType.Document]: async () => ({ status: "granted" }),
}

const mediaPickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
    base64: true,
}

const documentPickerOptions: DocumentPicker.DocumentPickerOptions = {
    copyToCacheDirectory: true,
}

const launchPicker = {
    [MediaType.Camera]: async () => {
        const result = await ImagePicker.launchCameraAsync(mediaPickerOptions);
        return await mediaPostprocess(result);
    },
    [MediaType.Gallery]: async () => {
        const result = await ImagePicker.launchImageLibraryAsync(mediaPickerOptions);
        return await mediaPostprocess(result);
    },
    [MediaType.Document]: async () => {
        const result = await DocumentPicker.getDocumentAsync(documentPickerOptions);
        return await documentPostprocess(result);
    },
}

export const handleUserAddFile = async (mediaType: MediaType) => {
    // Async request permissions
    const { status } = await requestPermissions[mediaType]();
    if (status !== 'granted') {
        alert('Permission to access camera was denied');
        return;
    }

    // Async launch picker
    return await launchPicker[mediaType]();
}