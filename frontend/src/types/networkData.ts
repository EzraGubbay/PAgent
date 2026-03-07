import { MessageType } from "@/types/messageType";
import { Attachment } from "./attachment";

export type AuthPayload = {
    email: string,
    password: string,
}

export interface AuthResponse {
    status: boolean,
    accessToken?: string,
    refreshToken?: string,
    detail?: string,
}

export type SocketConnectResponse = {
    token: string,
}

export interface LLMResponse {
    message: string,
    type: MessageType
}

export interface SendMessageRequest {
    prompt: string,
    notificationToken: string | null,
}

export interface RegisterNotificationTokenRequest {
    notificationToken: string,
}

export interface UploadFileObjectRequest {
    file: Attachment,
}

export interface DeleteFileObjectRequest {
    filename: string,
}
