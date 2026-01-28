import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadUserData } from "@/types/data";
import { API_URL } from "./config";

export class ServerSideError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ServerSideError";
    }
}

export const connect = async () => {
    const userData = await loadUserData();
    const response = await fetch(`${API_URL}/connect`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            uid: userData.uid
        })
    });

    if (response.status >= 500) {
        throw new ServerSideError(`HTTP error! status: ${response.status}`);
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

export const login = async (username: string, passhash: string) => {
    const userData = await loadUserData();
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            uid: userData.uid,
            username: username,
            passhash: passhash
        })
    });

    if (response.status >= 500) {
        throw new ServerSideError(`HTTP error! status: ${response.status}`);
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

export interface Attachment {
    mimeType: string;
    base64: string;
    fileName: string;
}

export const sendMessage = async (data: { uid: string, prompt: string, notificationToken: string, notify: boolean, attachments?: Attachment[] }) => {
    console.log("Sending message:", data);
    const response = await fetch(`${API_URL}/sendMessage`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (response.status >= 500) {
        throw new ServerSideError(`HTTP error! status: ${response.status}`);
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reply = await response.json();
    return reply;
};

export const remoteEraseAssistantChat = async () => {
    const userData = await loadUserData();
    console.log("Erasing assistant chat for user:", userData);
    const response = await fetch(`${API_URL}/loadNewChat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid: userData.uid }),
    });

    if (response.status >= 500) {
        throw new ServerSideError(`HTTP error! status: ${response.status}`);
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reply = await response.json();
    console.log("Remote erase assistant chat reply:", reply);
    return reply;
};