import { Attachment } from "@/types";
import { API_URL } from "./config";

export const uploadAttachment = async (formData: FormData) => {
    const response = await fetch(`${API_URL}/uploadFileObject`, {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Failed to upload attachment");
    }

    return await response.json();
}

export const deleteAttachment = async (formData: FormData) => {
    const response = await fetch(`${API_URL}/deleteFileObject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Failed to delete attachment");
    }

    return await response.json();
}