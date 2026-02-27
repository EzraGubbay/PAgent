import { MessageType } from "@/types/messageType";
import { Attachment } from "./attachment";

export type AuthPayload = {
    username: string,
    password: string,
}

export interface AuthResponse extends Response {
    response: string,
}

export type SocketConnectResponse = {
    token: string,
}

export interface LLMResponse {
    message: string,
    type: MessageType
}

export interface SendMessageRequest {
    uid: string,
    prompt: string,
    notificationToken: string | null,
}

export interface RegisterNotificationTokenRequest {
    uid: string,
    notificationToken: string,
}

export interface ResetChatRequest {
    uid: string,
}

export interface UploadFileObjectRequest {
    uid: string,
    file: Attachment,
}

export interface DeleteFileObjectRequest {
    uid: string,
    filename: string,
}
